const { Category, Service, Product, Customer, RepairOrder, RepairStep, Booking, User } = require('../models');

async function seedDatabase() {
  console.log('🌱 Bắt đầu seed dữ liệu mẫu...');

  // ─── Categories ──────────────────────────────────────────
  const categories = await Category.bulkCreate([
    // Service categories
    { name: 'Máy tính & Laptop', slug: 'pc', type: 'service', icon: 'MonitorPlay', description: 'Sửa chữa, nâng cấp PC và Laptop' },
    { name: 'Thiết bị văn phòng', slug: 'office', type: 'service', icon: 'Printer', description: 'Máy in, scanner, mạng LAN/WiFi' },
    { name: 'Camera an ninh', slug: 'camera', type: 'service', icon: 'ShieldCheck', description: 'Lắp đặt và bảo trì camera giám sát' },
    // Product categories
    { name: 'Linh kiện PC', slug: 'linh-kien', type: 'product', icon: 'Cpu' },
    { name: 'Ổ cứng', slug: 'o-cung', type: 'product', icon: 'HardDrive' },
    { name: 'Camera', slug: 'camera-sp', type: 'product', icon: 'Camera' },
    { name: 'Thiết bị mạng', slug: 'mang', type: 'product', icon: 'Wifi' },
    { name: 'Phụ kiện', slug: 'phu-kien', type: 'product', icon: 'Monitor' },
  ]);

  const catMap = {};
  categories.forEach((c) => { catMap[c.slug] = c.id; });

  // ─── Services ────────────────────────────────────────────
  await Service.bulkCreate([
    { category_id: catMap['pc'], name: 'Cài đặt lại Windows / macOS', price: 200000, price_label: 'Từ 200.000đ', icon: 'Monitor' },
    { category_id: catMap['pc'], name: 'Thay thế màn hình laptop', price: 800000, price_label: 'Từ 800.000đ', icon: 'MonitorPlay' },
    { category_id: catMap['pc'], name: 'Nâng cấp RAM / SSD', price: 300000, price_label: 'Từ 300.000đ', icon: 'Cpu' },
    { category_id: catMap['pc'], name: 'Sửa lỗi mainboard', price: 500000, price_label: 'Từ 500.000đ', icon: 'HardDrive' },
    { category_id: catMap['pc'], name: 'Vệ sinh, bảo dưỡng định kỳ', price: 150000, price_label: 'Từ 150.000đ', icon: 'Wrench' },
    { category_id: catMap['pc'], name: 'Khôi phục dữ liệu', price: 500000, price_label: 'Từ 500.000đ', icon: 'HardDrive' },

    { category_id: catMap['office'], name: 'Sửa chữa máy in Laser / Phun', price: 200000, price_label: 'Từ 200.000đ', icon: 'Printer' },
    { category_id: catMap['office'], name: 'Nạp mực, thay drum máy in', price: 80000, price_label: 'Từ 80.000đ', icon: 'Printer' },
    { category_id: catMap['office'], name: 'Lắp đặt mạng LAN văn phòng', price: 500000, price_label: 'Từ 500.000đ', icon: 'Wifi' },
    { category_id: catMap['office'], name: 'Cấu hình WiFi doanh nghiệp', price: 300000, price_label: 'Từ 300.000đ', icon: 'Wifi' },
    { category_id: catMap['office'], name: 'Thiết lập NAS / Server', price: 1000000, price_label: 'Từ 1.000.000đ', icon: 'HardDrive' },
    { category_id: catMap['office'], name: 'Bảo trì hệ thống định kỳ', price: 0, price_label: 'Liên hệ', icon: 'Wrench' },

    { category_id: catMap['camera'], name: 'Lắp bộ 2 camera IP 2MP', price: 2500000, price_label: 'Từ 2.500.000đ', icon: 'Camera' },
    { category_id: catMap['camera'], name: 'Lắp bộ 4 camera Full HD', price: 4500000, price_label: 'Từ 4.500.000đ', icon: 'Camera' },
    { category_id: catMap['camera'], name: 'Lắp bộ 8 camera có đầu ghi', price: 8000000, price_label: 'Từ 8.000.000đ', icon: 'Camera' },
    { category_id: catMap['camera'], name: 'Camera chống nước ngoài trời', price: 1200000, price_label: 'Từ 1.200.000đ', icon: 'ShieldCheck' },
    { category_id: catMap['camera'], name: 'Bảo trì hệ thống camera', price: 300000, price_label: 'Từ 300.000đ', icon: 'Wrench' },
    { category_id: catMap['camera'], name: 'Nâng cấp hệ thống cũ', price: 0, price_label: 'Liên hệ', icon: 'Cpu' },
  ]);

  // ─── Products ────────────────────────────────────────────
  await Product.bulkCreate([
    { category_id: catMap['linh-kien'], name: 'RAM DDR4 8GB Kingston', price: 450000, icon: 'Cpu', image_url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&q=80', rating: 5, in_stock: true, stock_quantity: 25, is_hot: true },
    { category_id: catMap['linh-kien'], name: 'RAM DDR4 16GB Corsair', price: 850000, icon: 'Cpu', image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80', rating: 5, in_stock: true, stock_quantity: 15, is_hot: false },
    { category_id: catMap['o-cung'], name: 'SSD 256GB Samsung SATA', price: 650000, icon: 'HardDrive', image_url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&q=80', rating: 4, in_stock: true, stock_quantity: 30, is_hot: true },
    { category_id: catMap['o-cung'], name: 'SSD 512GB NVMe M.2', price: 1200000, icon: 'HardDrive', image_url: 'https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=500&q=80', rating: 5, in_stock: true, stock_quantity: 10, is_hot: false },
    { category_id: catMap['camera-sp'], name: 'Camera IP 2MP Hikvision', price: 890000, icon: 'Camera', image_url: 'https://images.unsplash.com/photo-1557805128-d88698bf4a15?w=500&q=80', rating: 4, in_stock: true, stock_quantity: 20, is_hot: true },
    { category_id: catMap['camera-sp'], name: 'Camera PTZ 4MP Dahua', price: 3200000, icon: 'Camera', image_url: 'https://images.unsplash.com/photo-1558005530-cb61d21134af?w=500&q=80', rating: 5, in_stock: false, stock_quantity: 0, is_hot: false },
    { category_id: catMap['mang'], name: 'Router WiFi 6 TP-Link AX1500', price: 1200000, icon: 'Wifi', image_url: 'https://images.unsplash.com/photo-1544321682-ab0018596645?w=500&q=80', rating: 4, in_stock: true, stock_quantity: 12, is_hot: false },
    { category_id: catMap['mang'], name: 'Switch 8 Port Gigabit', price: 450000, icon: 'Wifi', image_url: 'https://images.unsplash.com/photo-1558231579-247514a601be?w=500&q=80', rating: 4, in_stock: true, stock_quantity: 18, is_hot: false },
    { category_id: catMap['phu-kien'], name: 'Màn hình 24" Full HD', price: 3500000, icon: 'Monitor', image_url: 'https://images.unsplash.com/photo-1527443154391-4cf15d2aeb37?w=500&q=80', rating: 5, in_stock: true, stock_quantity: 5, is_hot: true },
    { category_id: catMap['phu-kien'], name: 'Bàn phím cơ Gaming', price: 750000, icon: 'Monitor', image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80', rating: 4, in_stock: true, stock_quantity: 8, is_hot: false },
    { category_id: catMap['phu-kien'], name: 'Mực in HP 107A chính hãng', price: 350000, icon: 'Printer', image_url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&q=80', rating: 4, in_stock: true, stock_quantity: 40, is_hot: false },
    { category_id: catMap['camera-sp'], name: 'Đầu ghi hình 8 kênh', price: 2800000, icon: 'Camera', image_url: 'https://images.unsplash.com/photo-1563811802-1f486d528b8b?w=500&q=80', rating: 5, in_stock: true, stock_quantity: 7, is_hot: false },
  ]);

  // ─── Customers ───────────────────────────────────────────
  const [customerA, customerB] = await Customer.bulkCreate([
    { name: 'Nguyễn Văn A', phone: '0913456789', email: 'nguyenvana@gmail.com', address: '12, Trần Hưng Đạo, Phường Bạc Liêu, Tỉnh Cà Mau' },
    { name: 'Trần Thị B', phone: '0924567890', email: 'tranthib@gmail.com', address: '88, Lý Thường Kiệt, Phường Bạc Liêu, Tỉnh Cà Mau' },
  ]);

  // ─── Repair Orders ──────────────────────────────────────
  const order1 = await RepairOrder.create({
    receipt_code: 'RCV-118001',
    customer_id: customerA.id,
    device_name: 'Laptop Dell Inspiron 15',
    issue: 'Không lên nguồn, cần thay IC nguồn',
    diagnosis: 'IC nguồn bị cháy, cần thay thế mới',
    estimated_cost: 800000,
    technician_name: 'Kỹ thuật viên Minh',
    status: 'in_progress',
    received_date: '2026-03-14',
  });

  const order2 = await RepairOrder.create({
    receipt_code: 'RCV-118002',
    customer_id: customerB.id,
    device_name: 'Máy in HP LaserJet Pro',
    issue: 'Kẹt giấy liên tục, cần thay lô kéo giấy',
    diagnosis: 'Lô kéo giấy mòn, đã thay mới',
    estimated_cost: 350000,
    final_cost: 350000,
    technician_name: 'Kỹ thuật viên Minh',
    status: 'completed',
    received_date: '2026-03-12',
    completed_date: '2026-03-15',
  });

  // ─── Repair Steps ───────────────────────────────────────
  const defaultSteps = [
    'Tiếp nhận thiết bị',
    'Chẩn đoán lỗi',
    'Báo giá cho khách',
    'Đang sửa chữa',
    'Kiểm tra & bàn giao',
  ];

  // Order 1: steps 1-3 done
  for (let i = 0; i < defaultSteps.length; i++) {
    await RepairStep.create({
      repair_order_id: order1.id,
      step_order: i + 1,
      label: defaultSteps[i],
      is_done: i < 3,
      completed_date: i < 3 ? ['2026-03-14', '2026-03-14', '2026-03-15'][i] : null,
    });
  }

  // Order 2: all steps done
  const order2Dates = ['2026-03-12', '2026-03-12', '2026-03-12', '2026-03-13', '2026-03-15'];
  for (let i = 0; i < defaultSteps.length; i++) {
    await RepairStep.create({
      repair_order_id: order2.id,
      step_order: i + 1,
      label: defaultSteps[i],
      is_done: true,
      completed_date: order2Dates[i],
    });
  }

  // ─── Bookings ────────────────────────────────────────────
  await Booking.bulkCreate([
    {
      name: 'Lê Văn C',
      phone: '0933456789',
      email: 'levanc@gmail.com',
      service: 'Sửa chữa PC / Laptop',
      booking_date: '2026-03-18',
      booking_time: '09:00',
      address: '55, Cách Mạng, Phường Bạc Liêu, Tỉnh Cà Mau',
      message: 'Laptop bị treo liên tục, cần kiểm tra.',
      status: 'confirmed',
    },
  ]);

  // ─── Admin User ──────────────────────────────────────────
  const existingAdmin = await User.findOne({ where: { email: 'admin@cuahang118.vn' } });
  if (!existingAdmin) {
    await User.create({
      full_name: 'Admin Cửa Hàng 118',
      email: 'admin@cuahang118.vn',
      phone: '0704818118',
      password_hash: 'admin123',
      role: 'admin',
    });
    console.log('👤 Tài khoản admin đã tạo: admin@cuahang118.vn / admin123');
  }

  // ─── Technician User ────────────────────────────────────
  const existingTech = await User.findOne({ where: { email: 'technician@cuahang118.vn' } });
  if (!existingTech) {
    await User.create({
      full_name: 'Kỹ thuật viên Minh',
      email: 'technician@cuahang118.vn',
      phone: '0901234567',
      password_hash: 'tech123',
      role: 'technician',
    });
    console.log('👤 Tài khoản technician đã tạo: technician@cuahang118.vn / tech123');
  }

  console.log('✅ Seed dữ liệu mẫu hoàn tất!');
}

module.exports = seedDatabase;
