const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('orders', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  guest_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  guest_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  shipping_address: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipping', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  payment_method: {
    type: DataTypes.ENUM('cod', 'bank_transfer'),
    defaultValue: 'cod',
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
    defaultValue: 'unpaid',
    allowNull: false,
  },
  voucher_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = Order;
