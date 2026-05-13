const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovement = sequelize.define('stock_movements', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('IN', 'OUT', 'ADJUST'),
    allowNull: false,
    defaultValue: 'IN'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Cost price if IN, sale price if OUT'
  },
  reason: {
    type: DataTypes.STRING(200),
    allowNull: true,
    placeholder: 'Nhập hàng, Bán hàng, Điều chỉnh, Trả hàng...'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = StockMovement;
