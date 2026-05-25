const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Order, OrderItem, Product, sequelize } = require('../models');
const { jwtSecret } = require('../config/env');
const { phonesMatch } = require('../utils/phone');

const calculateShippingFee = ({ shippingAddress = '', subtotal = 0 }) => {
  const normalized = shippingAddress.toLowerCase();
  if (subtotal >= 2000000) return 0;
  
  if (normalized.includes('bạc liêu') || normalized.includes('cà mau')) {
    if (normalized.includes('thành phố') || normalized.includes('thị xã') || normalized.includes('tp ')) {
       return 15000;
    }
    return 25000;
  }
  
  return 40000;
};

// Helper to get user ID if logged in (optional)
const getUserId = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], jwtSecret);
    return decoded.id;
  } catch (err) {
    return null;
  }
};

// POST /api/v1/orders
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, guest_name, guest_phone, shipping_address, note, payment_method = 'cod', voucher_id, discount_amount = 0 } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
    }
    if (!guest_name || !guest_phone || !shipping_address) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin giao hàng.' });
    }

    const customer_id = getUserId(req);

    // Tính tổng tiền sản phẩm và lấy giá sản phẩm
    let subtotal_amount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.id, { transaction: t });
      if (!product || !product.is_active) {
        throw new Error(`Sản phẩm ${item.name} không tồn tại hoặc ngừng kinh doanh.`);
      }
      if (product.stock_quantity < item.qty) {
        throw new Error(`Sản phẩm ${product.name} không đủ số lượng trong kho.`);
      }

      const price = parseFloat(product.price);
      subtotal_amount += price * item.qty;

      orderItemsData.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.qty,
        price_at_purchase: price,
        line_total: price * item.qty,
      });

      // Trừ tồn kho tạm thời
      product.stock_quantity -= item.qty;
      if (product.stock_quantity === 0) {
        product.in_stock = false;
      }
      await product.save({ transaction: t });
    }

    const shipping_fee = calculateShippingFee({
      shippingAddress: shipping_address,
      subtotal: subtotal_amount,
    });
    
    // Tính tổng cộng sau giảm giá
    const total_amount = Math.max(0, subtotal_amount + shipping_fee - Number(discount_amount));

    // Tạo Order
    const order = await Order.create({
      customer_id,
      guest_name,
      guest_phone,
      shipping_address,
      note,
      total_amount,
      status: 'pending',
      payment_method,
      payment_status: 'unpaid',
      voucher_id: voucher_id || null,
      discount_amount: Number(discount_amount) || 0
    }, { transaction: t });

    // Cập nhật lượt dùng voucher
    if (voucher_id) {
      const { Voucher } = require('../models');
      const v = await Voucher.findByPk(voucher_id, { transaction: t });
      if (v) {
        await v.increment('used_count', { by: 1, transaction: t });
      }
    }

    // Tạo Order Items
    const itemsToCreate = orderItemsData.map(data => ({
      ...data,
      order_id: order.id,
    }));
    await OrderItem.bulkCreate(itemsToCreate, { transaction: t });

    await t.commit();

    try {
      const socketConfig = require('../config/socket');
      const io = socketConfig.getIO();
      if (io) {
        const payload = {
          type: 'order',
          action: 'create',
          id: order.id,
          guest_name,
          guest_phone,
          total_amount,
          payment_method,
          payment_status: 'unpaid',
          status: 'pending',
          message: `Đơn hàng mới #${order.id} từ ${guest_name}`,
        };
        io.emit('new_product_order', payload);
        io.emit('data_changed', payload);
      }
    } catch (socketErr) {
      console.warn('⚠️ [Socket] Không thể gửi thông báo đơn hàng mới:', socketErr.message);
    }

    // Fire email asynchronously if user is logged in
    if (customer_id) {
      const { User } = require('../models');
      const user = await User.findByPk(customer_id);
      if (user && user.email) {
        const { sendEmail } = require('../utils/mailer');
        const formatPrice = (p) => parseFloat(p).toLocaleString('vi-VN') + 'đ';
        
        let itemsHtml = itemsToCreate.map((item) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name || `Sản phẩm #${item.product_id}`}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price_at_purchase)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatPrice(item.line_total || (item.quantity * item.price_at_purchase))}</td>
          </tr>
        `).join('');

        const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:40px;text-align:center;">
              <div style="background:rgba(255,255,255,0.1);display:inline-block;padding:8px 16px;border-radius:10px;margin-bottom:16px;">
                <span style="color:#60a5fa;font-size:12px;font-weight:800;letter-spacing:4px;text-transform:uppercase;">Cửa Hàng 118</span>
              </div>
              <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0;">Đặt Hàng Thành Công!</h1>
              <p style="color:#94a3b8;margin:8px 0 0;">Cảm ơn bạn đã tin tưởng mua sắm tại 118.</p>
            </td>
          </tr>

          <!-- Summary Info -->
          <tr>
            <td style="padding:30px 40px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%">
                    <p style="color:#64748b;font-size:12px;text-transform:uppercase;margin:0 0 4px;font-weight:700;">Mã đơn hàng</p>
                    <p style="color:#0f172a;font-size:18px;font-weight:900;margin:0;">#${order.id}</p>
                  </td>
                  <td width="50%" align="right">
                    <p style="color:#64748b;font-size:12px;text-transform:uppercase;margin:0 0 4px;font-weight:700;">Trạng thái</p>
                    <p style="color:#2563eb;font-size:15px;font-weight:700;margin:0;">Đang xử lý</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#475569;">Xin chào <strong>${guest_name}</strong>, đơn hàng của bạn đã được tiếp nhận và đang chờ bộ phận kho xử lý.</p>
              
              <h3 style="font-size:16px;font-weight:800;margin:30px 0 15px;color:#0f172a;border-left:4px solid #2563eb;padding-left:12px;">Chi tiết đơn hàng</h3>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr>
                    <th style="padding:12px 8px;text-align:left;border-bottom:2px solid #f1f5f9;color:#64748b;font-size:12px;text-transform:uppercase;">Sản phẩm</th>
                    <th style="padding:12px 8px;text-align:center;border-bottom:2px solid #f1f5f9;color:#64748b;font-size:12px;text-transform:uppercase;">SL</th>
                    <th style="padding:12px 8px;text-align:right;border-bottom:2px solid #f1f5f9;color:#64748b;font-size:12px;text-transform:uppercase;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding:20px 8px 8px;text-align:right;color:#64748b;font-size:14px;">Tạm tính:</td>
                    <td style="padding:20px 8px 8px;text-align:right;font-weight:700;color:#0f172a;">${formatPrice(subtotal_amount)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:8px;text-align:right;color:#64748b;font-size:14px;">Phí vận chuyển:</td>
                    <td style="padding:8px;text-align:right;font-weight:700;color:#0f172a;">${shipping_fee === 0 ? 'Miễn phí' : formatPrice(shipping_fee)}</td>
                  </tr>
                  ${discount_amount > 0 ? `
                  <tr>
                    <td colspan="2" style="padding:8px;text-align:right;color:#10b981;font-size:14px;">Giảm giá:</td>
                    <td style="padding:8px;text-align:right;font-weight:700;color:#10b981;">-${formatPrice(discount_amount)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td colspan="2" style="padding:20px 8px 8px;text-align:right;font-size:16px;font-weight:800;color:#0f172a;">Tổng thanh toán:</td>
                    <td style="padding:20px 8px 8px;text-align:right;font-size:22px;font-weight:900;color:#ef4444;">${formatPrice(total_amount)}</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Delivery Info -->
              <div style="margin-top:40px;padding:24px;background-color:#f8fafc;border-radius:16px;border:1px solid #f1f5f9;">
                <h4 style="margin:0 0 15px;color:#0f172a;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Thông tin giao hàng</h4>
                <p style="margin:8px 0;font-size:14px;color:#475569;"><strong>👤 Người nhận:</strong> ${guest_name}</p>
                <p style="margin:8px 0;font-size:14px;color:#475569;"><strong>📞 SĐT:</strong> ${guest_phone}</p>
                <p style="margin:8px 0;font-size:14px;color:#475569;"><strong>📍 Địa chỉ:</strong> ${shipping_address}</p>
                <p style="margin:8px 0;font-size:14px;color:#475569;"><strong>💳 Thanh toán:</strong> ${payment_method === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt (COD)'}</p>
              </div>

              <div style="margin-top:30px;padding:15px;background-color:#fffbeb;border-radius:12px;border:1px solid #fef3c7;text-align:center;">
                <p style="margin:0;font-size:13px;color:#92400e;">Quý khách vui lòng kiểm tra kỹ sản phẩm khi nhận hàng.</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:30px;text-align:center;">
              <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Cửa Hàng 118 — Linh Kiện & Giải Pháp IT</p>
              <p style="color:#64748b;font-size:11px;margin:0;">📍 Bạc Liêu &nbsp;|&nbsp; 📞 0704.818.118</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        sendEmail({
          to: user.email,
          subject: `[Cửa Hàng 118] Hóa đơn điện tử - Đơn hàng #${order.id}`,
          html: htmlContent
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: { order_id: order.id, subtotal_amount, shipping_fee, total_amount, payment_method }
    });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/v1/orders/my-orders (đặt trước /:id để tránh nuốt path)
router.get('/my-orders', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    console.log('--- Đang lấy đơn hàng cho User ID:', decoded.id, '---');

    const orders = await Order.findAll({
      where: { customer_id: decoded.id },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'image_url'] }],
      }],
      order: [['created_at', 'DESC']],
    });

    console.log('=> Tìm thấy:', orders.length, 'đơn hàng.');
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('❌ Lỗi API my-orders:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/orders/:id/payment-status?phone= — khách poll trạng thái CK
router.get('/:id/payment-status', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const phone = String(req.query.phone || '').trim();
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Thiếu số điện thoại xác minh.' });
    }

    const order = await Order.findByPk(req.params.id, {
      attributes: ['id', 'guest_phone', 'payment_method', 'payment_status', 'status', 'total_amount'],
    });

    if (!order || !phonesMatch(order.guest_phone, phone)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    return res.json({
      success: true,
      data: {
        order_id: order.id,
        payment_status: order.payment_status,
        status: order.status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/orders/:id/claim-bank-transfer — khách báo đã CK
router.post('/:id/claim-bank-transfer', async (req, res) => {
  try {
    const phone = String(req.body.guest_phone || '').trim();
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Thiếu số điện thoại.' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order || !phonesMatch(order.guest_phone, phone)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    if (order.payment_method !== 'bank_transfer') {
      return res.status(400).json({ success: false, message: 'Đơn này không dùng chuyển khoản.' });
    }

    // Không tự đổi paid khi khách bấm nút — chỉ SePay webhook hoặc admin mới xác nhận tiền thật.
    try {
      const socketConfig = require('../config/socket');
      const io = socketConfig.getIO();
      if (io) {
        io.emit('data_changed', {
          type: 'order',
          action: 'transfer_claimed',
          id: order.id,
          message: `Khách báo đã CK đơn #${order.id} — cần đối soát`,
        });
      }
    } catch (socketErr) {
      console.warn('⚠️ [Socket] claim transfer:', socketErr.message);
    }

    await order.reload();

    return res.json({
      success: true,
      message: order.payment_status === 'paid'
        ? 'Đơn đã được xác nhận thanh toán trước đó.'
        : 'Đã ghi nhận báo chuyển khoản. Cửa hàng sẽ đối soát — chưa xác nhận tự động.',
      data: {
        payment_status: order.payment_status,
        status: order.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
