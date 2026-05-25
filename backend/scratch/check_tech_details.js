async function main() {
  try {
    const chunkUrl = 'https://www.cuahang118.online/assets/TechnicianDashboardPage-Bzu1k809.js';
    console.log(`Fetching chunk from: ${chunkUrl}`);
    const res = await fetch(chunkUrl);
    const js = await res.text();
    
    // Check if it contains the customized warranty texts we just implemented
    const containsWarrantyDiagnosis = js.includes('warranty_diagnosis');
    const containsLoaiDon = js.includes('Loại đơn: Tiếp nhận bảo hành');
    const containsMienPhi = js.includes('Miễn phí (Bảo hành)');
    
    console.log('Contains warranty_diagnosis?', containsWarrantyDiagnosis);
    console.log('Contains Loại đơn: Tiếp nhận bảo hành?', containsLoaiDon);
    console.log('Contains Miễn phí (Bảo hành)?', containsMienPhi);

    if (containsWarrantyDiagnosis && containsLoaiDon && containsMienPhi) {
      console.log('🎉 The live production site HAS the absolute latest customized code!');
    } else {
      console.log('❌ The live production site DOES NOT have the absolute latest customized code. It is running an older build!');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
