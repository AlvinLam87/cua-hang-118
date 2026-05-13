const express = require('express');
const router = express.Router();
const { Category } = require('../models');

// GET /api/v1/categories
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    
    // Lấy toàn bộ danh mục dưới dạng phẳng để an toàn nhất
    const categories = await Category.findAll({ 
      where,
      order: [['id', 'ASC']]
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
