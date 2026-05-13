const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('bookings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  service: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  booking_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  booking_time: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  preferred_technician_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Booking;
