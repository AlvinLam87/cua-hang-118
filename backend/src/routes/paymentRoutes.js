const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
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

  if (data?.code) {
    const codeDigits = String(data.code).replace(/\D/g, '');
    if (codeDigits.length >= 1 && codeDigits.length <= 8) return codeDigits;
  }

  return null;
}

function verifySepayAuth(req) {
  const expectedKey = (process.env.SEPAY_WEBHOOK_API_KEY || '').trim();
  if (!expectedKey) return { ok: true };

  const auth = (req.headers.authorization || '').trim();
  const match = auth.match(/^apikey\s+(.+)$/i);
  const sentKey = match ? match[1].trim() : '';

  if (sentKey === expectedKey) return { ok: true };

  return {
    ok: false,
    hint: `Authorization không khớp SEPAY_WEBHOOK_API_KEY (nhận: ${auth ? 'có header' : 'thiếu header'})`,
  };
}

async function findOrderFromWebhook(data) {
  const orderId = extractOrderId(data);
  if (orderId) {
    const order = await Order.findByPk(orderId);
    if (order) return { order, orderId: String(order.id) };
  }

  const amount = Number(data.transferAmount) || 0;
  if (amount <= 0) return null;

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const candidates = await Order.findAll({
    where: {
      payment_method: 'bank_transfer',
      payment_status: 'unpaid',
      created_at: { [Op.gte]: since },
    },
    order: [['id', 'DESC']],
    limit: 30,
  });

  const matched = candidates.filter(
    (o) => Math.abs(parseFloat(o.total_amount) - amount) < 1
  );

  if (matched.length === 1) {
    console.log(`ℹ️ [SePay] Khớp đơn #${matched[0].id} theo số tiền ${amount}`);
    return { order: matched[0], orderId: String(matched[0].id) };
  }

  if (matched.length > 1) {
    console.warn(`⚠️ [SePay] Nhiều đơn cùng số tiền ${amount} — cần nội dung DH{id}`);
  }

  return null;
}

async function markOrderPaid(order, orderId, meta = {}) {
  if (order.payment_status === 'paid') return false;

  await order.update({
    payment_status: 'paid',
    status: 'confirmed',
  });

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

router.get('/webhook-sepay/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint OK',
    authConfigured: Boolean((process.env.SEPAY_WEBHOOK_API_KEY || '').trim()),
  });
});

router.get('/webhook-sepay', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint nhận webhook SePay (chỉ POST). Test: GET .../webhook-sepay/ping',
    postUrl: '/api/v1/payments/webhook-sepay',
    pingUrl: '/api/v1/payments/webhook-sepay/ping',
  });
});

router.post('/webhook-sepay', async (req, res) => {
  try {
    const authCheck = verifySepayAuth(req);
    if (!authCheck.ok) {
      console.warn('⚠️ [SePay] Webhook 401:', authCheck.hint);
      return res.status(401).json({ success: false, message: 'Unauthorized webhook' });
    }

    const data = normalizeWebhookBody(req.body);
    console.log('--- NHẬN WEBHOOK SEPAY ---', JSON.stringify(data));

    if (data.transferType && data.transferType !== 'in') {
      return sepayOk(res);
    }

    const found = await findOrderFromWebhook(data);
    if (!found) {
      console.log('⚠️ Không khớp đơn:', {
        code: data.code,
        content: data.content,
        amount: data.transferAmount,
      });
      return sepayOk(res);
    }

    await markOrderPaid(found.order, found.orderId, {
      source: 'sepay',
      sepayId: data.id,
      amount: data.transferAmount,
    });
    return sepayOk(res);
  } catch (error) {
    console.error('❌ Lỗi xử lý Webhook SePay:', error.message, error.stack);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
module.exports.markOrderPaid = markOrderPaid;
module.exports.extractOrderId = extractOrderId;
module.exports.findOrderFromWebhook = findOrderFromWebhook;
