const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('services', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  price_label: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Liên hệ',
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  has_warranty: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  warranty_period: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 3, // Mặc định bảo hành 3 tháng
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Service;
