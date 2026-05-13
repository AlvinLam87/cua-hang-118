require('dotenv').config();
const { sequelize, Product, StockMovement } = require('./src/models');

async function testStockIn() {
  const t = await sequelize.transaction();
  try {
    const product_id = 13;
    const quantity = 10;
    
    const product = await Product.findByPk(product_id);
    console.log(`Before: Warehouse: ${product.warehouse_quantity}, Stock: ${product.stock_quantity}`);

    // 1. Create movement
    await StockMovement.create({
      product_id,
      type: 'IN',
      quantity,
      reason: 'Nhập hàng bổ sung (Demo)',
      notes: 'Thực hiện bởi AI'
    }, { transaction: t });

    // 2. Update product
    await product.update({
      warehouse_quantity: (product.warehouse_quantity || 0) + quantity
    }, { transaction: t });

    await t.commit();
    
    const updated = await Product.findByPk(product_id);
    console.log(`After: Warehouse: ${updated.warehouse_quantity}, Stock: ${updated.stock_quantity}`);
    console.log('SUCCESS: Stock-in complete.');
  } catch (err) {
    await t.rollback();
    console.error('FAILED:', err.message);
  } finally {
    process.exit();
  }
}

testStockIn();
