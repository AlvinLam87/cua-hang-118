const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { requireAdmin } = require('../middleware/auth');
const { Product, Service, Category, Customer, RepairOrder, RepairStep, Booking, User, Review, Order, OrderItem, Voucher, sequelize } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const socketConfig = require('../config/socket');
const sharp = require('sharp');

const avatarUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars');
const productUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'products');
[avatarUploadDir, productUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Chỉ hỗ trợ upload file ảnh.'));
  },
});

// Sử dụng memoryStorage để xử lý ảnh bằng Sharp trước khi lưu
const productUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // Cho phép upload file lớn để nén sau
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Chỉ hỗ trợ upload file ảnh.'));
  },
});

// ── DASHBOARD STATS ──────────────────────────────────────
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [products, services, orders, bookings, customers] = await Promise.all([
      Product.count(),
      Service.count(),
      RepairOrder.count(),
      Booking.count(),
      Customer.count(),
    ]);
    const pendingBookings = await Booking.count({ where: { status: 'pending' } });
    const activeRepairs = await RepairOrder.count({ where: { status: { [Op.notIn]: ['completed', 'returned', 'cancelled'] } } });

    // Calculate Total Revenue (Bao gồm cả Đơn hàng và Đơn sửa chữa)
    // Fallback: Nếu đơn sửa chữa đã xong mà chưa có final_cost thì lấy tạm estimated_cost
    const [paidOrdersResult, repairsResult] = await Promise.all([
      Order.findAll({
        attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'total']],
        where: { payment_status: 'paid' },
        raw: true
      }),
      RepairOrder.findAll({
        attributes: [[sequelize.fn('SUM', sequelize.literal('COALESCE(final_cost, estimated_cost, 0)')), 'total']],
        where: { status: { [Op.in]: ['completed', 'returned'] } },
        raw: true
      })
    ]);

    const paidOrdersTotal = Number(paidOrdersResult[0]?.total) || 0;
    const completedRepairsTotal = Number(repairsResult[0]?.total) || 0;
    const totalRevenue = paidOrdersTotal + completedRepairsTotal;

    // Calculate Revenues based on timeframes
    const now = new Date();
    
    // Start of Week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay(), diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Start of Year
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const getRevenueSince = async (startDate) => {
      const [oRes, rRes] = await Promise.all([
        Order.findAll({
          attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'total']],
          where: { payment_status: 'paid', created_at: { [Op.gte]: startDate } },
          raw: true
        }),
        RepairOrder.findAll({
          attributes: [[sequelize.fn('SUM', sequelize.literal('COALESCE(final_cost, estimated_cost, 0)')), 'total']],
          where: { status: { [Op.in]: ['completed', 'returned'] }, updated_at: { [Op.gte]: startDate } },
          raw: true
        })
      ]);
      return (Number(oRes[0]?.total) || 0) + (Number(rRes[0]?.total) || 0);
    };

    const thisWeekRevenue = await getRevenueSince(startOfWeek);
    const thisMonthRevenue = await getRevenueSince(startOfMonth);
    const thisYearRevenue = await getRevenueSince(startOfYear);

    console.log(`📊 [Revenue Debug] Orders: ${paidOrdersTotal}, Repairs: ${completedRepairsTotal}, Total: ${totalRevenue}`);

    res.json({ 
      success: true, 
      data: { 
        products, services, orders, bookings, customers, 
        pendingBookings, activeRepairs,
        totalRevenue, thisWeekRevenue, thisMonthRevenue, thisYearRevenue
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── EXPORT REVENUE EXCEL ───────────────────────────────────
router.get('/export-revenue', requireAdmin, async (req, res) => {
  try {
    // Fetch paid orders
    const paidOrders = await Order.findAll({
      where: { payment_status: 'paid' },
      order: [['created_at', 'DESC']]
    });

    // Fetch completed repair orders
    const completedRepairs = await RepairOrder.findAll({
      where: { status: { [Op.in]: ['completed', 'returned'] } },
      include: [{ model: Customer, as: 'customer', attributes: ['name', 'phone'] }],
      order: [['updated_at', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Doanh Thu');

    worksheet.columns = [
      { header: 'Ngày', key: 'date', width: 15 },
      { header: 'Loại', key: 'type', width: 15 },
      { header: 'Mã Đơn', key: 'id', width: 15 },
      { header: 'Khách Hàng', key: 'name', width: 30 },
      { header: 'Số Tiền (VNĐ)', key: 'amount', width: 20 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    let rows = [];

    // Process Orders
    paidOrders.forEach(order => {
      // FIX: Sequelize returns createdAt, not created_at in the model instance
      const dateVal = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A';
      rows.push({
        date: dateVal,
        type: 'Bán hàng',
        id: `DH-${order.id}`,
        name: order.guest_name || 'Khách lẻ',
        amount: Number(order.total_amount) || 0
      });
    });

    // Process Repairs
    completedRepairs.forEach(repair => {
      // FIX: Sequelize returns updatedAt, not updated_at in the model instance
      const dateVal = repair.updatedAt ? new Date(repair.updatedAt).toLocaleDateString('vi-VN') : 'N/A';
      rows.push({
        date: dateVal,
        type: 'Sửa chữa',
        id: `SC-${repair.receipt_code || repair.id}`,
        name: repair.customer?.name || 'Khách',
        amount: Number(repair.final_cost || repair.estimated_cost) || 0
      });
    });

    // Add rows to worksheet
    worksheet.addRows(rows);

    // Format Amount column as currency
    worksheet.getColumn('amount').numFmt = '#,##0₫';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="doanh_thu.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Lỗi khi xuất Excel:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xuất file Excel' });
  }
});

// ── PRODUCTS CRUD ────────────────────────────────────────
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
      order: [['id', 'DESC']],
    });
    res.json({ success: true, data: products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/products', requireAdmin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/products/upload-images', requireAdmin, productUpload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh.' });
    }

    const imageUrls = [];
    
    // Xử lý nén từng tấm ảnh
    const processPromises = req.files.map(async (file) => {
      const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const filepath = path.join(productUploadDir, filename);

      await sharp(file.buffer)
        .resize(1200, null, { withoutEnlargement: true }) // Rộng tối đa 1200px, giữ tỷ lệ
        .jpeg({ quality: 80 }) // Nén JPEG chất lượng 80%
        .toFile(filepath);

      imageUrls.push(`/uploads/products/${filename}`);
    });

    await Promise.all(processPromises);

    return res.status(201).json({ success: true, data: { image_urls: imageUrls } });
  } catch (err) {
    console.error('❌ Lỗi xử lý ảnh:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi trong quá trình tối ưu hóa hình ảnh.' });
  }
});

router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await product.update(req.body);
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await product.destroy();
    res.json({ success: true, message: 'Đã xóa sản phẩm.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── SERVICES CRUD ────────────────────────────────────────
router.get('/services', requireAdmin, async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
      order: [['id', 'DESC']],
    });
    res.json({ success: true, data: services });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/services', requireAdmin, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/services/:id', requireAdmin, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await service.update(req.body);
    res.json({ success: true, data: service });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/services/:id', requireAdmin, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await service.destroy();
    res.json({ success: true, message: 'Đã xóa dịch vụ.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── REPAIR ORDERS CRUD ───────────────────────────────────
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await RepairOrder.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
        { model: RepairStep, as: 'steps', order: [['step_order', 'ASC']] },
      ],
      order: [['id', 'DESC']],
    });
    res.json({ success: true, data: orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await RepairOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });

    const prevStatus = order.status;
    const newStatus = req.body.status || prevStatus;

    if (['completed', 'returned'].includes(newStatus) && !['completed', 'returned'].includes(prevStatus)) {
      if (!order.completed_date) {
        req.body.completed_date = new Date().toISOString();
      }
    }

    // Tự động tính ngày hết hạn bảo hành
    if (['completed', 'returned'].includes(newStatus)) {
      const period = req.body.warranty_period !== undefined ? parseInt(req.body.warranty_period, 10) : parseInt(order.warranty_period, 10);
      if (period > 0) {
        const startDateStr = req.body.completed_date || order.completed_date || new Date().toISOString();
        const startDate = new Date(startDateStr);
        startDate.setMonth(startDate.getMonth() + period);
        req.body.warranty_expiry = startDate.toISOString().slice(0, 10);
      } else if (req.body.warranty_period !== undefined && period === 0) {
        req.body.warranty_expiry = null;
      }
    }

    await order.update(req.body);

    // Phát sự kiện cập nhật
    try {
      const io = socketConfig.getIO();
      if (io) {
        io.emit('technician_update', { id: order.id, status: newStatus });
        io.emit('data_changed', { type: 'repair_order', id: order.id });
      }
    } catch (sErr) {
      console.warn('⚠️ [Socket] Admin update error:', sErr.message);
    }

    // ── Tự động hoàn thành lịch hẹn nếu có liên kết ─────────────────
    if (['completed', 'returned'].includes(newStatus) && order.booking_id) {
      try {
        await Booking.update({ status: 'completed' }, { where: { id: order.booking_id } });
        console.log(`✅ [Admin] Đã tự động hoàn thành Lịch hẹn #${order.booking_id}`);
      } catch (bookingErr) {
        console.error('⚠️ [Admin] Lỗi hoàn thành lịch hẹn tự động:', bookingErr.message);
      }
    }

    // ── Tích điểm khi hoàn tất / bàn giao ──────────────────────────
    if (['completed', 'returned'].includes(newStatus) && !['completed', 'returned'].includes(prevStatus)) {
      const finalCost = Number(order.final_cost) || 0;
      if (finalCost > 0) {
        const pointsToAdd = Math.floor(finalCost / 10000);
        if (pointsToAdd > 0) {
          try {
            // 1. Cập nhật bảng Customer
            const customer = await Customer.findByPk(order.customer_id);
            if (customer) {
              await customer.increment('points', { by: pointsToAdd });
              
              // 2. Tìm User liên kết để đồng bộ
              const user = await User.findOne({
                where: {
                  [Op.or]: [
                    { email: customer.email },
                    { phone: customer.phone }
                  ]
                }
              });
              if (user) {
                await user.increment('points', { by: pointsToAdd });
              }
              console.log(`✅ Đã tích ${pointsToAdd} điểm cho khách hàng ${customer.name}`);
            }
          } catch (pointErr) {
            console.error('⚠️ Lỗi tích điểm:', pointErr.message);
          }
        }
      }
    }

    // ── Gửi email thông báo bảo hành điện tử nếu hoàn tất ────────────
    if (['completed', 'returned'].includes(newStatus) && !['completed', 'returned'].includes(prevStatus)) {
      try {
        const customer = await Customer.findByPk(order.customer_id);
        if (customer && customer.email) {
          const { sendEmail } = require('../utils/mailer');
          
          const warrantyPeriodText = order.warranty_period > 0 ? `${order.warranty_period} tháng` : 'Không bảo hành';
          const warrantyExpiryText = order.warranty_expiry ? new Date(order.warranty_expiry).toLocaleDateString('vi-VN') : '—';
          const finalCostText = order.final_cost ? `${Number(order.final_cost).toLocaleString('vi-VN')}đ` : '—';

          const emailSubject = `[Cửa Hàng 118] Xác nhận Hoàn tất & Kích hoạt Bảo hành Điện tử #${order.receipt_code}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
              <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;">
                <h2 style="color: #1d4ed8; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CỬA HÀNG 118</h2>
                <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1.5px;">Bảo Hành Điện Tử Thông Minh</p>
              </div>

              <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Xin chào ${customer.name || 'Quý khách'},</h3>
              <p style="line-height: 1.6; color: #334155; font-size: 14px;">
                Chúng tôi xin trân trọng thông báo thiết bị của bạn đã được sửa chữa hoàn tất và bàn giao thành công. **Hệ thống bảo hành điện tử** của thiết bị đã được tự động kích hoạt trên website!
              </p>

              <!-- Thẻ Bảo Hành Điện Tử Bento Style -->
              <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; border-radius: 16px; padding: 25px; margin: 25px 0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 12px; font-weight: bold; color: #38bdf8; letter-spacing: 1px;">THẺ BẢO HÀNH ĐIỆN TỬ</span>
                  <span style="font-size: 11px; font-weight: bold; padding: 4px 10px; background-color: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.3); color: #34d399; border-radius: 9999px;">ĐANG HOẠT ĐỘNG</span>
                </div>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; font-size: 13px; color: #94a3b8; width: 40%;">Mã biên nhận:</td>
                    <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #ffffff;">${order.receipt_code}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; font-size: 13px; color: #94a3b8;">Tên thiết bị:</td>
                    <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #ffffff;">${order.device_name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; font-size: 13px; color: #94a3b8;">Thời hạn bảo hành:</td>
                    <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #34d399;">${warrantyPeriodText}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; font-size: 13px; color: #94a3b8;">Ngày hết hạn:</td>
                    <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #38bdf8;">${warrantyExpiryText}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: #94a3b8;">Chi phí dịch vụ:</td>
                    <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #f59e0b;">${finalCostText}</td>
                  </tr>
                </table>
              </div>

              <!-- Điều khoản -->
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 5px 0; color: #1e293b; font-size: 12px; font-weight: 800; text-transform: uppercase;">Điều khoản bảo hành:</h4>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; font-style: italic;">
                  ${order.warranty_terms || 'Bảo hành linh kiện thay thế trong thời hạn bảo hành. Không bảo hành trong trường hợp: Thiết bị có dấu hiệu rơi vỡ, cấn móp, ngập nước, cháy nổ hoặc tem bảo hành của cửa hàng bị rách/tác động.'}
                </p>
              </div>

              <!-- Claim Instructions -->
              <h4 style="color: #0f172a; font-size: 14px; font-weight: bold; margin-bottom: 10px;">Khi cần bảo hành, bạn cần làm gì?</h4>
              <p style="line-height: 1.6; color: #475569; font-size: 13px; margin: 0 0 20px 0;">
                Quý khách không cần mang theo bất kỳ giấy tờ hay hóa đơn nào! Bạn chỉ cần mang thiết bị trực tiếp đến cửa hàng và đọc **Số điện thoại** hoặc **Mã biên nhận** (${order.receipt_code}) để kỹ thuật viên tra cứu trên hệ thống và tiến hành xử lý bảo hành ngay lập tức.
              </p>

              <div style="text-align: center; margin: 30px 0 15px 0;">
                <a href="https://cua-hang-118.onrender.com/tra-cuu?q=${order.receipt_code}" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Xem Thẻ Bảo Hành Online</a>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                <strong>CỬA HÀNG 118</strong><br/>
                Địa chỉ: Tỉnh Bạc Liêu<br/>
                Hotline: 0704.818.118 | Email: support@cuahang118.vn
              </div>
            </div>
          `;

          await sendEmail({
            to: customer.email,
            subject: emailSubject,
            html: emailHtml,
          });
          console.log(`✉️ [Email] Đã gửi thông báo kích hoạt bảo hành điện tử thành công tới khách hàng: ${customer.email}`);
        }
      } catch (emailErr) {
        console.error('⚠️ [Email] Lỗi gửi mail thông báo bảo hành điện tử:', emailErr.message);
      }
    }

    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PRODUCT ORDERS CRUD ──────────────────────────────────
router.get('/product-orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'customer', attributes: ['id', 'full_name', 'email', 'phone'] },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ],
      order: [['id', 'DESC']]
    });
    res.json({ success: true, data: orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/product-orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });

    const prevPayment = order.payment_status;
    const newPayment = req.body.payment_status;

    await order.update(req.body);

    // ── Tích điểm khi đơn hàng được thanh toán ──────────────────────
    if (newPayment === 'paid' && prevPayment !== 'paid') {
      const totalAmount = parseFloat(order.total_amount) || 0;
      if (totalAmount > 0) {
        try {
          let user = null;
          if (order.customer_id) {
            user = await User.findByPk(order.customer_id);
          } else if (order.guest_phone) {
            user = await User.findOne({ where: { phone: order.guest_phone } });
            if (user) {
              await order.update({ customer_id: user.id });
            }
          }

          if (user) {
            const pointsToAdd = Math.floor(totalAmount / 100000); // 100.000đ = 1đ
            if (pointsToAdd > 0) {
              await user.increment('points', { by: pointsToAdd });
              const customer = await Customer.findOne({ 
                where: { [Op.or]: [{ email: user.email }, { phone: user.phone }] } 
              });
              if (customer) {
                await customer.increment('points', { by: pointsToAdd });
              }
              console.log(`✅ Đã tích ${pointsToAdd} điểm cho khách hàng ${user.full_name}`);
            }
          }
        } catch (pointErr) {
          console.error('⚠️ Lỗi tích điểm đơn hàng:', pointErr.message);
        }
      }
    }

    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── BOOKINGS CRUD ────────────────────────────────────────
router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [{ model: User, as: 'preferredTechnician', attributes: ['id', 'full_name'] }],
      order: [['id', 'DESC']]
    });
    res.json({ success: true, data: bookings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });

    const prevStatus = booking.status;
    await booking.update(req.body);

    // ── Khi xác nhận lịch hẹn → tự động tạo đơn sửa chữa ──────────────
    if (req.body.status === 'confirmed' && prevStatus !== 'confirmed') {
      try {
        // 1. Tìm hoặc tạo khách hàng từ thông tin booking
        let customer = await Customer.findOne({ where: { phone: booking.phone } });
        if (!customer) {
          customer = await Customer.create({
            name:  booking.name,
            phone: booking.phone,
            email: booking.email || null,
            address: booking.address || null,
          });
        }

        // 2. Tạo mã đơn hàng tự động: RCV-118xxx
        const count = await RepairOrder.count();
        const receiptCode = `RCV-118${String(count + 1).padStart(3, '0')}`;

        // 3. Lấy tên KTV từ request body hoặc từ booking cũ
        let technicianName = null;
        const targetTechId = req.body.technician_id || booking.preferred_technician_id;
        if (targetTechId) {
          const tech = await User.findByPk(targetTechId);
          if (tech) technicianName = tech.full_name;
        }

        // 4. Tạo đơn sửa chữa (Độc lập với lịch hẹn)
        await RepairOrder.create({
          receipt_code:   receiptCode,
          customer_id:    customer.id,
          booking_id:     booking.id,
          device_name:    booking.service,
          issue:          booking.message || `Dịch vụ: ${booking.service}`,
          technician_name: technicianName,
          status:         'received',
          received_date:  booking.booking_date || new Date().toISOString().slice(0, 10),
          notes:          `Tạo tự động từ Lịch Hẹn #${booking.id}. Khách hàng: ${booking.name}`.trim(),
        });

        console.log(`✅ [Hệ thống] Đã chuyển đổi Lịch hẹn #${booking.id} thành Đơn sửa chữa ${receiptCode}`);

        // Phát sự kiện qua Socket.io
        try {
          const io = socketConfig.getIO();
          io.emit('new_repair_order', {
            id: booking.id,
            receipt_code: receiptCode,
            device_name: booking.service,
            technician_name: technicianName,
            message: 'Đã tạo đơn sửa chữa từ lịch hẹn của bạn.'
          });
          io.emit('data_changed', { type: 'repair_order', action: 'create' });
        } catch (socketErr) {
          console.error('⚠️ [Socket] Lỗi thông báo đơn mới:', socketErr.message);
        }
      } catch (innerErr) {
        console.error('⚠️ [Hệ thống] Lỗi khi chuyển đổi lịch hẹn:', innerErr.message);
      }
    }

    res.json({ success: true, data: booking });

    // Phát sự kiện để cập nhật Sidebar
    try {
      const io = socketConfig.getIO();
      if (io) {
        io.emit('new_booking', { id: booking.id, status: booking.status });
      }
    } catch (sErr) {}
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await booking.destroy();
    res.json({ success: true, message: 'Đã xóa lịch hẹn.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── CUSTOMERS ────────────────────────────────────────────
router.get('/customers', requireAdmin, async (req, res) => {
  try {
    const customers = await Customer.findAll({ order: [['id', 'DESC']] });
    res.json({ success: true, data: customers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/customers/search', requireAdmin, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ success: false, message: 'Thiếu số điện thoại.' });
    const customer = await Customer.findOne({ where: { phone } });
    res.json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/customers', requireAdmin, async (req, res) => {
  try {
    const { name, phone, email, address, points } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Tên và SĐT là bắt buộc.' });

    const existing = await Customer.findOne({ where: { phone } });
    if (existing) return res.status(400).json({ success: false, message: 'Số điện thoại này đã tồn tại trong hệ thống.' });

    const customer = await Customer.create({ name, phone, email, address, points: points || 0 });
    res.status(201).json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/customers/:id/adjust-points', requireAdmin, async (req, res) => {
  try {
    const { points, reason } = req.body;
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });

    const oldPoints = customer.points;
    const newPoints = Number(points);
    
    await customer.update({ points: newPoints });

    // Đồng bộ sang User nếu có
    const user = await User.findOne({
      where: { [Op.or]: [{ email: customer.email || 'N/A' }, { phone: customer.phone }] }
    });
    if (user) {
      await user.update({ points: newPoints });
    }

    res.json({ success: true, data: customer, message: `Đã cập nhật điểm từ ${oldPoints} thành ${newPoints}.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/customers/:id', requireAdmin, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await customer.destroy();
    res.json({ success: true, message: 'Đã xóa khách hàng.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── CATEGORIES ───────────────────────────────────────────
router.get('/categories', requireAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const categories = await Category.findAll({ where, order: [['id', 'ASC']] });
    res.json({ success: true, data: categories });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── TECHNICIANS (USERS with role='technician') ─────────────
router.get('/technicians', requireAdmin, async (req, res) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician' },
      order: [['id', 'DESC']],
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] }
    });
    res.json({ success: true, data: technicians });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/technicians/:id', requireAdmin, async (req, res) => {
  try {
    const technician = await User.findOne({
      where: { id: req.params.id, role: 'technician' },
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] }
    });
    if (!technician) return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ thuật viên.' });
    res.json({ success: true, data: technician });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/technicians/upload-avatar', requireAdmin, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh.' });
    }
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    return res.status(201).json({ success: true, data: { avatar_url: avatarPath } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/technicians', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });

    const technician = await User.create({
      ...req.body,
      role: 'technician'
    });
    res.status(201).json({ success: true, data: technician.toSafeJSON() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/technicians/:id', requireAdmin, async (req, res) => {
  try {
    const technician = await User.findOne({ where: { id: req.params.id, role: 'technician' } });
    if (!technician) return res.status(404).json({ success: false, message: 'Không tìm thấy KTV.' });

    // Handle password update if provided
    const { password_hash, ...otherData } = req.body;
    
    // Cập nhật các thông tin khác trước
    await technician.update(otherData);

    // Nếu có mật khẩu mới, cập nhật riêng để đảm bảo trigger hook
    if (password_hash && password_hash.trim() !== '') {
      technician.password_hash = password_hash;
      await technician.save();
    }

    res.json({ success: true, data: technician.toSafeJSON() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/technicians/:id', requireAdmin, async (req, res) => {
  try {
    const technician = await User.findOne({ where: { id: req.params.id, role: 'technician' } });
    if (!technician) return res.status(404).json({ success: false, message: 'Không tìm thấy KTV.' });
    await technician.destroy();
    res.json({ success: true, message: 'Đã xóa Kỹ thuật viên.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── VOUCHERS MANAGEMENT ──────────────────────────────────
router.get('/vouchers', requireAdmin, async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      order: [['id', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }]
    });
    res.json({ success: true, data: vouchers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/vouchers', requireAdmin, async (req, res) => {
  try {
    const { code, type, value, min_order_value, max_discount_value, usage_limit, expiry_date, is_active, points_required } = req.body;
    const voucher = await Voucher.create({
      code, type, value, min_order_value, max_discount_value, usage_limit, expiry_date, is_active, points_required
    });
    res.status(201).json({ success: true, data: voucher });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/vouchers/:id', requireAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy mã.' });
    await voucher.update(req.body);
    res.json({ success: true, data: voucher });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/vouchers/:id', requireAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await voucher.destroy();
    res.json({ success: true, message: 'Đã xóa mã giảm giá.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── SUPPLIERS MANAGEMENT ──────────────────────────────────
router.get('/suppliers', requireAdmin, async (req, res) => {
  try {
    const { Supplier } = require('../models');
    const suppliers = await Supplier.findAll({ order: [['id', 'DESC']] });
    res.json({ success: true, data: suppliers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/suppliers', requireAdmin, async (req, res) => {
  try {
    const { Supplier } = require('../models');
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/suppliers/:id', requireAdmin, async (req, res) => {
  try {
    const { Supplier } = require('../models');
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await supplier.update(req.body);
    res.json({ success: true, data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/suppliers/:id', requireAdmin, async (req, res) => {
  try {
    const { Supplier } = require('../models');
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    await supplier.destroy();
    res.json({ success: true, message: 'Đã xóa nhà cung cấp.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── INVENTORY MANAGEMENT ───────────────────────────────────
router.get('/inventory/movements', requireAdmin, async (req, res) => {
  try {
    const { StockMovement, Product, Supplier } = require('../models');
    const movements = await StockMovement.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'image_url'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json({ success: true, data: movements });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/inventory/stock-in', requireAdmin, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { StockMovement, Product } = require('../models');
    let { product_id, product_name, category_id, supplier_id, quantity, price, reason, notes } = req.body;

    if ((!product_id && !product_name) || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Thông tin nhập kho không hợp lệ.' });
    }

    quantity = Number(quantity);
    price = price ? Number(price) : null;

    let product;
    if (product_id) {
      product = await Product.findByPk(product_id, { transaction: t });
    } else if (product_name) {
      if (!category_id) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn danh mục cho sản phẩm mới.' });
      }

      // Tạo slug đơn giản
      const slug = product_name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now();

      // Tìm hoặc tạo sản phẩm theo tên
      [product] = await Product.findOrCreate({
        where: { name: product_name.trim() },
        defaults: {
          category_id,
          slug,
          price: 0,
          stock_quantity: 0,
          warehouse_quantity: 0,
          is_active: false,
          in_stock: false
        },
        transaction: t
      });
      product_id = product.id;
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hoặc không thể tạo sản phẩm.' });
    }

    // 1. Create movement log
    const movement = await StockMovement.create({
      product_id,
      supplier_id,
      type: 'IN',
      quantity,
      price,
      reason: reason || 'Nhập hàng từ NCC',
      notes
    }, { transaction: t });

    // 2. Update product stock
    const newWarehouseStock = (product.warehouse_quantity || 0) + Number(quantity);
    await product.update({
      warehouse_quantity: newWarehouseStock,
      // Khi nhập kho, chúng ta giữ nguyên stock_quantity (hàng đang bán)
      // chỉ cập nhật in_stock dựa trên cả 2 nguồn nếu cần, 
      // nhưng ở đây in_stock thường đại diện cho việc có hàng trên web hay không.
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, data: movement });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/inventory/transfer-to-shop', requireAdmin, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { Product, StockMovement } = require('../models');
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Thông tin chuyển hàng không hợp lệ.' });
    }

    const product = await Product.findByPk(product_id, { transaction: t });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong kho.' });
    }

    if (product.warehouse_quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Số lượng trong kho không đủ để chuyển.' });
    }

    // 1. Ghi nhận biến động (XUẤT KHO nội bộ / Chuyển trạng thái)
    await StockMovement.create({
      product_id,
      type: 'OUT',
      quantity,
      reason: 'Đăng bán lên Web',
      notes: `Chuyển ${quantity} đơn vị từ kho sang kệ hàng Web.`
    }, { transaction: t });

    // 2. Cập nhật số lượng
    await product.update({
      warehouse_quantity: product.warehouse_quantity - Number(quantity),
      stock_quantity: (product.stock_quantity || 0) + Number(quantity),
      is_active: true,
      in_stock: true
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: `Đã đăng ${quantity} đơn vị lên Web.` });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- REVIEWS MANAGEMENT ---

router.get('/reviews', requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] },
        { model: Product, as: 'product', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/reviews/:id', requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    await review.destroy();
    res.json({ success: true, message: 'Đã xóa đánh giá.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
