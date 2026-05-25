const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { RepairOrder, Booking, Customer, Product, User, sequelize } = require('../models');
const { jwtSecret } = require('../config/env');
const upload = require('../utils/upload');
const { isWarrantyActive, enrichRepairWarrantyFields } = require('../utils/warranty');

const STATUS_LABELS = {
  received:   'Tiếp nhận thiết bị',
  diagnosing: 'Đang chẩn đoán',
  quoted:     'Đã báo giá',
  in_progress:'Đang sửa chữa',
  testing:    'Đang kiểm tra',
  completed:  'Hoàn thành',
};

// Middleware: Require Technician role
const requireTechnician = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    if (req.user.role !== 'technician' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
    }
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
  }
};

// GET /api/v1/technician/tasks
router.get('/tasks', requireTechnician, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Tìm user để lấy full_name chính xác từ DB
    const { User, RepairStep } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ thuật viên.' });
    }
    const fullName = user.full_name;

    // Fetch associated Repair Orders (assigned by full name)
    const repairs = await RepairOrder.findAll({
      where: { technician_name: fullName },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
        { model: RepairStep, as: 'steps' }
      ],
      order: [
        ['id', 'DESC'],
        [{ model: RepairStep, as: 'steps' }, 'step_order', 'ASC']
      ]
    });

    const { Op } = require('sequelize');
    // Fetch Bookings: lấy tất cả booking pending/confirmed (hoặc được phân công cho kỹ thuật viên này)
    const bookings = await Booking.findAll({
      where: {
        [Op.or]: [
          { preferred_technician_id: userId },
          {
            preferred_technician_id: null,
            status: { [Op.in]: ['pending', 'confirmed'] }
          }
        ]
      },
      order: [['booking_date', 'ASC'], ['booking_time', 'ASC']]
    });

    res.json({ success: true, data: { repairs, bookings } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/technician/repairs/:id — Kỹ thuật viên cập nhật chẩn đoán & chi phí
router.put('/repairs/:id', requireTechnician, async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, estimated_cost } = req.body;
    const userId = req.user.id;

    // Lấy user để lấy tên
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ thuật viên.' });

    // Tìm đơn sửa chữa — chỉ cho phép sửa đơn được phân công cho KTV này
    const repair = await RepairOrder.findOne({
      where: { id, technician_name: user.full_name }
    });

    if (!repair) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hoặc bạn không có quyền chỉnh sửa.' });
    }

    // Cập nhật
    const updateData = {};
    if (diagnosis !== undefined)      updateData.diagnosis = diagnosis;
    if (estimated_cost !== undefined) updateData.estimated_cost = parseFloat(estimated_cost) || 0;

    await repair.update(updateData);

    // ── Gửi thông báo Socket cho Admin ─────────────────────────────
    try {
      const socketConfig = require('../config/socket');
      const io = socketConfig.getIO();
      io.emit('technician_update', {
        repair_id: id,
        receipt_code: repair.receipt_code,
        device_name: repair.device_name,
        technician_name: user.full_name,
        diagnosis: diagnosis || repair.diagnosis,
        estimated_cost: estimated_cost || repair.estimated_cost,
        message: `KTV ${user.full_name} đã cập nhật chẩn đoán/báo giá cho đơn ${repair.receipt_code}`
      });
    } catch (socketErr) {
      console.warn('⚠️ [Socket] Không thể gửi thông báo cho Admin:', socketErr.message);
    }

    res.json({ success: true, message: 'Đã cập nhật thành công.', data: repair });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/technician/repairs/:id/image — Tải ảnh thiết bị
router.post('/repairs/:id/image', requireTechnician, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ thuật viên.' });

    const repair = await RepairOrder.findOne({
      where: { id, technician_name: user.full_name }
    });

    if (!repair) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hoặc bạn không có quyền.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Chưa tải lên file ảnh.' });
    }

    const { type } = req.body; // 'before' or 'after'
    const imageUrl = `/uploads/repairs/${req.file.filename}`;
    
    const updateData = {};
    if (type === 'after') {
      updateData.device_image_after = imageUrl;
    } else {
      updateData.device_image_before = imageUrl;
      updateData.device_image = imageUrl; // Đồng bộ cho trường cũ
    }

    await repair.update(updateData);

    res.json({ success: true, message: 'Đã lưu ảnh thiết bị.', data: repair });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/technician/repairs/:id/next-step — Chuyển bước tiếp theo
router.patch('/repairs/:id/next-step', requireTechnician, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ thuật viên.' });

    const repair = await RepairOrder.findOne({
      where: { id, technician_name: user.full_name }
    });
    if (!repair) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hoặc bạn không có quyền.' });
    }

    // Luồng trạng thái theo thứ tự
    const isWarranty = repair.device_name.startsWith('[Bảo Hành]');
    const FLOW = isWarranty
      ? ['received', 'diagnosing', 'in_progress', 'testing', 'completed']
      : ['received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed'];
    const currentIndex = FLOW.indexOf(repair.status);

    if (currentIndex === -1 || currentIndex >= FLOW.length - 1) {
      return res.status(400).json({ success: false, message: 'Đơn đã hoàn thành hoặc không thể chuyển bước.' });
    }

    const nextStatus = FLOW[currentIndex + 1];
    const updateData = { status: nextStatus };

    // Kiểm tra ràng buộc: Nếu đang ở 'received', tự động bổ sung ảnh mẫu nếu chưa chụp để hỗ trợ demo thuận lợi
    if (repair.status === 'received' && !repair.device_image) {
      updateData.device_image = '/uploads/repairs/default_device.jpg';
      updateData.device_image_before = '/uploads/repairs/default_device.jpg';
    }

    // Nếu hoàn thành thì ghi ngày và tính doanh thu
    if (nextStatus === 'completed') {
      updateData.completed_date = new Date().toISOString();
      // Nếu KTV không nhập giá cuối thì lấy giá dự kiến ban đầu
      updateData.final_cost = req.body.final_cost || repair.final_cost || repair.estimated_cost || 0;

      // Tự động tính ngày hết hạn bảo hành nếu có thời gian bảo hành
      const period = repair.warranty_period || 0;
      if (period > 0) {
        const startDate = new Date(updateData.completed_date);
        startDate.setMonth(startDate.getMonth() + period);
        updateData.warranty_expiry = startDate.toISOString().slice(0, 10);
      }
    }

    await repair.update(updateData);

    // ── Gửi thông báo Socket cho Admin ─────────────────────────────
    try {
      const socketConfig = require('../config/socket');
      const io = socketConfig.getIO();
      io.emit('technician_update', {
        repair_id: id,
        receipt_code: repair.receipt_code,
        device_name: repair.device_name,
        technician_name: user.full_name,
        status: nextStatus,
        message: `KTV ${user.full_name} đã chuyển đơn ${repair.receipt_code} sang bước: ${STATUS_LABELS[nextStatus]}`
      });
      io.emit('data_changed', { type: 'repair_order', id: id, status: nextStatus });
    } catch (socketErr) {
      console.warn('⚠️ [Socket] Không thể gửi thông báo cho Admin:', socketErr.message);
    }

    // ── Tự động hoàn thành lịch hẹn nếu có liên kết ─────────────────
    if (nextStatus === 'completed' && repair.booking_id) {
      try {
        const { Booking } = require('../models');
        await Booking.update({ status: 'completed' }, { where: { id: repair.booking_id } });
        console.log(`✅ [KTV] Đã tự động hoàn thành Lịch hẹn #${repair.booking_id}`);
      } catch (bookingErr) {
        console.error('⚠️ [KTV] Lỗi hoàn thành lịch hẹn tự động:', bookingErr.message);
      }
    }

    // ── Tự động tích điểm Loyalty khi hoàn tất ────────────────────────
    if (nextStatus === 'completed') {
      const finalCost = Number(repair.final_cost) || 0;
      if (finalCost > 0) {
        const pointsToAdd = Math.floor(finalCost / 10000); // 10.000đ = 1 điểm
        if (pointsToAdd > 0) {
          try {
            const { Op } = require('sequelize');
            // 1. Cập nhật bảng Customer
            const customer = await Customer.findByPk(repair.customer_id);
            if (customer) {
              await customer.increment('points', { by: pointsToAdd });
              
              // 2. Tìm User liên kết để đồng bộ (theo email hoặc SĐT)
              const userLinked = await User.findOne({
                where: {
                  [Op.or]: [
                    { email: customer.email || 'N/A' },
                    { phone: customer.phone }
                  ]
                }
              });
              if (userLinked) {
                await userLinked.increment('points', { by: pointsToAdd });
              }
              console.log(`✅ [KTV] Đã tự động tích ${pointsToAdd} điểm cho khách hàng ${customer.name}`);
            }
          } catch (pointErr) {
            console.error('⚠️ [KTV] Lỗi tích điểm tự động:', pointErr.message);
          }
        }
      }
    }


    res.json({
      success: true,
      message: `Đã chuyển sang: ${STATUS_LABELS[nextStatus]}`,
      data: { status: nextStatus, label: STATUS_LABELS[nextStatus] }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/technician/stats — Thống kê hiệu suất cá nhân
router.get('/stats', requireTechnician, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy KTV.' });

    const fullName = user.full_name;
    const { Op } = require('sequelize');

    // 1. Số lượng đơn đang nhận
    const activeJobs = await RepairOrder.count({
      where: { 
        technician_name: fullName,
        status: { [Op.notIn]: ['completed', 'returned', 'cancelled'] }
      }
    });

    // 2. Số đơn hoàn thành trong tháng này
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const completedMonth = await RepairOrder.count({
      where: {
        technician_name: fullName,
        status: { [Op.in]: ['completed', 'returned'] },
        updated_at: { [Op.gte]: startOfMonth }
      }
    });

    // 3. Doanh thu tạm tính (giả sử 10% phí sửa chữa cho KTV)
    const revenue = await RepairOrder.sum('final_cost', {
      where: {
        technician_name: fullName,
        status: { [Op.in]: ['completed', 'returned'] },
        updated_at: { [Op.gte]: startOfMonth }
      }
    });
    const commission = Math.floor((Number(revenue) || 0) * 0.1);

    res.json({
      success: true,
      data: {
        activeJobs,
        completedMonth,
        commission,
        rating: 5.0 // Giả lập đánh giá
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/technician/inventory — Tra cứu kho linh kiện
router.get('/inventory', requireTechnician, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ success: true, data: [] });

    const { Op } = require('sequelize');
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'stock_quantity', 'price', 'image_url'],
      limit: 10
    });

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/technician/search?phone=xxx — Tìm đơn sửa chữa theo SĐT khách hàng (dùng tra cứu bảo hành)
router.get('/search', requireTechnician, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || phone.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập ít nhất 6 số điện thoại.' });
    }

    const { Op } = require('sequelize');

    // Tìm khách hàng theo SĐT (tìm kiếm một phần)
    const customers = await Customer.findAll({
      where: {
        phone: { [Op.like]: `%${phone.trim()}%` }
      },
      attributes: ['id', 'name', 'phone']
    });

    if (customers.length === 0) {
      return res.json({ success: true, data: [], message: 'Không tìm thấy khách hàng nào với số điện thoại này.' });
    }

    const customerIds = customers.map(c => c.id);

    // Lấy tất cả đơn sửa chữa của khách hàng đó (bao gồm đơn đã hoàn thành để tra bảo hành)
    const repairs = await RepairOrder.findAll({
      where: {
        customer_id: { [Op.in]: customerIds }
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['id', 'DESC']],
      limit: 20
    });

    const enriched = repairs.map(enrichRepairWarrantyFields);
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/technician/repairs/warranty — Tạo đơn bảo hành nhanh từ đơn cũ
router.post('/repairs/warranty', requireTechnician, async (req, res) => {
  try {
    const { parent_id, issue } = req.body;
    if (!parent_id) return res.status(400).json({ success: false, message: 'Thiếu thông tin đơn hàng gốc.' });

    const parentOrder = await RepairOrder.findByPk(parent_id);
    if (!parentOrder) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng gốc.' });

    if (!['completed', 'returned'].includes(parentOrder.status)) {
      return res.status(400).json({ success: false, message: 'Đơn gốc chưa hoàn thành, chưa thể tiếp nhận bảo hành.' });
    }

    if (!isWarrantyActive(parentOrder)) {
      return res.status(400).json({ success: false, message: 'Đơn gốc đã hết hạn bảo hành hoặc không có bảo hành.' });
    }

    if (parentOrder.device_name?.startsWith('[Bảo Hành]')) {
      return res.status(400).json({ success: false, message: 'Không thể tạo bảo hành từ một đơn bảo hành khác.' });
    }

    const { Op } = require('sequelize');
    const openWarrantyChild = await RepairOrder.findOne({
      where: {
        notes: { [Op.like]: `%đơn gốc #${parentOrder.receipt_code}%` },
        status: { [Op.in]: ['received', 'diagnosing', 'quoted', 'in_progress', 'testing'] },
      },
    });
    if (openWarrantyChild) {
      return res.status(400).json({
        success: false,
        message: `Đã có đơn bảo hành đang xử lý (#${openWarrantyChild.receipt_code}) cho đơn gốc này.`,
      });
    }

    // KTV phụ trách: admin gửi cho KTV đơn gốc; KTV tự nhận đơn thì gán theo tài khoản đăng nhập
    const userId = req.user.id;
    const { User, RepairStep } = require('../models');
    const user = await User.findByPk(userId);
    const currentTechName = req.user.role === 'admin'
      ? (req.body.technician_name || parentOrder.technician_name || 'Cửa hàng 118')
      : (user ? user.full_name : parentOrder.technician_name);

    // Tạo mã nhận đơn mới bằng cách lấy ID lớn nhất
    const maxOrder = await RepairOrder.findOne({ order: [['id', 'DESC']] });
    const nextId = maxOrder ? maxOrder.id + 1 : 1;
    const receiptCode = `RCV-118${String(nextId).padStart(3, '0')}`;

    const baseDeviceName = parentOrder.device_name || 'Thiết bị';

    // Tạo đơn bảo hành mới
    const newOrder = await RepairOrder.create({
      receipt_code: receiptCode,
      customer_id: parentOrder.customer_id,
      device_name: `[Bảo Hành] ${baseDeviceName}`,
      issue: issue || `Yêu cầu bảo hành từ đơn cũ #${parentOrder.receipt_code}.`,
      technician_name: currentTechName,
      status: 'received',
      received_date: new Date().toISOString().slice(0, 10),
      estimated_cost: 0,
      final_cost: 0,
      notes: `Đơn bảo hành liên kết với đơn gốc #${parentOrder.receipt_code}.`,
      warranty_period: 0, // Đơn bảo hành không gia hạn bảo hành mới mặc định
    });

    // Tạo bước tiếp nhận (luồng bảo hành)
    await RepairStep.create({
      repair_order_id: newOrder.id,
      step_order: 1,
      label: 'Tiếp nhận bảo hành',
      is_done: true,
      completed_date: new Date().toISOString().slice(0, 10)
    });

    // Các bước còn lại theo luồng bảo hành
    const defaultSteps = [
      'Kiểm tra lỗi',
      'Đang xử lý bảo hành',
      'Kiểm tra kỹ thuật',
      'Bàn giao thiết bị',
    ];
    for (let i = 0; i < defaultSteps.length; i++) {
      await RepairStep.create({
        repair_order_id: newOrder.id,
        step_order: i + 2,
        label: defaultSteps[i],
        is_done: false,
        completed_date: null
      });
    }

    // Phát socket thông báo thay đổi dữ liệu
    try {
      const socketConfig = require('../config/socket');
      const io = socketConfig.getIO();
      if (io) {
        io.emit('data_changed', { type: 'repair_order', action: 'create', id: newOrder.id });
      }
    } catch (sErr) {}

    res.status(201).json({ success: true, message: 'Đã tạo đơn bảo hành thành công.', data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

