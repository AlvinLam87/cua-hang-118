const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Review, User, Product } = require('../models');
const { jwtSecret } = require('../config/env');

// GET /api/v1/reviews/:productId
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { product_id: req.params.productId },
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
    });

    // Calculate average
    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 0;
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => { distribution[r.rating - 1]++; });

    res.json({
      success: true,
      data: {
        reviews,
        stats: { total, avgRating: parseFloat(avgRating), distribution },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/reviews
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đánh giá.' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], jwtSecret);

    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá.' });
    }

    // Check if user already reviewed
    const existing = await Review.findOne({ where: { user_id: decoded.id, product_id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi.' });
    }

    const review = await Review.create({
      user_id: decoded.id,
      product_id,
      rating,
      comment: comment || null,
    });

    // Fetch with user info
    const full = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'avatar_url'] }],
    });

    res.status(201).json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
