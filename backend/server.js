require('dotenv').config();
const { allowedCorsOrigins } = require('./src/config/env');
const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const seedDatabase = require('./src/seeders/seed');
const socketConfig = require('./src/config/socket');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test kết nối database
    await sequelize.authenticate();
    console.log('✅ Kết nối PostgreSQL thành công!');

    // Sync database - Sử dụng alter: true thay vì force: true để bảo vệ dữ liệu người dùng
    const isSeeding = process.argv.includes('--seed');
    await sequelize.sync({ alter: true });
    console.log('✅ Đồng bộ database thành công (Safety Mode)!');
    
    // Seed dữ liệu nếu chạy với flag --seed
    if (isSeeding) {
      await seedDatabase();
    }

    // Khởi chạy server với http
    const server = http.createServer(app);
    socketConfig.init(server); // Khởi tạo Socket.io

    server.listen(PORT, () => {
      console.log(`\n🚀 Cửa Hàng 118 API Server`);
      console.log(`📡 Running on: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: PostgreSQL (${process.env.DB_NAME || 'cuahang118'})\n`);
      if (allowedCorsOrigins.length > 0) {
        console.log(`🌐 Allowed CORS origins: ${allowedCorsOrigins.join(', ')}\n`);
      } else {
        console.log('🌐 Allowed CORS origins: all (CORS_ORIGINS not set)\n');
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error.message);
    console.error('\n💡 Hướng dẫn:');
    console.error('   1. Đảm bảo PostgreSQL đang chạy');
    console.error('   2. Tạo database: CREATE DATABASE cuahang118;');
    console.error('   3. Cập nhật file .env với thông tin DB đúng');
    console.error('   4. Chạy lại: npm run dev\n');
    process.exit(1);
  }
}

startServer();