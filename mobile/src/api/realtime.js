import { initSocket } from './socket';

const EVENTS = [
  'repair_sync',
  'booking_sync',
  'data_changed',
  'technician_update',
  'new_repair_order',
  'new_booking',
];

let socketRef = null;
const subscribers = new Set();
let bound = false;

const notifyAll = (payload) => {
  subscribers.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.warn('[realtime] subscriber error', e);
    }
  });
};

const bindSocket = () => {
  if (bound) return;
  const socket = initSocket();
  socketRef = socket;

  const handler = (payload) => notifyAll(payload);

  EVENTS.forEach((event) => socket.on(event, handler));
  socket.on('connect', () => notifyAll({ type: 'socket', action: 'connect' }));

  bound = true;
};

/** Đăng ký nhận sự kiện realtime (trả về hàm hủy đăng ký) */
export function subscribeTechnicianRealtime(callback) {
  bindSocket();
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/** Gom nhiều refresh API trong ~300ms */
export function createDebouncedRefresh(fetchFn, delayMs = 300) {
  let timer = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fetchFn();
    }, delayMs);
  };
}

export function isRepairEvent(payload) {
  if (!payload) return false;
  if (payload.type === 'repair_order') return true;
  if (payload.repair_id != null || payload.receipt_code) return true;
  return payload.type === 'socket' && payload.action === 'connect';
}

export function isBookingEvent(payload) {
  if (!payload) return false;
  return payload.type === 'booking' || payload.type === 'booking_sync';
}

export function getRepairId(payload) {
  const id = payload?.repair_id ?? payload?.id;
  return id != null ? Number(id) : null;
}
