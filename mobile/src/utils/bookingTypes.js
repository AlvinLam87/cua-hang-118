/** Lịch hẹn / liên hệ từ trang Camera hoặc dịch vụ lắp camera — không phải đơn sửa chữa. */
export function isCameraJob(service) {
  const s = String(service || '').toLowerCase();
  return s.startsWith('camera') || s.includes('camera an ninh') || s.includes('lắp đặt camera');
}

export function getJobKind(service) {
  return isCameraJob(service) ? 'camera' : 'repair';
}
