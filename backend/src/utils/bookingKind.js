function isCameraBookingService(service) {
  const s = String(service || '').toLowerCase();
  return s.startsWith('camera') || s.includes('camera an ninh') || s.includes('lắp đặt camera');
}

module.exports = { isCameraBookingService };
