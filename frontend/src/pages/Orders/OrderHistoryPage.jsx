import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Loader2, Eye, Calendar, MapPin, CreditCard, Clock, ChevronRight, ShoppingBag } from 'lucide-react';
import ProfileSidebar from '../Profile/ProfileSidebar';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  shipping: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/dang-nhap');

      try {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));

        const [orderRes, userRes] = await Promise.all([
          fetch('/api/v1/orders/my-orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const orderData = await orderRes.json();
        const userData = await userRes.json();

        if (orderData.success) setOrders(orderData.data);
        if (userData.success) {
          setUser(userData.data);
          localStorage.setItem('user', JSON.stringify(userData.data)); // Cập nhật luôn cache
        }
      } catch (err) {
        console.error('Lỗi tải đơn hàng:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
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
            <div className="flex items-center justify-between gap-4 mb-8 pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Lịch Sử Đơn Hàng</h2>
                <p className="text-gray-500 text-sm">Theo dõi tất cả đơn hàng bạn đã đặt tại Cửa Hàng 118</p>
              </div>
              <Link to="/cua-hang" className="hidden sm:flex px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-transform active:scale-95 items-center gap-2 whitespace-nowrap">
                <ShoppingBag className="w-4 h-4" /> Mua tiếp
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="bg-gray-50 rounded-3xl p-16 text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Hãy ghé thăm Cửa Hàng để khám phá những sản phẩm công nghệ tuyệt vời!</p>
                <Link to="/cua-hang" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-600/20">
                  <ShoppingBag className="w-5 h-5" /> Đến Cửa Hàng
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-extrabold text-lg text-gray-900">Đơn hàng <span className="text-blue-600">#{order.id}</span></p>
                            <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3.5 h-3.5" /> {order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl border flex w-fit items-center gap-2 ${statusColors[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100/50">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="line-clamp-1">{order.shipping_address || 'Không có địa chỉ'}</span>
                        </div>
                        <div className="flex items-center justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200">
                          <span className="text-xl font-black text-blue-600">
                            {parseFloat(order.total_amount).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
