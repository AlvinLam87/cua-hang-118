const express = require('express');
const router = express.Router();
const { Order } = require('../models');

function normalizeWebhookBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (body.payload) {
    const p = body.payload;
    return typeof p === 'string' ? (() => { try { return JSON.parse(p); } catch { return body; } })() : p;
  }
  return body;
}

function extractOrderId(data) {
  const texts = [
    data?.code,
    data?.content,
    data?.description,
    data?.transaction_content,
  ]
    .filter((v) => v != null && v !== '')
    .map(String);

  for (const text of texts) {
    const match = text.match(/DH[\s\-_.]*(\d+)/i);
    if (match) return match[1];
  }

  for (const text of texts) {
    const digits = text.replace(/\D/g, '');
    if (digits.length >= 1 && digits.length <= 8) return digits;
  }

  return null;
}

function verifySepayAuth(req) {
  const expectedKey = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!expectedKey) return true;

  const auth = (req.headers.authorization || '').trim();
  const valid = [
    `Apikey ${expectedKey}`,
    `apikey ${expectedKey}`,
    `APIKEY ${expectedKey}`,
  ];
  return valid.includes(auth);
}

async function markOrderPaid(order, orderId, meta = {}) {
  if (order.payment_status === 'paid') return false;

  order.payment_status = 'paid';
  order.status = 'confirmed';
  await order.save();

  console.log(`✅ Đã xác nhận thanh toán đơn #${orderId}`, meta);

  try {
    const socketConfig = require('../config/socket');
    const io = socketConfig.getIO();
    if (io) {
      const payload = {
        type: 'order',
        action: 'payment',
        id: Number(orderId),
        payment_status: 'paid',
        status: 'confirmed',
        message: `Đơn #${orderId} đã thanh toán`,
      };
      io.emit('new_product_order', payload);
      io.emit('data_changed', payload);
    }
  } catch (sErr) {
    console.warn('⚠️ [Socket] Payment notify warning:', sErr.message);
  }
  return true;
}

const sepayOk = (res) => res.status(200).json({ success: true });

// Webhook từ SePay.vn gửi về
router.post('/webhook-sepay', async (req, res) => {
  try {
    if (!verifySepayAuth(req)) {
      console.warn('⚠️ [SePay] Webhook từ chối: sai Authorization header');
      return res.status(401).json({ success: false });
    }

    const data = normalizeWebhookBody(req.body);
    console.log('--- NHẬN WEBHOOK SEPAY ---', JSON.stringify(data));

    if (data.transferType && data.transferType !== 'in') {
      console.log('ℹ️ Bỏ qua giao dịch chiều ra:', data.id);
      return sepayOk(res);
    }

    const orderId = extractOrderId(data);
    if (!orderId) {
      console.log('⚠️ Không tìm thấy mã đơn:', { code: data.code, content: data.content, description: data.description });
      return sepayOk(res);
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      console.log('⚠️ Đơn hàng không tồn tại:', orderId);
      return sepayOk(res);
    }

    await markOrderPaid(order, orderId, { source: 'sepay', sepayId: data.id, amount: data.transferAmount });
    return sepayOk(res);
  } catch (error) {
    console.error('❌ Lỗi xử lý Webhook SePay:', error.message);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
module.exports.markOrderPaid = markOrderPaid;
module.exports.extractOrderId = extractOrderId;
