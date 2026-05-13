const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RepairStep = sequelize.define('repair_steps', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  repair_order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  step_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  is_done: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  completed_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
});

module.exports = RepairStep;
