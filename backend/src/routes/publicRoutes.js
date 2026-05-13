const express = require('express');
const router = express.Router();
const { RepairOrder, Review, Product, Service, User, Voucher } = require('../models');
const { Op } = require('sequelize');

// ... (stats and reviews routes)

// POST /api/v1/public/check-voucher
router.post('/check-voucher', async (req, res) => {
  try {
    const { code, amount, userId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Thiếu mã giảm giá.' });

    const voucher = await Voucher.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true
      }
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
    }

    // Kiểm tra ngày hết hạn
    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn.' });
    }

    // Kiểm tra giới hạn sử dụng
    if (voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
    }

    // Kiểm tra đơn hàng tối thiểu
    if (amount < Number(voucher.min_order_value)) {
      return res.status(400).json({ 
        success: false, 
        message: `Đơn hàng tối thiểu ${Number(voucher.min_order_value).toLocaleString('vi-VN')}đ để sử dụng mã này.` 
      });
    }

    // Kiểm tra mã riêng của User
    if (voucher.user_id && userId && Number(voucher.user_id) !== Number(userId)) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này không dành cho bạn.' });
    }

    // Tính toán số tiền giảm
    let discountAmount = 0;
    if (voucher.type === 'fixed') {
      discountAmount = Number(voucher.value);
    } else {
      discountAmount = (amount * Number(voucher.value)) / 100;
      if (voucher.max_discount_value) {
        discountAmount = Math.min(discountAmount, Number(voucher.max_discount_value));
      }
    }

    res.json({
      success: true,
      data: {
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        discountAmount,
        voucherId: voucher.id
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/public/stats
router.get('/stats', async (req, res) => {
  try {
    const { fn, col } = require('sequelize');

    // 1. Số lượng thiết bị đã xử lý (tổng RepairOrder) - Dùng count() trực tiếp
    const devicesRepairedCount = await RepairOrder.count();

    // 2. Điểm đánh giá trung bình - Dùng fn('AVG') để xử lý ở DB
    const reviewStats = await Review.findOne({
      attributes: [
        [fn('AVG', col('rating')), 'avgRating']
      ],
      raw: true
    });

    const avgRating = reviewStats && reviewStats.avgRating 
      ? parseFloat(reviewStats.avgRating).toFixed(1) 
      : '4.9';

    // 3. Số sản phẩm & dịch vụ
    const productsCount = await Product.count();
    const servicesCount = await Service.count();

    // Tạo format hiển thị
    const formattedDevices = devicesRepairedCount > 10000 
      ? `${(devicesRepairedCount / 1000).toFixed(1).replace('.0', '')}k+` 
      : devicesRepairedCount > 0 ? `${devicesRepairedCount}+` : '10.000+';

    res.json({
      success: true,
      data: {
        devicesRepaired: formattedDevices,
        avgRating: `${avgRating}/5`,
        completionRate: '95%',
        responseTime: '30 phút',
        productsCount,
        servicesCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/public/reviews
router.get('/reviews', async (req, res) => {
  try {
    // Fetch top recent reviews (rating >= 4)
    const reviews = await Review.findAll({
      where: {
        rating: {
          [require('sequelize').Op.gte]: 4
        }
      },
      include: [
        { model: User, as: 'user', attributes: ['full_name', 'avatar_url'] },
        { model: Product, as: 'product', attributes: ['name', 'category_id'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 6
    });

    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
