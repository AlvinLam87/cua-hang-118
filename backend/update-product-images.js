require('dotenv').config();
const { Product } = require('./src/models');

const imageMap = {
  // Laptop MSI Gaming Thin 15
  51: 'https://storage-asset.msi.com/global/picture/image/feature/nb/Thin-15-B1X/kv-thin15.png',
  // Laptop ASUS Vivobook 14
  52: 'https://dlcdnwebimgs.asus.com/gain/5062E36C-E498-4C6E-A1D3-51A2D7A3D7E3/w1000/h732',
  // Máy in Laser Brother HL-L2321D
  53: 'https://download.brother.com/welcome/dlimg/HLL2321D_main.png',
  // CPU AMD Ryzen 7 5700X
  54: 'https://m.media-amazon.com/images/I/51f2hkGMHgL._AC_SL1200_.jpg',
  // Mainboard MSI B650M Gaming Wifi DDR5
  55: 'https://asset.msi.com/resize/image/global/product/product_1_20230523153944_647ad5d0d27d2.png62405b38c58fe0f07fcef2367d8a9ba1/1024.png',
  // CPU AMD Ryzen 5 7500F
  56: 'https://m.media-amazon.com/images/I/51GSXBWJ6gL._AC_SL1200_.jpg',
  // RAM Laptop Kingston 8GB
  57: 'https://m.media-amazon.com/images/I/41sGwRhbFcL._AC_SL1200_.jpg',
  // SSD Kingston NV3 1TB
  58: 'https://media.kingston.com/kingston/product/ktc-product-ssd-snv3s-702x702_SNV3S-1000G-snv3s.png',
  // VGA MSI RTX 3060 VENTUS 2X
  59: 'https://asset.msi.com/resize/image/global/product/product_1_20210119114231_600671e7e8e45.png62405b38c58fe0f07fcef2367d8a9ba1/1024.png',
  // Tản nhiệt Xigmatek EPIX II
  60: 'https://xigmatek.com/upload/product/EPIX%20II/gallery/EPIX%20II%20-%20(1).jpg',
  // Nguồn Xigmatek X-Power III 550
  61: 'https://xigmatek.com/upload/product/X-POWER%20III/gallery/X-Power%20III%20-%20(1).jpg',
  // Case Xigmatek MYX 3F
  62: 'https://xigmatek.com/upload/product/MYX%203F%20BLACK/gallery/MYX%203F%20BLACK%20-%20(1).jpg',
  // Chuột Logitech Pro X Superlight 2
  63: 'https://resource.logitechg.com/w_692,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x2-superlight/gallery/pro-x2-superlight-gallery-1-black.png',
  // Bàn phím Logitech MX Keys Mini
  64: 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-mini/gallery/mx-keys-mini-top-pale-gray-us.png',
  // Phần mềm Microsoft Office 365
  65: 'https://m.media-amazon.com/images/I/71E7uBjjYDL._AC_SL1500_.jpg',
  // Camera Ezviz H7C
  66: 'https://m.media-amazon.com/images/I/41HFFuRiSTL._AC_SL1200_.jpg',
  // Camera 3MP
  67: 'https://m.media-amazon.com/images/I/31IuWiTJDtL._AC_SL1200_.jpg',
  // Camera Imou IPC-A32EP
  68: 'https://m.media-amazon.com/images/I/31yOGJsP1nL._AC_SL1200_.jpg',
};

async function updateImages() {
  try {
    for (const [id, imageUrl] of Object.entries(imageMap)) {
      const product = await Product.findByPk(parseInt(id));
      if (product) {
        await product.update({ image_url: imageUrl });
        console.log(`✅ ID ${id}: ${product.name} → image updated`);
      } else {
        console.log(`⚠️ ID ${id}: product not found`);
      }
    }
    console.log('\n🎉 Tất cả hình ảnh đã được cập nhật!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    process.exit();
  }
}

updateImages();
