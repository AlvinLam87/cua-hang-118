const { Resend } = require('resend');

// Khởi tạo Resend với API Key
// Ưu tiên lấy từ biến môi trường RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY || 're_Y4UdLnMJ_3imAtF3fgjzZJZJMabaWZSyx');

const sendEmail = async ({ to, subject, html }) => {
  console.log(`📨 [Resend] Đang gửi mail tới: ${to}...`);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Cửa Hàng 118 <noreply@send.cuahang118.online>', 
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ [Resend Error]:', error.message);
      return false;
    }

    console.log('✅ [Resend] Gửi mail thành công! ID:', data.id);
    return true;
  } catch (err) {
    console.error('❌ [Resend Exception]:', err.message);
    return false;
  }
};

module.exports = {
  sendEmail,
};
