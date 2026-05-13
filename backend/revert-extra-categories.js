require('dotenv').config();
const { Category } = require('./src/models');
const { Op } = require('sequelize');

async function revertExtraCategories() {
  try {
    console.log('🗑️ Deleting extra subcategories (all except Linh kiện PC)...');
    
    // Parent ID 4 is Linh kiện PC. We want to delete all categories where parent_id is NOT null AND NOT 4.
    const deletedCount = await Category.destroy({
      where: {
        parent_id: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: 4 }
          ]
        }
      }
    });
    
    console.log(`✅ Deleted ${deletedCount} extra subcategories.`);
    console.log('🚀 Revert completed. Only Linh kiện PC subcategories remain.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    process.exit();
  }
}

revertExtraCategories();
