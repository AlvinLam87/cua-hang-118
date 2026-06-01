/** Helpers đồng bộ realtime cho trang admin (socket hub ở AdminLayout). */

export function getRepairId(payload) {
  const id = payload?.repair_id ?? payload?.id;
  return id != null ? Number(id) : null;
}

export function patchRepairInList(setter, payload) {
  if (!payload?.status) return;
  const repairId = getRepairId(payload);
  if (!repairId) return;
  setter((prev) =>
    prev.map((o) => (o.id === repairId ? { ...o, status: payload.status } : o))
  );
}

export function patchBookingInList(setter, payload) {
  if (!payload?.status || payload.id == null) return;
  const bookingId = Number(payload.id);
  setter((prev) =>
    prev.map((b) => (b.id === bookingId ? { ...b, status: payload.status } : b))
  );
}
