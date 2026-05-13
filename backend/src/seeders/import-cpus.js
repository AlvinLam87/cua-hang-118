const sequelize = require('../config/database');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

async function importCPUs() {
  try {
    // 1. Define Products
    const productsToImport = [
      {
        name: 'CPU AMD Ryzen 7 5700X (Tray)',
        category_id: 23,
        price: 5490000,
        original_price: 6500000,
        image_url: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/p/cpu-amd-ryzen-7-5700x-tray-1.png',
        description: 'Kiến trúc TSMC 7nm FinFET tiên tiến, 8 nhân 16 luồng, Socket AM4, xung nhịp tối đa 4.6GHz, TDP 65W.',
        warehouse_quantity: 10,
        stock_quantity: 0, // Keep 0 on web until published from warehouse
        in_stock: true,
        is_active: true
      },
      {
        name: 'CPU AMD Ryzen 5 7500F (Tray)',
        category_id: 23,
        price: 3990000,
        original_price: 4800000,
        image_url: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/p/cpu-amd-ryzen-5-7500f-tray.png',
        description: 'AMD Ryzen thế hệ thứ 7, 6 nhân 12 luồng, Socket AM5, xung nhịp tối đa 5.0GHz, tối ưu cho hiệu suất chơi game.',
        warehouse_quantity: 10,
        stock_quantity: 0,
        in_stock: true,
        is_active: true
      }
    ];

    for (const pData of productsToImport) {
      // Check if exists
      const existing = await Product.findOne({ where: { name: pData.name } });
      if (existing) {
        console.log(`Product ${pData.name} already exists. Skipping.`);
        continue;
      }

      // Create Product
      const product = await Product.create(pData);
      console.log(`Created product: ${product.name} (ID: ${product.id})`);

      // Create Stock Movement
      await StockMovement.create({
        product_id: product.id,
        type: 'IN',
        quantity: 10,
        price: pData.price * 0.9, // Estimate cost price
        reason: 'Nhập hàng từ CellphoneS (Scraped)',
        notes: 'Dữ liệu được lấy tự động từ cellphones.com.vn'
      });
      console.log(`Logged stock-in movement for ${product.name}`);
    }

    console.log('Import completed successfully.');
  } catch (err) {
    console.error('Error importing products:', err);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

importCPUs();
