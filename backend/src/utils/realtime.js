/**
 * Phát sự kiện realtime thống nhất — admin & KTV cùng lắng nghe `repair_sync`.
 */
function emitRepairSync(io, payload = {}) {
  if (!io) return;

  const repairId = Number(payload.repair_id ?? payload.id ?? 0) || null;
  const data = {
    type: 'repair_order',
    repair_id: repairId,
    id: repairId,
    status: payload.status ?? null,
    receipt_code: payload.receipt_code ?? null,
    booking_id: payload.booking_id ?? null,
    action: payload.action || 'update',
    source: payload.source || 'system',
    message: payload.message ?? null,
    at: Date.now(),
  };

  io.emit('repair_sync', data);
  io.emit('data_changed', data);
  io.emit('technician_update', data);
}

function emitBookingSync(io, payload = {}) {
  if (!io) return;

  const data = {
    type: 'booking',
    id: payload.id ?? null,
    status: payload.status ?? null,
    action: payload.action || 'update',
    source: payload.source || 'system',
    at: Date.now(),
  };

  io.emit('booking_sync', data);
  io.emit('data_changed', data);
  io.emit('new_booking', data);
}

module.exports = { emitRepairSync, emitBookingSync };
