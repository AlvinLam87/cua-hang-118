import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getRepairStatusInfo,
  getBookingStatusInfo,
  isTerminalRepairStatus,
  isActiveBookingStatus,
} from '../constants/statusMaps';

const READ_IDS_KEY = 'notificationReadIds';

export async function getReadNotificationIds() {
  try {
    const raw = await AsyncStorage.getItem(READ_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export async function markAllNotificationsRead(notifications) {
  const ids = notifications.map((n) => n.id);
  await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify(ids));
  return ids.length;
}

export async function markNotificationRead(id) {
  const read = await getReadNotificationIds();
  read.add(id);
  await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...read]));
}

export function countUnreadNotifications(notifications) {
  return notifications.filter((n) => n.unread).length;
}

function parseTimestamp(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getRepairTimestamp(repair) {
  return (
    parseTimestamp(repair.updated_at) ||
    parseTimestamp(repair.created_at) ||
    parseTimestamp(repair.received_date) ||
    new Date(0)
  );
}

function getBookingTimestamp(booking) {
  const base =
    parseTimestamp(booking.updated_at) ||
    parseTimestamp(booking.created_at) ||
    parseTimestamp(booking.booking_date);
  if (!base) return new Date(0);
  if (booking.booking_time) {
    const [h, m] = String(booking.booking_time).split(':').map(Number);
    if (!Number.isNaN(h)) {
      const copy = new Date(base);
      copy.setHours(h, m || 0, 0, 0);
      return copy;
    }
  }
  return base;
}

export function formatRelativeTime(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '—';
  }
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) {
    return `Hôm qua, ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildRepairNotification(repair, readIds) {
  const id = `repair-${repair.id}`;
  const statusInfo = getRepairStatusInfo(repair.status);
  const customerName = repair.customer?.name || 'Khách hàng';
  const at = getRepairTimestamp(repair);

  let type = 'assignment';
  let title = '';
  let description = '';

  if (repair.status === 'cancelled') {
    type = 'info';
    title = `Đơn #${repair.receipt_code} đã hủy`;
    description = `${repair.device_name} — ${customerName}`;
  } else if (['completed', 'returned'].includes(repair.status)) {
    type = 'completed';
    title = `Đơn #${repair.receipt_code} đã hoàn thành`;
    description = `${repair.device_name} — ${customerName}`;
  } else if (repair.status === 'received') {
    type = 'assignment';
    title = `Đơn sửa chữa mới #${repair.receipt_code}`;
    description = `${repair.device_name} — ${customerName}. Trạng thái: ${statusInfo.label}`;
  } else {
    type = 'assignment';
    title = `Đơn #${repair.receipt_code} — ${statusInfo.label}`;
    description = `${repair.device_name} — ${customerName}`;
  }

  const needsAttention = !isTerminalRepairStatus(repair.status);
  const unread = needsAttention && !readIds.has(id);

  return {
    id,
    type,
    title,
    description,
    time: formatRelativeTime(at),
    timestamp: at.getTime(),
    unread,
    refType: 'repair',
    refId: repair.id,
    refData: repair,
  };
}

function buildBookingNotification(booking, readIds) {
  const id = `booking-${booking.id}`;
  const statusInfo = getBookingStatusInfo(booking.status);
  const at = getBookingTimestamp(booking);

  let type = 'booking';
  let title = '';
  let description = `${booking.service || 'Dịch vụ'} — ${booking.phone || ''}`;

  if (booking.status === 'pending') {
    type = 'booking';
    title = `Lịch hẹn mới: ${booking.name}`;
    description = `${booking.service} · ${booking.booking_date || '—'} ${booking.booking_time || ''}`.trim();
  } else if (booking.status === 'confirmed') {
    type = 'assignment';
    title = `Lịch hẹn đã xác nhận — ${booking.name}`;
    description = `${booking.service} · ${booking.booking_date || '—'} ${booking.booking_time || ''}`.trim();
  } else if (booking.status === 'cancelled') {
    type = 'info';
    title = `Lịch hẹn đã hủy — ${booking.name}`;
    description = booking.service || '—';
  } else if (booking.status === 'completed') {
    type = 'completed';
    title = `Lịch hẹn hoàn thành — ${booking.name}`;
    description = booking.service || '—';
  } else {
    title = `Lịch hẹn — ${statusInfo.label}`;
    description = `${booking.name} · ${booking.service || '—'}`;
  }

  const needsAttention = isActiveBookingStatus(booking.status);
  const unread = needsAttention && !readIds.has(id);

  return {
    id,
    type,
    title,
    description,
    time: formatRelativeTime(at),
    timestamp: at.getTime(),
    unread,
    refType: 'booking',
    refId: booking.id,
    refData: booking,
  };
}

export async function buildNotificationsFromTasks(repairs = [], bookings = []) {
  const readIds = await getReadNotificationIds();
  const list = [
    ...repairs.map((r) => buildRepairNotification(r, readIds)),
    ...bookings.map((b) => buildBookingNotification(b, readIds)),
  ];
  list.sort((a, b) => b.timestamp - a.timestamp);
  return list;
}
