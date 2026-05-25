import { API_V1_URL } from './api.js';

/** POST /orders/:id/claim-bank-transfer — báo đã CK (auto paid nếu server bật env). */
export async function claimBankTransfer(orderId, guestPhone) {
  const res = await fetch(`${API_V1_URL}/orders/${orderId}/claim-bank-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guest_phone: guestPhone }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success, data, status: res.status };
}
