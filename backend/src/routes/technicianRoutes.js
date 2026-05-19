const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { RepairOrder, Booking, Customer, Product, User, sequelize } = require('../models');
const { jwtSecret } = require('../config/env');
const upload = require('../utils/upload');

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
    const FLOW = ['received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed'];
    const currentIndex = FLOW.indexOf(repair.status);

    if (currentIndex === -1 || currentIndex >= FLOW.length - 1) {
      return res.status(400).json({ success: false, message: 'Đơn đã hoàn thành hoặc không thể chuyển bước.' });
    }

    // Kiểm tra ràng buộc: Nếu đang ở 'received', bắt buộc phải có ảnh thiết bị
    if (repair.status === 'received' && !repair.device_image) {
      return res.status(400).json({ success: false, message: 'Bắt buộc phải chụp ảnh thiết bị trước khi chuyển sang bước chẩn đoán.' });
    }

    const nextStatus = FLOW[currentIndex + 1];
    const updateData = { status: nextStatus };

    // Nếu hoàn thành thì ghi ngày và tính doanh thu
    if (nextStatus === 'completed') {
      updateData.completed_date = new Date().toISOString();
      // Nếu KTV không nhập giá cuối thì lấy giá dự kiến ban đầu
      updateData.final_cost = req.body.final_cost || repair.final_cost || repair.estimated_cost || 0;
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

module.exports = router;
