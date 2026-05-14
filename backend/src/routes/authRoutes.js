const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User, Customer, Voucher, sequelize } = require('../models');
const { Op } = require('sequelize');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { sendEmail } = require('../utils/mailer');

const REGISTER_OTP_EXPIRES_MS = 5 * 60 * 1000;
const registerOtpStore = new Map();

// Tạo JWT token
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
};

// ──────────────────────────────────────────────────────────
// POST /api/v1/auth/register/request-otp
// ──────────────────────────────────────────────────────────
router.post('/register/request-otp', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword, channel = 'email' } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const normalizedPhone = (phone || '').trim();

    if (!fullName || !normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    }
    if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải bao gồm chữ in hoa, số và ký tự đặc biệt.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp.' });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email này đã được đăng ký. Vui lòng dùng email khác.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const passwordHash = await bcrypt.hash(password, 10);
    const key = `email:${normalizedEmail}`;

    registerOtpStore.set(key, {
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone || null,
      passwordHash,
      otpHash,
      expiresAt: Date.now() + REGISTER_OTP_EXPIRES_MS,
    });

    const delivered = await sendEmail({
      to: normalizedEmail,
      subject: '[Cửa Hàng 118] Mã xác nhận đăng ký tài khoản',
      html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:500px;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color:#2563eb;padding:30px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;margin:0;letter-spacing:1px;">Xác Thực Tài Khoản</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;">
              <p style="color:#475569;font-size:16px;margin:0 0 24px;">Xin chào,</p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 30px;">Bạn đang thực hiện đăng ký tài khoản tại <strong>Cửa Hàng 118</strong>. Vui lòng sử dụng mã xác nhận dưới đây để hoàn tất:</p>
              
              <div style="background-color:#f1f5f9;border-radius:16px;padding:24px;margin-bottom:30px;border:2px dashed #cbd5e1;">
                <span style="font-size:36px;font-weight:900;color:#0f172a;letter-spacing:12px;margin-left:12px;">${otp}</span>
              </div>
              
              <p style="color:#94a3b8;font-size:13px;margin:0;">Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">Cửa Hàng 118 — Uy Tín Tận Tâm<br>© 2026 Cửa Hàng 118</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (!delivered) {
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể gửi email xác nhận. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.' 
      });
    }

    res.json({
      success: true,
      message: 'Mã xác nhận 6 số đã được gửi qua email. Vui lòng kiểm tra hộp thư (cả hòm thư Rác/Spam).',
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/v1/auth/register/verify-otp
// ──────────────────────────────────────────────────────────
router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const key = `email:${normalizedEmail}`;
    const pendingRegistration = registerOtpStore.get(key);

    if (!pendingRegistration) {
      return res.status(400).json({ success: false, message: 'Khong tim thay yeu cau xac nhan. Vui long gui lai ma OTP.' });
    }
    if (Date.now() > pendingRegistration.expiresAt) {
      registerOtpStore.delete(key);
      return res.status(400).json({ success: false, message: 'Ma OTP da het han. Vui long gui lai ma moi.' });
    }
    if (!otp || String(otp).length !== 6) {
      return res.status(400).json({ success: false, message: 'Vui long nhap day du ma OTP 6 so.' });
    }

    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (otpHash !== pendingRegistration.otpHash) {
      return res.status(400).json({ success: false, message: 'Ma OTP khong dung. Vui long thu lai.' });
    }

    const existed = await User.findOne({ where: { email: pendingRegistration.email } });
    if (existed) {
      registerOtpStore.delete(key);
      return res.status(409).json({ success: false, message: 'Email nay da duoc dang ky. Vui long dung email khac.' });
    }

    const user = await User.create({
      full_name: pendingRegistration.fullName,
      email: pendingRegistration.email,
      phone: pendingRegistration.phone,
      password_hash: pendingRegistration.passwordHash,
    }, { hooks: false });

    // Đồng bộ sang bảng Customer để hiện trong Admin
    try {
      const existingCustomer = await Customer.findOne({ 
        where: { 
          [Op.or]: [
            { email: pendingRegistration.email },
            { phone: pendingRegistration.phone }
          ] 
        } 
      });
      if (!existingCustomer) {
        await Customer.create({
          name: pendingRegistration.fullName,
          email: pendingRegistration.email,
          phone: pendingRegistration.phone,
        });
      }
    } catch (customerErr) {
      console.error('⚠️ Lỗi đồng bộ Customer:', customerErr.message);
    }

    registerOtpStore.delete(key);

    const token = signToken(user);
    return res.status(201).json({
      success: true,
      message: 'Dang ky thanh cong sau khi xac minh OTP.',
      data: {
        user: user.toSafeJSON(),
        token,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ──────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp.' });
    }

    // Kiểm tra email đã tồn tại?
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email này đã được đăng ký. Vui lòng dùng email khác.' });
    }

    // Tạo user mới
    const user = await User.create({
      full_name: fullName,
      email: email.toLowerCase(),
      phone: phone || null,
      password_hash: password, // Sẽ được hash tự động bởi beforeCreate hook
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Chào mừng bạn đến với Cửa Hàng 118.',
      data: {
        user: user.toSafeJSON(),
        token,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
    }

    // Tìm user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    // Kiểm tra tài khoản bị khóa
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hotline.' });
    }

    // So sánh mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: user.toSafeJSON(),
        token,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/v1/auth/forgot-password
// ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      return res.json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.',
      });
    }

    // Tạo reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.reset_token = resetTokenHash;
    user.reset_token_expires = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
    await user.save();

    // Gửi email thật
    const { sendEmail } = require('../utils/mailer');
    const resetUrl = `${req.protocol}://${req.get('host').replace('3001', '5173')}/dat-lai-mat-khau?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: '[Cửa Hàng 118] Yêu cầu đặt lại mật khẩu',
      html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color:#0f172a;padding:30px;text-align:center;">
              <h1 style="color:#ffffff;font-size:22px;margin:0;">🔐 Đặt Lại Mật Khẩu</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#1e293b;font-size:16px;margin:0 0 16px;">Xin chào <strong>${user.full_name}</strong>,</p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 30px;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để tiến hành:</p>
              
              <div style="text-align:center;margin-bottom:35px;">
                <a href="${resetUrl}" style="background-color:#2563eb;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:800;font-size:16px;display:inline-block;box-shadow:0 8px 15px rgba(37,99,235,0.2);">Đặt lại mật khẩu mới</a>
              </div>
              
              <p style="color:#64748b;font-size:13px;margin:0 0 10px;">Nếu bạn không thể nhấn vào nút, hãy sử dụng mã xác nhận bên dưới:</p>
              <div style="background-color:#f8fafc;padding:15px;border-radius:10px;font-family:monospace;word-break:break-all;color:#0f172a;font-size:14px;border:1px solid #e2e8f0;">
                ${resetToken}
              </div>
              
              <p style="color:#94a3b8;font-size:12px;margin:30px 0 0;line-height:1.5;">Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn được an toàn.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">Hệ thống bảo mật Cửa Hàng 118</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log(`🔑 Reset email sent to ${email}`);
    console.log(`🔗 RESET LINK: ${resetUrl}`);

    res.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.',
      ...(process.env.NODE_ENV === 'development' && { devResetToken: resetToken }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/v1/auth/reset-password
// ──────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Thiếu token hoặc mật khẩu mới.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        reset_token: tokenHash,
        reset_token_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    // Cập nhật mật khẩu (Hook beforeSave sẽ tự động hash)
    user.password_hash = newPassword;
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/v1/auth/me (lấy thông tin user hiện tại)
// ──────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
    }

    res.json({ success: true, data: user.toSafeJSON() });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/v1/auth/me (Cập nhật thông tin user hiện tại)
// ──────────────────────────────────────────────────────────
router.put('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
    }

    const { full_name, phone, address } = req.body;
    if (full_name) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({ success: true, message: 'Cập nhật thông tin thành công.', data: user.toSafeJSON() });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Lỗi cập nhật. Token có thể không hợp lệ.' });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/v1/auth/change-password (Đổi mật khẩu cho user đang đăng nhập)
// ──────────────────────────────────────────────────────────
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    // Gán mật khẩu mới (Hook beforeSave sẽ tự động hash)
    user.password_hash = newPassword;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc lỗi xử lý.' });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/v1/auth/available-exchange-vouchers
// ──────────────────────────────────────────────────────────
router.get('/available-exchange-vouchers', async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      where: { 
        points_required: { [Op.gt]: 0 },
        is_active: true,
        user_id: null,
        [Op.or]: [
          { expiry_date: null },
          { expiry_date: { [Op.gt]: new Date() } }
        ]
      },
      order: [['points_required', 'ASC']]
    });
    res.json({ success: true, data: vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/v1/auth/exchange-points
// ──────────────────────────────────────────────────────────
router.post('/exchange-points', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { voucherId } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('Chưa đăng nhập.');

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findByPk(decoded.id, { transaction: t });
    const voucherToExchange = await Voucher.findByPk(voucherId, { transaction: t });

    if (!voucherToExchange || voucherToExchange.points_required <= 0) {
      throw new Error('Mã không hợp lệ để đổi điểm.');
    }

    if (user.points < voucherToExchange.points_required) {
      throw new Error(`Bạn cần ${voucherToExchange.points_required} điểm để đổi mã này.`);
    }

    // 1. Trừ điểm User
    await user.decrement('points', { by: voucherToExchange.points_required, transaction: t });

    // 2. Tạo bản sao riêng cho User
    const userVoucher = await Voucher.create({
      code: `${voucherToExchange.code}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      type: voucherToExchange.type,
      value: voucherToExchange.value,
      min_order_value: voucherToExchange.min_order_value,
      max_discount_value: voucherToExchange.max_discount_value,
      expiry_date: voucherToExchange.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      user_id: user.id,
      is_active: true,
      points_required: 0
    }, { transaction: t });

    await t.commit();
    res.json({ 
      success: true, 
      message: 'Đổi điểm thành công!', 
      data: { 
        voucherCode: userVoucher.code, 
        remainingPoints: user.points - voucherToExchange.points_required 
      } 
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(400).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/v1/auth/my-vouchers (Lấy danh sách voucher của user)
// ──────────────────────────────────────────────────────────
router.get('/my-vouchers', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(decoded.id);

    if (!user) return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại.' });

    const vouchers = await Voucher.findAll({
      where: { user_id: user.id },
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
