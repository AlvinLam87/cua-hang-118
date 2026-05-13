import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CalendarDays, Loader2, Wrench, Clock, Phone, CheckCircle2, AlertCircle, XCircle, CalendarPlus } from 'lucide-react';
import ProfileSidebar from '../Profile/ProfileSidebar';
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

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/dang-nhap');

      try {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));

        const [bookingRes, userRes] = await Promise.all([
          fetch(`${API_V1_URL}/bookings/my-bookings`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_V1_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
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
    };
    fetchBookings();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-[#f6f8ff]"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div>;

  return (
    <div className="bg-[#f6f8ff] min-h-screen pb-20 pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Dashboard Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Tài Khoản Của Tôi</h1>
          <p className="text-gray-500 text-lg">Quản lý không gian cá nhân và các dịch vụ của bạn.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <ProfileSidebar user={user} />

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white rounded-[40px] p-8 sm:p-12 border border-gray-100 shadow-2xl shadow-blue-900/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Lịch Sử Đặt Lịch</h2>
                <p className="text-gray-500 text-sm">Xem lại tất cả lịch hẹn dịch vụ bạn đã đăng ký.</p>
              </div>
              <Link to="/dich-vu" className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-transform active:scale-95 flex items-center gap-2 whitespace-nowrap">
                <CalendarPlus className="w-4 h-4" /> Đặt lịch mới
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-gray-50 rounded-3xl p-16 text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                  <CalendarDays className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có lịch hẹn nào</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Hãy đặt lịch sửa chữa để đội ngũ kỹ thuật viên của Cửa Hàng 118 hỗ trợ bạn!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => {
                  const st = statusConfig[b.status] || statusConfig.pending;
                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all">
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                              <Wrench className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-extrabold text-lg text-gray-900 leading-tight">{b.service}</p>
                              <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Mã lịch hẹn: #{b.id}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center w-fit gap-1.5 ${st.color}`}>
                            {st.icon} {st.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100/50">
                          <div>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Ngày hẹn</p>
                            <p className="font-bold text-gray-800 flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-blue-500" /> {formatDate(b.booking_date) || 'Chưa xác định'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Giờ hẹn</p>
                            <p className="font-bold text-gray-800 flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500" /> {b.booking_time || 'Chưa xác định'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">SĐT liên hệ</p>
                            <p className="font-bold text-gray-800 flex items-center gap-1.5"><Phone className="w-4 h-4 text-emerald-500" /> {b.phone}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Ngày tạo</p>
                            <p className="font-bold text-gray-600">{formatDate(b.createdAt || b.created_at) || 'N/A'}</p>
                          </div>
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
    </div>
  );
};

export default BookingHistoryPage;
