require('dotenv').config();
const { Service, RepairOrder } = require('./src/models');

async function fixExistingWarranties() {
  try {
    console.log('🔄 Bắt đầu quét các đơn sửa chữa cũ để sửa thời gian bảo hành...');

    // Tìm tất cả các đơn sửa chữa chưa được gán thời gian bảo hành (bằng 0 hoặc null)
    const repairOrders = await RepairOrder.findAll();
    console.log(`📋 Tìm thấy tổng cộng ${repairOrders.length} đơn sửa chữa trong cơ sở dữ liệu.`);

    let updatedCount = 0;

    for (const order of repairOrders) {
      // Tìm dịch vụ khớp với tên thiết bị/tên dịch vụ ban đầu
      const service = await Service.findOne({
        where: { name: order.device_name }
      });

      if (service) {
        console.log(`🔍 Khớp đơn #${order.receipt_code} (${order.device_name}) -> Dịch vụ: ${service.name} (BH: ${service.warranty_period} tháng)`);
        
        const period = service.warranty_period || 0;
        const updatePayload = {
          warranty_period: period
        };

        // Nếu đơn hàng đã hoàn thành hoặc bàn giao, tự động tính toán ngày hết hạn bảo hành
        if (['completed', 'returned'].includes(order.status) && period > 0) {
          const baseDate = order.completed_date || order.updated_at || new Date();
          const startDate = new Date(baseDate);
          startDate.setMonth(startDate.getMonth() + period);
          
          updatePayload.warranty_expiry = startDate.toISOString().slice(0, 10);
          
          console.log(`   └─ Đã hoàn thành. Tính ngày hết hạn bảo hành: ${updatePayload.warranty_expiry}`);
        }

        // Tự động gán điều khoản bảo hành mặc định nếu chưa có
        if (!order.warranty_terms) {
          updatePayload.warranty_terms = service.has_warranty 
            ? `Bảo hành dịch vụ ${service.name} trong thời hạn ${period} tháng.`
            : 'Không bảo hành.';
        }

        await order.update(updatePayload);
        updatedCount++;
      } else {
        console.log(`⚠️ Không tìm thấy dịch vụ tương thích cho đơn #${order.receipt_code} (${order.device_name})`);
      }
    }

    console.log(`\n🎉 Hoàn tất! Đã cập nhật thành công ${updatedCount} đơn sửa chữa.`);
  } catch (err) {
    console.error('❌ Lỗi khi thực hiện fix:', err.message);
  } finally {
    process.exit();
  }
}

fixExistingWarranties();
