require('dotenv').config();
const { User } = require('../src/models');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  try {
    const admin = await User.findOne({ where: { email: 'admin@cuahang118.vn' } });
    if (!admin) {
      console.log('❌ Admin user NOT found!');
      return;
    }
    console.log('✅ Admin user found:');
    console.log('   Full Name:', admin.full_name);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Password Hash:', admin.password_hash);

    const isMatch = await bcrypt.compare('admin123', admin.password_hash);
    console.log('   Password "admin123" matches:', isMatch);
  } catch (error) {
    console.error('❌ Error checking admin:', error.message);
  } finally {
    process.exit();
  }
}

checkAdmin();
