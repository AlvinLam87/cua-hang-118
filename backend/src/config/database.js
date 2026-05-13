require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cuahang118',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,       // createdAt, updatedAt tự động
      underscored: true,      // snake_case cho tên cột (created_at thay vì createdAt)
      freezeTableName: true,  // Không tự động thêm 's' vào tên bảng
    },
  }
);

module.exports = sequelize;
