require('dotenv').config();
const { Category } = require('./src/models');

const slugifySimple = (text) => {
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

async function fixAllCategories() {
  try {
    const categoriesToFix = [
      {
        parentSlug: 'pc',
        subs: [
          { name: 'Laptop Gaming', icon: 'Gamepad' },
          { name: 'Laptop Văn Phòng', icon: 'Briefcase' },
          { name: 'PC Gaming', icon: 'Monitor' },
          { name: 'PC Văn Phòng', icon: 'MonitorPlay' }
        ]
      },
      {
        parentSlug: 'office',
        subs: [
          { name: 'Máy in', icon: 'Printer' },
          { name: 'Máy Scan', icon: 'FileSearch' },
          { name: 'Máy Photo', icon: 'Copy' }
        ]
      },
      {
        parentSlug: 'phu-kien',
        subs: [
          { name: 'Bàn phím (Keyboard)', icon: 'Keyboard' },
          { name: 'Chuột (Mouse)', icon: 'MousePointer2' },
          { name: 'Tai nghe (Headset)', icon: 'Headphones' },
          { name: 'Loa (Speaker)', icon: 'Speaker' }
        ]
      },
      {
        parentSlug: 'camera-sp',
        subs: [
          { name: 'Camera Wifi', icon: 'Wifi' },
          { name: 'Camera Đầu ghi', icon: 'HardDrive' },
          { name: 'Thẻ nhớ', icon: 'SdCard' }
        ]
      }
    ];

    for (const group of categoriesToFix) {
      console.log(`🔍 Finding parent: ${group.parentSlug}...`);
      const parent = await Category.findOne({ where: { slug: group.parentSlug } });
      
      if (parent) {
        console.log(`✅ Found parent with ID: ${parent.id}. Adding ${group.subs.length} subs...`);
        for (const sub of group.subs) {
          const slug = slugifySimple(sub.name);
          const existing = await Category.findOne({ where: { slug, parent_id: parent.id } });
          if (!existing) {
            await Category.create({
              name: sub.name,
              slug,
              type: parent.type,
              parent_id: parent.id,
              icon: sub.icon
            });
            console.log(`   + Created: ${sub.name}`);
          } else {
            console.log(`   ~ Skipped: ${sub.name} (exists)`);
          }
        }
      } else {
        console.log(`❌ Parent not found: ${group.parentSlug}`);
      }
    }
    
    console.log('🚀 All categories fixed!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    process.exit();
  }
}

fixAllCategories();
