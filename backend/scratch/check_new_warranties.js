const { RepairOrder, Customer } = require('../src/models');
const { Op } = require('sequelize');

async function main() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    console.log(`Checking for warranty orders created on or after ${today}...`);
    
    const orders = await RepairOrder.findAll({
      where: {
        device_name: { [Op.like]: '%[Bảo Hành]%' }
      },
      include: [{ model: Customer, as: 'customer' }],
      order: [['id', 'DESC']]
    });
    
    console.log(`Found ${orders.length} warranty orders:`);
    for (const o of orders) {
      console.log(`ID: ${o.id}, Code: ${o.receipt_code}, Status: ${o.status}, CreatedAt: ${o.createdAt}, Device: ${o.device_name}, Customer: ${o.customer?.name}, Phone: ${o.customer?.phone}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
