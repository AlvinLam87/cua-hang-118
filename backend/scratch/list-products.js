require('dotenv').config();
const { Product } = require('../src/models');

async function listProducts() {
  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'category_id']
    });
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

listProducts();
