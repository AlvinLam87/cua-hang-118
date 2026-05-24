require('dotenv').config();
const { Category, Service } = require('./src/models');

async function seedServices() {
  try {
    // ═══ 1. Tạo 3 danh mục dịch vụ (slug khác để tránh trùng) ═══
    const categories = [
      { name: 'Máy Tính & Laptop', slug: 'svc-pc', type: 'service', icon: 'MonitorPlay' },
      { name: 'Thiết Bị Văn Phòng', slug: 'svc-office', type: 'service', icon: 'Printer' },
      { name: 'Sửa Chữa Tận Nhà', slug: 'svc-home', type: 'service', icon: 'Wrench' },
    ];

    const catMap = {};
    for (const cat of categories) {
      const [record] = await Category.findOrCreate({
        where: { slug: cat.slug, type: 'service' },
        defaults: cat,
      });
      catMap[cat.slug] = record.id;
      console.log(`📁 Danh mục: ${record.name} (ID: ${record.id})`);
    }

    // ═══ 2. Tạo dịch vụ sửa chữa ═══
    const services = [
      // ── Máy Tính & Laptop ──
      { category_id: catMap['svc-pc'], name: 'Cài đặt Windows (10/11)', description: 'Cài lại hệ điều hành Windows bản quyền, driver đầy đủ, phần mềm cơ bản.', price: 200000, price_label: '200.000đ', icon: 'Monitor', has_warranty: true, warranty_period: 3 },
      { category_id: catMap['svc-pc'], name: 'Vệ sinh Laptop toàn bộ', description: 'Tháo máy, vệ sinh quạt tản nhiệt, thay keo tản nhiệt, lau bụi bên trong.', price: 150000, price_label: '150.000đ', icon: 'Wrench', has_warranty: true, warranty_period: 3 },
      { category_id: catMap['svc-pc'], name: 'Thay bàn phím Laptop', description: 'Thay bàn phím chính hãng theo model, bảo hành 6 tháng.', price: 350000, price_label: 'Từ 350.000đ', icon: 'Cpu', has_warranty: true, warranty_period: 6 },
      { category_id: catMap['svc-pc'], name: 'Thay màn hình Laptop', description: 'Thay màn hình LCD/LED theo đúng model máy, hàng chính hãng.', price: 1500000, price_label: 'Từ 1.500.000đ', icon: 'MonitorPlay', has_warranty: true, warranty_period: 12 },
      { category_id: catMap['svc-pc'], name: 'Nâng cấp RAM / SSD', description: 'Nâng cấp RAM, thay ổ cứng SSD tốc độ cao cho Laptop và PC.', price: 100000, price_label: 'Từ 100.000đ (chưa bao gồm linh kiện)', icon: 'HardDrive', has_warranty: true, warranty_period: 12 },
      { category_id: catMap['svc-pc'], name: 'Sửa lỗi phần mềm / Virus', description: 'Gỡ virus, malware, sửa lỗi hệ thống, khôi phục dữ liệu.', price: 150000, price_label: '150.000đ', icon: 'ShieldCheck', has_warranty: false, warranty_period: 0 },
      { category_id: catMap['svc-pc'], name: 'Thay pin Laptop', description: 'Thay pin laptop chính hãng hoặc tương thích, bảo hành 6 tháng.', price: 500000, price_label: 'Từ 500.000đ', icon: 'Cpu', has_warranty: true, warranty_period: 6 },
      { category_id: catMap['svc-pc'], name: 'Sửa Mainboard Laptop / PC', description: 'Chẩn đoán và sửa lỗi mainboard: không lên nguồn, hư chip, lỗi VGA onboard.', price: 500000, price_label: 'Từ 500.000đ', icon: 'Cpu', has_warranty: true, warranty_period: 6 },
      { category_id: catMap['svc-pc'], name: 'Lắp ráp PC theo yêu cầu', description: 'Tư vấn cấu hình, lắp ráp PC gaming, đồ họa, văn phòng theo ngân sách.', price: 200000, price_label: '200.000đ (phí lắp ráp)', icon: 'Monitor', has_warranty: true, warranty_period: 12 },

      // ── Thiết Bị Văn Phòng ──
      { category_id: catMap['svc-office'], name: 'Sửa máy in Laser / Phun', description: 'Khắc phục lỗi kẹt giấy, không in được, in mờ, lỗi kết nối.', price: 200000, price_label: 'Từ 200.000đ', icon: 'Printer', has_warranty: true, warranty_period: 3 },
      { category_id: catMap['svc-office'], name: 'Đổ mực máy in', description: 'Đổ mực máy in Laser, thay mực máy in phun, bảo trì drum.', price: 80000, price_label: 'Từ 80.000đ', icon: 'Printer', has_warranty: false, warranty_period: 0 },
      { category_id: catMap['svc-office'], name: 'Cài đặt mạng nội bộ (LAN)', description: 'Thi công mạng LAN văn phòng, kéo dây, bấm hạt mạng, cấu hình switch.', price: 500000, price_label: 'Từ 500.000đ', icon: 'Wifi', has_warranty: true, warranty_period: 6 },
      { category_id: catMap['svc-office'], name: 'Cài đặt WiFi & Router', description: 'Cấu hình Router, mở rộng WiFi, thiết lập mạng gia đình/doanh nghiệp.', price: 150000, price_label: '150.000đ', icon: 'Wifi', has_warranty: false, warranty_period: 0 },
      { category_id: catMap['svc-office'], name: 'Cài đặt Camera an ninh', description: 'Lắp đặt, cấu hình camera IP, hệ thống giám sát từ xa qua điện thoại.', price: 300000, price_label: 'Từ 300.000đ (phí lắp đặt)', icon: 'Camera', has_warranty: true, warranty_period: 12 },
      { category_id: catMap['svc-office'], name: 'Bảo trì hệ thống IT định kỳ', description: 'Gói bảo trì định kỳ cho doanh nghiệp: kiểm tra, vệ sinh, cập nhật, sao lưu.', price: 1000000, price_label: 'Từ 1.000.000đ/tháng', icon: 'ShieldCheck', has_warranty: true, warranty_period: 12 },

      // ── Sửa Chữa Tận Nhà ──
      { category_id: catMap['svc-home'], name: 'Sửa máy tính tại nhà', description: 'Kỹ thuật viên đến tận nơi chẩn đoán và sửa chữa máy tính bàn, laptop.', price: 100000, price_label: 'Từ 100.000đ (phí di chuyển)', icon: 'Wrench', has_warranty: true, warranty_period: 3 },
      { category_id: catMap['svc-home'], name: 'Cài đặt Windows tại nhà', description: 'Cài lại Windows, driver, phần mềm ngay tại nhà/văn phòng khách hàng.', price: 300000, price_label: '300.000đ', icon: 'Monitor', has_warranty: true, warranty_period: 3 },
      { category_id: catMap['svc-home'], name: 'Sửa mạng Internet tại nhà', description: 'Kiểm tra, khắc phục sự cố mạng, cấu hình lại Router/Modem tại nhà.', price: 150000, price_label: '150.000đ', icon: 'Wifi', has_warranty: false, warranty_period: 0 },
      { category_id: catMap['svc-home'], name: 'Lắp đặt Camera tại nhà', description: 'Thi công lắp đặt camera an ninh cho gia đình, cấu hình xem từ xa.', price: 200000, price_label: 'Từ 200.000đ (phí lắp đặt)', icon: 'Camera', has_warranty: true, warranty_period: 12 },
      { category_id: catMap['svc-home'], name: 'Cứu dữ liệu khẩn cấp', description: 'Khôi phục dữ liệu từ ổ cứng hỏng, USB, thẻ nhớ. Hỗ trợ nhanh tại nhà.', price: 500000, price_label: 'Từ 500.000đ', icon: 'HardDrive', has_warranty: false, warranty_period: 0 },
      { category_id: catMap['svc-home'], name: 'Nâng cấp phần cứng tại nhà', description: 'Thay RAM, SSD, vệ sinh máy tại nhà/văn phòng không cần mang máy đi.', price: 100000, price_label: 'Từ 100.000đ (chưa bao gồm linh kiện)', icon: 'Cpu', has_warranty: true, warranty_period: 12 },
    ];

    let count = 0;
    for (const svc of services) {
      await Service.create(svc);
      count++;
      console.log(`  ✅ ${svc.name}`);
    }

    console.log(`\n🎉 Hoàn tất! Đã tạo ${Object.keys(catMap).length} danh mục và ${count} dịch vụ.`);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    process.exit();
  }
}

seedServices();
