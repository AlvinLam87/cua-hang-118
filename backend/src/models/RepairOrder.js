const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RepairOrder = sequelize.define('repair_orders', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  receipt_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  device_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  device_serial: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  device_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  device_image_before: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  device_image_after: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  issue: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estimated_cost: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  final_cost: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  technician_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed', 'returned', 'cancelled'),
    defaultValue: 'received',
  },
  received_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  completed_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  warranty_period: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  warranty_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  warranty_terms: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['receipt_code']
    }
  ]
});

module.exports = RepairOrder;
