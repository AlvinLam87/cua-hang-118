const express = require('express');
const router = express.Router();
const { Booking } = require('../models');
const { jwtSecret } = require('../config/env');

// POST /api/v1/bookings
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, service, date, time, address, message, preferred_technician_id } = req.body;

    if (!name || !phone || !service) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ họ tên, số điện thoại và dịch vụ cần hỗ trợ.',
      });
    }

    // Validate: không chấp nhận ngày quá khứ
    if (date) {
      const selected = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        return res.status(400).json({
          success: false,
          message: 'Ngày hẹn không thể là ngày trong quá khứ. Vui lòng chọn lại.',
        });
      }
    }


    const booking = await Booking.create({
      name,
      phone,
      email: email || null,
      service,
      booking_date: date || null,
      booking_time: time || null,
      address: address || null,
      message: message || null,
      preferred_technician_id: preferred_technician_id || null,
      status: 'pending',
    });

    const { sendEmail } = require('../utils/mailer');
    const bookingDateStr = date
      ? new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Sẽ xác nhận qua điện thoại';
    const bookingTimeStr = time || 'Sẽ xác nhận qua điện thoại';

      // ── Email to customer (if provided) ──
      if (email) {
        const customerHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đặt lịch - Cửa Hàng 118</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;shadow:0 10px 30px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
          <!-- Branding Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:40px 40px 30px;text-align:center;">
              <div style="background:rgba(255,255,255,0.1);display:inline-block;padding:8px 16px;border-radius:12px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.1);">
                <span style="color:#60a5fa;font-size:12px;font-weight:800;letter-spacing:4px;text-transform:uppercase;">Cửa Hàng 118</span>
              </div>
              <h1 style="color:#ffffff;font-size:32px;font-weight:900;margin:0;letter-spacing:-1px;">Đặt Lịch Thành Công!</h1>
              <p style="color:#94a3b8;font-size:16px;margin:10px 0 0;">Mã lịch hẹn: <span style="color:#ffffff;font-weight:bold;">#${String(booking.id).padStart(4,'0')}</span></p>
            </td>
          </tr>
          
          <!-- Status Banner -->
          <tr>
            <td style="padding:24px 40px;background-color:#f0f9ff;border-bottom:1px solid #e0f2fe;text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#3b82f6;border-radius:50%;width:32px;height:32px;text-align:center;color:#ffffff;font-size:18px;">✓</td>
                  <td style="padding-left:12px;color:#0369a1;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Chúng tôi đã tiếp nhận yêu cầu</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 30px;">
                Xin chào <strong style="color:#0f172a;">${name}</strong>,<br><br>
                Cảm ơn bạn đã lựa chọn dịch vụ tại Cửa Hàng 118. Chúng tôi đã nhận được thông tin đặt lịch của bạn. Đội ngũ kỹ thuật sẽ liên hệ trực tiếp để xác nhận trong vòng <span style="color:#2563eb;font-weight:bold;">15 - 30 phút</span>.
              </p>
              
              <!-- Booking Summary Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:20px;padding:24px;border:1px solid #f1f5f9;">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Chi tiết dịch vụ</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-bottom:15px;">
                          <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Dịch vụ</p>
                          <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0;">${service}</p>
                        </td>
                        <td width="50%" style="padding-bottom:15px;">
                          <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Điện thoại</p>
                          <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0;">${phone}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:15px;">
                          <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Ngày hẹn</p>
                          <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0;">${bookingDateStr}</p>
                        </td>
                        <td style="padding-bottom:15px;">
                          <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Giờ hẹn</p>
                          <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0;">${bookingTimeStr}</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Địa chỉ</p>
                          <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0;">${address || 'Sẽ xác nhận qua điện thoại'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <div style="margin:20px 0;">
                <a href="tel:0704818118" style="background-color:#2563eb;color:#ffffff;padding:18px 36px;border-radius:16px;text-decoration:none;font-weight:800;font-size:16px;display:inline-block;box-shadow:0 10px 20px rgba(37,99,235,0.2);">📞 Gọi Hotline Xác Nhận Ngay</a>
              </div>
              <p style="color:#94a3b8;font-size:13px;margin:0;">Hoặc nhắn tin qua Zalo: <a href="#" style="color:#2563eb;text-decoration:none;font-weight:600;">0704.818.118</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9;padding:30px 40px;text-align:center;">
              <p style="color:#475569;font-size:14px;font-weight:700;margin:0 0 8px;">Cửa Hàng 118 — Uy Tín Tận Tâm</p>
              <p style="color:#94a3b8;font-size:12px;margin:0 0 20px;">Sửa Chữa Máy Tính • Laptop • Camera An Ninh • Máy In</p>
              <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
                <p style="color:#cbd5e1;font-size:11px;margin:0;">Đây là email tự động, vui lòng không phản hồi email này.<br>© 2026 Cửa Hàng 118. All rights reserved.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
        sendEmail({
          to: email,
          subject: `[Cửa Hàng 118] ✅ Xác nhận đặt lịch #${String(booking.id).padStart(4,'0')}`,
          html: customerHtml
        });
      }

      // ── Email notification to shop owner ──
      const ownerEmail = process.env.SMTP_USER;
      if (ownerEmail) {
        const ownerHtml = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#fff1f2;font-family:sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #fecdd3;">
          <tr>
            <td style="background-color:#e11d48;padding:30px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;margin:0;">🔔 PHIẾU TƯ VẤN MỚI!</h1>
              <p style="color:#fff1f2;margin:8px 0 0;">Mã #${String(booking.id).padStart(4,'0')} — ${new Date().toLocaleTimeString('vi-VN')}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#fff5f5;border-radius:16px;padding:20px;border:1px solid #ffe4e6;">
                <tr><td style="padding-bottom:10px;color:#e11d48;font-weight:800;font-size:13px;text-transform:uppercase;">Thông tin khách hàng</td></tr>
                <tr><td style="padding:5px 0;font-size:15px;"><strong>👤 Họ tên:</strong> ${name}</td></tr>
                <tr><td style="padding:5px 0;font-size:15px;"><strong>📞 SĐT:</strong> <a href="tel:${phone}" style="color:#e11d48;font-weight:bold;">${phone}</a></td></tr>
                <tr><td style="padding:5px 0;font-size:15px;"><strong>📧 Email:</strong> ${email || 'N/A'}</td></tr>
                
                <tr><td style="padding:20px 0 10px;color:#e11d48;font-weight:800;font-size:13px;text-transform:uppercase;border-top:1px dashed #fecdd3;">Chi tiết yêu cầu</td></tr>
                <tr><td style="padding:5px 0;font-size:15px;"><strong>🔧 Dịch vụ:</strong> ${service}</td></tr>
                <tr><td style="padding:5px 0;font-size:15px;"><strong>📅 Thời gian:</strong> ${bookingDateStr} lúc ${bookingTimeStr}</td></tr>
                <tr><td style="padding:5px 0;font-size:15px;"><strong>📍 Địa chỉ:</strong> ${address || 'N/A'}</td></tr>
                <tr><td style="padding:5px 0;font-size:15px;"><strong>💬 Ghi chú:</strong> ${message || 'Không có'}</td></tr>
              </table>
              
              <div style="margin-top:25px;padding:15px;background-color:#fffbeb;border:1px solid #fef3c7;border-radius:12px;color:#92400e;font-size:14px;text-align:center;">
                ⚡ <strong>Hành động:</strong> Vui lòng gọi lại cho khách trong <strong>15 phút</strong>.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1e293b;padding:20px;text-align:center;color:#94a3b8;font-size:12px;">
              Email tự động từ hệ thống Quản lý 118
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
        sendEmail({
          to: ownerEmail,
          subject: `[Cửa Hàng 118] 🔔 Phiếu tư vấn mới #${String(booking.id).padStart(4,'0')} — ${name} (${phone})`,
          html: ownerHtml
        });
      }


    // ── Gửi thông báo Socket.io đến Admin ──────────────────────────
    try {
      const socketConfig = require('../config/socket');
      const io = socketConfig.getIO();
      if (io) {
        io.emit('new_booking', {
          id: booking.id,
          name: booking.name,
          service: booking.service,
          message: 'Có lịch hẹn mới từ khách hàng!'
        });
      }
    } catch (socketErr) {
      console.warn('⚠️ [Socket] Không thể gửi thông báo lịch hẹn:', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công! Chúng tôi sẽ liên hệ bạn trong vòng 30 phút.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/bookings/my-bookings
router.get('/my-bookings', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const { User } = require('../models');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], jwtSecret);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Match bookings by phone or email
    const { Op } = require('sequelize');
    const conditions = [];
    if (user.phone) conditions.push({ phone: user.phone });
    if (user.email) conditions.push({ email: user.email });

    const bookings = await Booking.findAll({
      where: conditions.length > 0 ? { [Op.or]: conditions } : { id: -1 },
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
