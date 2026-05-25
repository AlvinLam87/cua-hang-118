/** Trạng thái đồng bộ với admin panel */

export const REPAIR_STATUS_MAP = {
  received:    { label: 'Tiếp nhận',    bg: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' },
  diagnosing:  { label: 'Chẩn đoán',    bg: '#FFF7ED', color: '#EA580C', borderColor: '#FED7AA' },
  quoted:      { label: 'Đã báo giá',   bg: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' },
  in_progress: { label: 'Đang sửa',     bg: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' },
  testing:     { label: 'Kiểm tra',     bg: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' },
  completed:   { label: 'Hoàn thành',   bg: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' },
  returned:    { label: 'Đã bàn giao',  bg: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' },
  cancelled:   { label: 'Đã hủy',       bg: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' },
};

export const BOOKING_STATUS_MAP = {
  pending:   { label: 'Chờ xác nhận', bg: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' },
  confirmed: { label: 'Đã xác nhận',  bg: '#ECFDF5', borderColor: '#A7F3D0', color: '#059669' },
  completed: { label: 'Hoàn thành',   bg: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' },
  cancelled: { label: 'Đã hủy',       bg: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' },
};

export const isTerminalRepairStatus = (status) =>
  ['completed', 'returned', 'cancelled'].includes(status);

export const isActiveBookingStatus = (status) =>
  ['pending', 'confirmed'].includes(status);

export const getRepairStatusInfo = (status) =>
  REPAIR_STATUS_MAP[status] || REPAIR_STATUS_MAP.received;

export const getBookingStatusInfo = (status) =>
  BOOKING_STATUS_MAP[status] || BOOKING_STATUS_MAP.pending;
