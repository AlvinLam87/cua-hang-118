/**
 * Tiện ích tính trạng thái bảo hành cho đơn sửa chữa.
 */

function getEffectiveWarrantyExpiry(order) {
  if (!order) return null;
  if (order.warranty_expiry) return order.warranty_expiry;

  const period = Number(order.warranty_period) || 0;
  if (period <= 0 || !order.completed_date) return null;

  const base = new Date(order.completed_date);
  if (Number.isNaN(base.getTime())) return null;

  base.setMonth(base.getMonth() + period);
  return base.toISOString().slice(0, 10);
}

function isWarrantyActive(order, now = new Date()) {
  if (!order) return false;
  if (!['completed', 'returned'].includes(order.status)) return false;

  const expiry = getEffectiveWarrantyExpiry(order);
  if (!expiry) return false;

  const expDate = new Date(`${expiry}T23:59:59`);
  return !Number.isNaN(expDate.getTime()) && expDate > now;
}

function enrichRepairWarrantyFields(order) {
  const json = typeof order.toJSON === 'function' ? order.toJSON() : { ...order };
  json.warranty_expiry_effective = getEffectiveWarrantyExpiry(json);
  json.warranty_active = isWarrantyActive(json);
  json.can_receive_warranty = json.warranty_active && !json.device_name?.startsWith('[Bảo Hành]');
  return json;
}

module.exports = {
  getEffectiveWarrantyExpiry,
  isWarrantyActive,
  enrichRepairWarrantyFields,
};
