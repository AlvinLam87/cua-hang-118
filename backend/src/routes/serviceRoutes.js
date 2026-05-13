const express = require('express');
const router = express.Router();
const { Service, Category, User } = require('../models');

// GET /api/v1/services/technicians
router.get('/technicians', async (req, res) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician', is_active: true },
      attributes: ['id', 'full_name', 'avatar_url', 'phone', 'email', 'role', 'position', 'gender', 'experience_years', 'specialty', 'rating', 'age', 'skills'],
    });
    res.json({ success: true, data: technicians });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
});

// GET /api/v1/services
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const where = { is_active: true };
    if (category) {
      // Find category by slug
      const cat = await Category.findOne({ where: { slug: category, type: 'service' } });
      if (cat) where.category_id = cat.id;
    }
    const services = await Service.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] }],
      order: [['category_id', 'ASC'], ['id', 'ASC']],
    });
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/services/:id
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }],
    });
    if (!service) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ.' });
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
