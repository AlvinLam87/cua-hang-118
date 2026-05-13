const { Category } = require('./src/models');

async function restoreCategories() {
  try {
    console.log('🌱 Đang khôi phục các danh mục gốc...');
    
    // Xóa sạch danh mục cũ để tránh trùng lặp slug
    await Category.destroy({ where: {}, truncate: { cascade: true } });

    await Category.bulkCreate([
      { name: 'Máy tính & Laptop', slug: 'pc', type: 'service', icon: 'MonitorPlay' },
      { name: 'Thiết bị văn phòng', slug: 'office', type: 'service', icon: 'Printer' },
      { name: 'Camera an ninh', slug: 'camera-dv', type: 'service', icon: 'ShieldCheck' },
      { name: 'Linh kiện PC', slug: 'linh-kien', type: 'product', icon: 'Cpu' },
      { name: 'Ổ cứng', slug: 'o-cung', type: 'product', icon: 'HardDrive' },
      { name: 'Camera', slug: 'camera-sp', type: 'product', icon: 'Camera' },
      { name: 'Thiết bị mạng', slug: 'mang', type: 'product', icon: 'Wifi' },
      { name: 'Phụ kiện', slug: 'phu-kien', type: 'product', icon: 'Monitor' },
    ]);

    console.log('✅ Đã khôi phục xong 8 danh mục gốc!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

restoreCategories();
