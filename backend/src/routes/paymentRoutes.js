const express = require('express');
const router = express.Router();
const { Order } = require('../models');

// Webhook từ SePay.vn gửi về
router.post('/webhook-sepay', async (req, res) => {
  try {
    const data = req.body;
    console.log('--- NHẬN WEBHOOK SEPAY ---', data);

    // Dữ liệu SePay gửi về có dạng:
    // {
    //   "id": 123,
    //   "content": "DH1001", // Nội dung chuyển khoản
    //   "transferAmount": 500000,
    //   "transferType": "in",
    //   "gateway": "VPBank",
    //   ...
    // }

    const content = data.content || "";
    const amount = data.transferAmount || 0;

    // Tìm mã đơn hàng trong nội dung (Ví dụ khách ghi: DH1024 hoặc đơn giản là 1024)
    // Regex tìm chuỗi DH cộng với số phía sau
    const orderMatch = content.match(/DH(\d+)/i);
    const orderId = orderMatch ? orderMatch[1] : null;

    if (!orderId) {
      console.log('⚠️ Không tìm thấy mã đơn hàng trong nội dung:', content);
      return res.json({ success: false, message: 'No order ID found' });
    }

    // Tìm đơn hàng trong database
    const order = await Order.findByPk(orderId);

    if (!order) {
      console.log('⚠️ Đơn hàng không tồn tại:', orderId);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Kiểm tra trạng thái và số tiền (Tùy chọn: có thể bỏ qua kiểm tra tiền nếu muốn linh hoạt)
    // if (order.total_amount > amount) {
    //   console.log('⚠️ Số tiền chuyển thiếu:', amount, 'so với', order.total_amount);
    // }

    // Cập nhật trạng thái đơn hàng
    order.payment_status = 'paid';
    order.status = 'processing'; // Chuyển sang trạng thái đang xử lý
    await order.save();

    console.log(`✅ Đã xác nhận thanh toán tự động cho đơn hàng #${orderId}`);

    return res.json({ success: true, message: 'Payment confirmed' });
  } catch (error) {
    console.error('❌ Lỗi xử lý Webhook SePay:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
