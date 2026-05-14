const nodemailer = require('nodemailer');

let transporterInstance = null;

const createTransporter = () => {
  if (transporterInstance) return transporterInstance;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP variables missing in .env. Emails will not be sent.');
    return null;
  }
  
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  console.log(`🔌 [Mailer] Khởi tạo kết nối: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${port} (Secure: ${isSecure})`);

  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure, 
    pool: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : '',
    },
    tls: { rejectUnauthorized: false }
  });

  return transporterInstance;
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Cửa Hàng 118'}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [Mailer Error]:', error.message);
    if (error.code === 'EAUTH') console.error('👉 Lỗi: Sai Email hoặc App Password.');
    if (error.code === 'ETIMEDOUT') console.error('👉 Lỗi: Kết nối bị quá hạn (Timeout).');
    return false;
  }
};

module.exports = {
  sendEmail,
};
