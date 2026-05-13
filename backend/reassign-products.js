require('dotenv').config();
const { Product, Category } = require('./src/models');

async function reassignProducts() {
  try {
    console.log('🔄 Reassigning products to correct subcategories...');
    
    const mapping = [
      { keywords: ['CPU', 'vi xử lý'], subSlug: 'cpu-bo-vi-xu-ly' },
      { keywords: ['Mainboard', 'Bo mạch chủ'], subSlug: 'mainboard-bo-mach-chu' },
      { keywords: ['RAM', 'Bộ nhớ'], subSlug: 'ram-bo-nho-trong' },
      { keywords: ['VGA', 'Card màn hình', 'RTX', 'GTX', 'RX '], subSlug: 'vga-card-man-hinh' },
      { keywords: ['SSD', 'HDD', 'Ổ cứng'], subSlug: 'ssd-hdd-o-cung' },
      { keywords: ['Nguồn', 'PSU'], subSlug: 'psu-nguon-may-tinh' },
      { keywords: ['Case', 'Vỏ máy tính'], subSlug: 'case-vo-may-tinh' },
      { keywords: ['Tản nhiệt', 'Cooling'], subSlug: 'cooling-tan-nhiet' }
    ];

    const products = await Product.findAll();
    
    for (const product of products) {
      // Only process products that are currently in 'Linh kiện PC' (ID 4) 
      // or have these keywords but are not in a subcategory yet.
      // But based on the list, almost all PC parts are in ID 4.
      
      let targetCategoryId = null;
      for (const map of mapping) {
        if (map.keywords.some(kw => product.name.toLowerCase().includes(kw.toLowerCase()))) {
          const subCat = await Category.findOne({ where: { slug: map.subSlug } });
          if (subCat) {
            targetCategoryId = subCat.id;
            break;
          }
        }
      }

      if (targetCategoryId && targetCategoryId !== product.category_id) {
        await product.update({ category_id: targetCategoryId });
        console.log(`✅ Moved "${product.name}" to category ID: ${targetCategoryId}`);
      }
    }

    console.log('🚀 Products reassignment completed!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    process.exit();
  }
}

reassignProducts();
