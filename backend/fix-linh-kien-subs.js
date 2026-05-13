require('dotenv').config();
const { Category } = require('./src/models');

const slugifySimple = (text) => {
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

async function fixCategories() {
  try {
    console.log('🔍 Finding Linh kiện PC...');
    const parent = await Category.findOne({ where: { slug: 'linh-kien' } });
    
    if (!parent) {
      console.log('❌ Could not find parent category "Linh kiện PC" (slug: linh-kien)');
      // Create it if missing
      const newParent = await Category.create({
        name: 'Linh kiện PC',
        slug: 'linh-kien',
        type: 'product',
        icon: 'Cpu'
      });
      console.log('✅ Created parent "Linh kiện PC"');
      await addSubs(newParent.id);
    } else {
      console.log(`✅ Found parent "Linh kiện PC" with ID: ${parent.id}`);
      await addSubs(parent.id);
    }
    
    console.log('🚀 Categories fix completed!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    process.exit();
  }
}

async function addSubs(parentId) {
  const subCats = [
    { name: 'CPU (Bộ vi xử lý)', icon: 'Cpu' },
    { name: 'Mainboard (Bo mạch chủ)', icon: 'CircuitBoard' },
    { name: 'RAM (Bộ nhớ trong)', icon: 'MemoryStick' },
    { name: 'VGA (Card màn hình)', icon: 'Monitor' },
    { name: 'SSD / HDD (Ổ cứng)', icon: 'HardDrive' },
    { name: 'PSU (Nguồn máy tính)', icon: 'Zap' },
    { name: 'Case (Vỏ máy tính)', icon: 'Box' },
    { name: 'Cooling (Tản nhiệt)', icon: 'Wind' }
  ];

  for (const item of subCats) {
    const slug = slugifySimple(item.name);
    try {
      // Check if exists
      const existing = await Category.findOne({ where: { slug, parent_id: parentId } });
      if (existing) {
        console.log(`ℹ️ Sub-category exists: ${item.name}`);
        continue;
      }
      
      await Category.create({
        name: item.name,
        slug,
        type: 'product',
        parent_id: parentId,
        icon: item.icon
      });
      console.log(`✅ Created sub-category: ${item.name}`);
    } catch (err) {
      console.log(`⚠️ Error creating ${item.name}:`, err.message);
    }
  }
}

fixCategories();
