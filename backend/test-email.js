require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: 'alvin.lamdien@gmail.com',
    pass: 'mmnsrtlmztdwitky'
  },
});

async function testMail() {
  console.log('🚀 Đang bắt đầu gửi thử email...');
  try {
    const info = await transporter.sendMail({
      from: '"Test Server" <alvin.lamdien@gmail.com>',
      to: 'alvin.lamdien@gmail.com',
      subject: 'Test kết nối Email Server',
      text: 'Nếu bạn nhận được mail này, cấu hình SMTP của bạn đã hoạt động tốt!',
      html: '<b>Nếu bạn nhận được mail này, cấu hình SMTP của bạn đã hoạt động tốt!</b>',
    });
    console.log('✅ Gửi mail THÀNH CÔNG! Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Gửi mail THẤT BẠI!');
    console.error('Lý do:', error.message);
    if (error.message.includes('Invalid login')) {
      console.log('👉 Gợi ý: App Password bị sai hoặc đã bị Google thu hồi.');
    }
  }
}

testMail();
