async function main() {
  try {
    const chunkUrl = 'https://www.cuahang118.online/assets/TechnicianDashboardPage-Bzu1k809.js';
    console.log(`Fetching chunk from: ${chunkUrl}`);
    const res = await fetch(chunkUrl);
    const js = await res.text();
    console.log('Chunk JS Length:', js.length);
    
    const containsWarranty = js.includes('warranty') || js.includes('repairs/warranty') || js.includes('Tiếp nhận BH');
    console.log('Contains warranty/reception code?', containsWarranty);
    
    if (containsWarranty) {
      console.log('🎉 The live production chunk DOES contain the new warranty code!');
    } else {
      console.log('❌ The live production chunk DOES NOT contain the new warranty code.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
