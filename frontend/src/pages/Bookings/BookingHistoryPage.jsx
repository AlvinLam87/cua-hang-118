import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays, Loader2, Wrench, Clock, Phone, CheckCircle2, XCircle,
  CalendarPlus, Eye, ShieldCheck, ExternalLink,
} from 'lucide-react';
import ProfileSidebar from '../Profile/ProfileSidebar';
import BookingRepairDetailModal from './BookingRepairDetailModal';
import { formatDate } from '../../utils/format.js';
import { API_V1_URL } from '../../utils/api.js';

const statusConfig = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const BookingHistoryPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const token = () => localStorage.getItem('token');
  const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

  const loadBookings = useCallback(async () => {
    if (!token()) return navigate('/dang-nhap');
    try {
      const [bookingRes, userRes] = await Promise.all([
        fetch(`${API_V1_URL}/bookings/my-bookings`, { headers: authHeaders() }),
        fetch(`${API_V1_URL}/auth/me`, { headers: authHeaders() }),
      ]);
      const bookingData = await bookingRes.json();
      const userData = await userRes.json();
      if (bookingData.success) setBookings(bookingData.data);
      if (userData.success) {
        setUser(userData.data);
        localStorage.setItem('user', JSON.stringify(userData.data));
      }
    } catch (err) {
      console.error('Lỗi tải lịch hẹn:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const openDetail = async (booking) => {
    setSelectedBooking(booking);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_V1_URL}/bookings/my-bookings/${booking.id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setDetail(data.data);
    } catch (err) {
      console.error('Lỗi tải chi tiết:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedBooking(null);
    setDetail(null);
  };

  const handleWarrantySuccess = () => {
    loadBookings();
    if (selectedBooking) openDetail(selectedBooking);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#f6f8ff]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#f6f8ff] min-h-screen pb-20 pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Tài Khoản Của Tôi</h1>
          <p className="text-gray-500 text-lg">Quản lý không gian cá nhân và các dịch vụ của bạn.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <ProfileSidebar user={user} />

          <div className="flex-1 w-full bg-white rounded-[40px] p-8 sm:p-12 border border-gray-100 shadow-2xl shadow-blue-900/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Lịch Sử Đặt Lịch</h2>
                <p className="text-gray-500 text-sm">Xem lại lịch hẹn, tiến độ sửa chữa và gửi yêu cầu bảo hành.</p>
              </div>
              <Link
                to="/dich-vu"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-transform active:scale-95 flex items-center gap-2 whitespace-nowrap"
              >
                <CalendarPlus className="w-4 h-4" /> Đặt lịch mới
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-gray-50 rounded-3xl p-16 text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                  <CalendarDays className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có lịch hẹn nào</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Hãy đặt lịch sửa chữa để đội ngũ kỹ thuật viên của Cửa Hàng 118 hỗ trợ bạn!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => {
                  const st = statusConfig[b.status] || statusConfig.pending;
                  const repair = b.repair_order;
                  const canWarranty = repair?.can_receive_warranty && !repair?.open_warranty_order;

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all"
                    >
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                              <Wrench className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-extrabold text-lg text-gray-900 leading-tight">{b.service}</p>
                              <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">
                                Mã lịch hẹn: #{b.id}
                                {repair?.receipt_code ? (
                                  <span className="text-blue-600 normal-case ml-2">· {repair.receipt_code}</span>
                                ) : null}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center w-fit gap-1.5 ${st.color}`}>
                            {st.icon} {st.label}
                          </span>
                        </div>

                        {repair && (
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">Đơn sửa chữa:</span>
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                repair.status === 'completed' || repair.status === 'returned'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-orange-50 text-orange-700 border-orange-100'
                              }`}
                            >
                              {b.repair_status_label || repair.status}
                            </span>
                            {canWarranty && (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> Còn bảo hành
                              </span>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100/50 mb-4">
                          <div>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Ngày hẹn</p>
                            <p className="font-bold text-gray-800 flex items-center gap-1.5">
                              <CalendarDays className="w-4 h-4 text-blue-500" /> {formatDate(b.booking_date) || 'Chưa xác định'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Giờ hẹn</p>
                            <p className="font-bold text-gray-800 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-blue-500" /> {b.booking_time || 'Chưa xác định'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">SĐT liên hệ</p>
                            <p className="font-bold text-gray-800 flex items-center gap-1.5">
                              <Phone className="w-4 h-4 text-emerald-500" /> {b.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Ngày tạo</p>
                            <p className="font-bold text-gray-600">{formatDate(b.createdAt || b.created_at) || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => openDetail(b)}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-600/15"
                          >
                            <Eye className="w-4 h-4" /> Xem chi tiết
                          </button>
                          {repair?.receipt_code && (
                            <Link
                              to={`/tra-cuu?q=${encodeURIComponent(repair.receipt_code)}`}
                              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" /> Tra cứu
                            </Link>
                          )}
                          {canWarranty && (
                            <button
                              type="button"
                              onClick={() => openDetail(b)}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2"
                            >
                              <ShieldCheck className="w-4 h-4" /> Gửi bảo hành
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingRepairDetailModal
          booking={selectedBooking}
          detail={detail}
          loading={detailLoading}
          onClose={closeDetail}
          onWarrantySuccess={handleWarrantySuccess}
        />
      )}
    </div>
  );
};

export default BookingHistoryPage;
