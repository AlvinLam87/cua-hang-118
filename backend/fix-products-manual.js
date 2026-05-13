require('dotenv').config();
const { Product } = require('./src/models');

async function fixSpecificProducts() {
  try {
    // Fix Laptop MSI (ID 51) which was miscategorized as VGA
    const laptopMSI = await Product.findByPk(51);
    if (laptopMSI) {
      await laptopMSI.update({ category_id: 1 });
      console.log('✅ Fixed Laptop MSI (ID 51) back to Laptop category.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

fixSpecificProducts();
