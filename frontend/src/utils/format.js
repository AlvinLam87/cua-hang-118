/**
 * Định dạng ngày từ YYYY-MM-DD hoặc ISO string sang DD/MM/YYYY
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    // Nếu là chuỗi YYYY-MM-DD
    if (typeof date === 'string' && date.includes('-') && !date.includes('T')) {
      const [y, m, d] = date.split('-');
      return `${d}/${m}/${y}`;
    }
    
    // Nếu là Date object hoặc ISO string
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Trả về gốc nếu ko parse được
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return date;
  }
};

/**
 * Định dạng tiền tệ VNĐ
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
};

/**
 * Định dạng ngày giờ DD/MM/YYYY HH:mm
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return date;
  }
};
