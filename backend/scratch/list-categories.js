require('dotenv').config();
const { Category } = require('../src/models');

async function listCategories() {
  try {
    const cats = await Category.findAll({
      order: [['id', 'ASC']]
    });
    console.log(JSON.stringify(cats, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

listCategories();
