require('dotenv').config();
const { Category } = require('./src/models');

const slugifySimple = (text) => {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');         // Replace multiple - with single -
};

async function addSubCategories() {
  const parentId = 20; // Linh kiện PC
  const subCats = [
    'CPU',
    'Mainboard',
    'RAM',
    'Ổ cứng',
    'Nguồn',
    'VGA',
    'Tản nhiệt',
    'Case'
  ];

  for (const name of subCats) {
    const slug = slugifySimple(name);
    try {
      await Category.create({
        name,
        slug,
        type: 'product',
        parent_id: parentId,
        icon: 'Cpu' // Default icon
      });
      console.log(`Created: ${name}`);
    } catch (err) {
      console.log(`Skipped (maybe exists): ${name}`);
    }
  }
  process.exit();
}

addSubCategories();
