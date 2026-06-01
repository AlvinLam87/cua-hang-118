import React, { useState } from 'react';
import {
  X, Loader2, Wrench, ShieldCheck, ExternalLink, Send, CheckCircle2,
  AlertCircle, User, CalendarDays, ClipboardList,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format.js';
import { API_V1_URL } from '../../utils/api.js';

const repairStatusStyles = {
  received: 'bg-blue-100 text-blue-700 border-blue-200',
  diagnosing: 'bg-orange-100 text-orange-700 border-orange-200',
  quoted: 'bg-purple-100 text-purple-700 border-purple-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  testing: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  returned: 'bg-emerald-200 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const formatMoney = (v) => {
  const n = Number(v);
  if (!n) return '—';
  return `${n.toLocaleString('vi-VN')}đ`;
};

const BookingRepairDetailModal = ({ booking, detail, loading, onClose, onWarrantySuccess }) => {
  const [issue, setIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const repair = detail?.repair_order;
  const isCamera = detail?.job_kind === 'camera';

  const handleWarranty = async () => {
    if (!repair?.id) return;
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/bookings/my-repairs/${repair.id}/warranty`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issue: issue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setIssue('');
        onWarrantySuccess?.();
      } else {
        setMessage({ type: 'error', text: data.message || 'Không thể gửi yêu cầu bảo hành.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const canWarranty =
    repair?.can_receive_warranty &&
    !repair?.open_warranty_order &&
    ['completed', 'returned'].includes(repair?.status);

  const repairFlow = repair?.device_name?.startsWith('[Bảo Hành]')
    ? ['received', 'diagnosing', 'in_progress', 'testing', 'completed']
    : ['received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed'];

  const flowLabels = {
    received: 'Tiếp nhận',
    diagnosing: 'Chẩn đoán',
    quoted: 'Đã báo giá',
    in_progress: 'Đang sửa',
    testing: 'Kiểm tra',
    completed: 'Hoàn thành',
  };

  const currentIdx = repair ? repairFlow.indexOf(repair.status) : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      <div className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Chi tiết dịch vụ</h3>
            <p className="text-xs text-gray-500 mt-0.5">Lịch hẹn #{booking?.id} · {booking?.service}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : isCamera ? (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5 text-sm text-indigo-900">
              <p className="font-bold mb-1">Lịch khảo sát / lắp Camera</p>
              <p className="text-indigo-700/90">
                Loại dịch vụ này không tạo đơn sửa chữa. Kỹ thuật viên sẽ liên hệ theo lịch hẹn. Trạng thái lịch:{' '}
                <strong>{booking?.status}</strong>.
              </p>
            </div>
          ) : !repair ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 text-sm text-amber-900">
              <AlertCircle className="w-5 h-5 mb-2" />
              <p className="font-bold mb-1">Chưa có đơn sửa chữa</p>
              <p className="text-amber-800/90">
                Đơn sửa chữa sẽ được tạo khi cửa hàng xác nhận lịch hẹn. Vui lòng quay lại sau hoặc gọi hotline 0704.818.118.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mã biên nhận</p>
                  <p className="text-xl font-black text-blue-600">{repair.receipt_code}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${repairStatusStyles[repair.status] || repairStatusStyles.received}`}>
                  {repair.status_label || repair.status}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <InfoRow icon={Wrench} label="Thiết bị / dịch vụ" value={repair.device_name} />
                <InfoRow icon={User} label="Kỹ thuật viên" value={repair.technician_name || 'Đang phân công'} />
                <InfoRow icon={CalendarDays} label="Ngày tiếp nhận" value={formatDate(repair.received_date)} />
                <InfoRow icon={CalendarDays} label="Ngày hoàn thành" value={formatDate(repair.completed_date) || '—'} />
              </div>

              {repair.issue && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mô tả lỗi / yêu cầu</p>
                  <p className="text-sm text-gray-800">{repair.issue}</p>
                </div>
              )}

              {repair.diagnosis && (
                <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-4">
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Chẩn đoán</p>
                  <p className="text-sm text-gray-800">{repair.diagnosis}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Chi phí dự kiến</p>
                  <p className="text-lg font-black text-gray-900 mt-1">{formatMoney(repair.estimated_cost)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Chi phí thực tế</p>
                  <p className="text-lg font-black text-emerald-700 mt-1">{formatMoney(repair.final_cost)}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" /> Tiến độ xử lý
                </p>
                <div className="space-y-2">
                  {repairFlow.map((step, idx) => {
                    const done = idx < currentIdx;
                    const current = idx === currentIdx;
                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${
                          current ? 'border-blue-200 bg-blue-50' : done ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-100 bg-white'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${current ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                        )}
                        <span className={`text-sm font-semibold ${current ? 'text-blue-700' : done ? 'text-gray-800' : 'text-gray-400'}`}>
                          {flowLabels[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Bảo hành
                </p>
                <p className="text-sm text-gray-800">
                  Thời hạn:{' '}
                  <strong>
                    {repair.warranty_period > 0 ? `${repair.warranty_period} tháng` : 'Không bảo hành'}
                  </strong>
                  {repair.warranty_expiry_effective || repair.warranty_expiry ? (
                    <>
                      {' '}
                      · Hết hạn:{' '}
                      <strong>{formatDate(repair.warranty_expiry_effective || repair.warranty_expiry)}</strong>
                    </>
                  ) : null}
                </p>
                {repair.warranty_active && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1">Đang trong thời hạn bảo hành</p>
                )}
              </div>

              {repair.open_warranty_order && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">
                  Đã có yêu cầu bảo hành đang xử lý:{' '}
                  <strong>#{repair.open_warranty_order.receipt_code}</strong>
                </div>
              )}

              {canWarranty && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-3">
                  <p className="text-sm font-bold text-gray-900">Gửi yêu cầu bảo hành</p>
                  <textarea
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    rows={3}
                    placeholder="Mô tả lỗi cần bảo hành (tuỳ chọn)..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleWarranty}
                    disabled={submitting}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Gửi bảo hành
                  </button>
                </div>
              )}

              {message.text && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      : 'bg-red-50 text-red-800 border border-red-100'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex flex-wrap gap-2 justify-end">
          {repair?.receipt_code && (
            <Link
              to={`/tra-cuu?q=${encodeURIComponent(repair.receipt_code)}`}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              onClick={onClose}
            >
              <ExternalLink className="w-4 h-4" /> Tra cứu công khai
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
      <Icon className="w-3.5 h-3.5" /> {label}
    </p>
    <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
  </div>
);

export default BookingRepairDetailModal;
