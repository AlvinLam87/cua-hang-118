const express = require('express');
const router = express.Router();
const { Order } = require('../models');

function extractOrderId(data) {
  const code = data?.code;
  if (code) {
    const fromCode = String(code).match(/DH(\d+)/i);
    if (fromCode) return fromCode[1];
  }
  const content = data?.content || '';
  const fromContent = content.match(/DH(\d+)/i);
  return fromContent ? fromContent[1] : null;
}

// SePay chỉ coi webhook thành công khi body đúng {"success": true}
const sepayOk = (res) => res.status(200).json({ success: true });

// Webhook từ SePay.vn gửi về
router.post('/webhook-sepay', async (req, res) => {
  try {
    const data = req.body || {};
    console.log('--- NHẬN WEBHOOK SEPAY ---', data);

    if (data.transferType && data.transferType !== 'in') {
      console.log('ℹ️ Bỏ qua giao dịch chiều ra:', data.id);
      return sepayOk(res);
    }

    const orderId = extractOrderId(data);
    if (!orderId) {
      console.log('⚠️ Không tìm thấy mã đơn (code/content):', data.code, data.content);
      return sepayOk(res);
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      console.log('⚠️ Đơn hàng không tồn tại:', orderId);
      return sepayOk(res);
    }

    if (order.payment_status === 'paid') {
      console.log(`ℹ️ Đơn #${orderId} đã thanh toán trước đó, bỏ qua.`);
      return sepayOk(res);
    }

    order.payment_status = 'paid';
    order.status = 'confirmed';
    await order.save();

    console.log(`✅ Đã xác nhận thanh toán tự động cho đơn hàng #${orderId} (SePay #${data.id}, ${data.transferAmount || 0}đ)`);

    try {
      const socketConfig = require('../config/socket');
      const io = socketConfig.getIO();
      if (io) {
        io.emit('data_changed', { type: 'order', id: Number(orderId), payment_status: 'paid', status: 'confirmed' });
      }
    } catch (sErr) {
      console.warn('⚠️ [Socket] SePay socket notify warning:', sErr.message);
    }

    return sepayOk(res);
  } catch (error) {
    console.error('❌ Lỗi xử lý Webhook SePay:', error.message);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
