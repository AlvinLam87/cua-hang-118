import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Loader2, Calendar, MapPin, ShoppingBag, Clock, QrCode, AlertCircle, ChevronDown, ChevronUp, Wrench, ShieldCheck, Send, Info } from 'lucide-react';
import ProfileSidebar from '../Profile/ProfileSidebar.jsx';
import { API_V1_URL } from '../../utils/api.js';
import { claimBankTransfer } from '../../utils/claimBankTransfer.js';
import { createAppSocket } from '../../utils/socket.js';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  shipping: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const isPendingBankTransfer = (order) =>
  order.payment_method === 'bank_transfer' && order.payment_status !== 'paid';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [warrantyProduct, setWarrantyProduct] = useState(null); // { orderId, productId }
  const [warrantyIssue, setWarrantyIssue] = useState('');
  const [warrantySubmitting, setWarrantySubmitting] = useState(false);
  const [warrantyMsg, setWarrantyMsg] = useState({ type: '', text: '' });

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    setWarrantyProduct(null);
    setWarrantyIssue('');
    setWarrantyMsg({ type: '', text: '' });
  };

  const handleWarrantySubmit = async (orderId, productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setWarrantyMsg({ type: 'error', text: 'Vui lòng đăng nhập lại.' });
      return;
    }
    if (!warrantyIssue.trim()) {
      setWarrantyMsg({ type: 'error', text: 'Vui lòng nhập mô tả lỗi hoặc lý do bảo hành.' });
      return;
    }

    setWarrantySubmitting(true);
    setWarrantyMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API_V1_URL}/orders/${orderId}/warranty`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, issue: warrantyIssue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setWarrantyMsg({ type: 'success', text: data.message });
        setWarrantyIssue('');
        setTimeout(() => {
          setWarrantyProduct(null);
        }, 3000);
      } else {
        setWarrantyMsg({ type: 'error', text: data.message || 'Không thể gửi yêu cầu bảo hành.' });
      }
    } catch {
      setWarrantyMsg({ type: 'error', text: 'Lỗi kết nối. Vui lòng thử lại sau.' });
    } finally {
      setWarrantySubmitting(false);
    }
  };

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/dang-nhap');
      return;
    }

    try {
      const userStr = localStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));

      const [orderRes, userRes] = await Promise.all([
        fetch(`${API_V1_URL}/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_V1_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const orderData = await orderRes.json();
      const userData = await userRes.json();

      if (orderData.success) setOrders(orderData.data || []);
      if (userData.success) {
        setUser(userData.data);
        localStorage.setItem('user', JSON.stringify(userData.data));
      }
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();

    const socket = createAppSocket();
    const onOrderUpdate = (data) => {
      if (data?.type !== 'order' || !data.id) return;
      const orderId = Number(data.id);
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === orderId);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          ...(data.status != null ? { status: data.status } : {}),
          ...(data.payment_status != null ? { payment_status: data.payment_status } : {}),
        };
        return next;
      });
    };

    socket.on('data_changed', onOrderUpdate);
    socket.on('new_product_order', onOrderUpdate);
    return () => socket.disconnect();
  }, [fetchOrders]);

  const resumePayment = (order) => {
    navigate('/dat-hang-thanh-cong', {
      state: {
        orderId: order.id,
        paymentMethod: 'bank_transfer',
        totalAmount: order.total_amount,
        guestPhone: order.guest_phone || user?.phone,
      },
    });
  };

  const handleClaimTransfer = async (order) => {
    const phone = order.guest_phone || user?.phone;
    if (!phone) return;
    setClaimingId(order.id);
    try {
      const { ok, data } = await claimBankTransfer(order.id, phone);
      if (ok && data.data?.payment_status === 'paid') {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, payment_status: 'paid', status: data.data?.status || 'confirmed' }
              : o
          )
        );
      } else {
        alert(
          data.message ||
            'Đã ghi nhận báo chuyển khoản. Cửa hàng sẽ đối soát — chưa xác nhận thanh toán tự động.'
        );
      }
    } catch {
      alert('Lỗi kết nối. Thử lại sau.');
    } finally {
      setClaimingId(null);
    }
  };

  const pendingCount = orders.filter(isPendingBankTransfer).length;

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
            <div className="flex items-center justify-between gap-4 mb-8 pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Lịch Sử Đơn Hàng</h2>
                <p className="text-gray-500 text-sm">
                  {pendingCount > 0
                    ? `Bạn có ${pendingCount} đơn chưa thanh toán — đang treo chờ chuyển khoản`
                    : 'Theo dõi tất cả đơn hàng bạn đã đặt tại Cửa Hàng 118'}
                </p>
              </div>
              <Link
                to="/cua-hang"
                className="hidden sm:flex px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-transform active:scale-95 items-center gap-2 whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4" /> Mua tiếp
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="bg-gray-50 rounded-3xl p-16 text-center border border-dashed border-gray-200">
                <Package className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
                <Link to="/cua-hang" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 inline-flex items-center gap-2 mt-4">
                  <ShoppingBag className="w-5 h-5" /> Đến Cửa Hàng
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const isPending = isPendingBankTransfer(order);
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                        isPending
                          ? 'border-amber-300 bg-amber-50/40 shadow-md shadow-amber-100/50 ring-1 ring-amber-200'
                          : 'border-gray-100 bg-white hover:border-blue-100 hover:shadow-lg'
                      }`}
                    >
                      <div className="p-6">
                        {isPending && (
                          <div className="mb-4 flex items-start gap-3 p-3 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-900 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Đơn treo — chưa thanh toán</p>
                              <p className="text-xs mt-0.5 opacity-80">
                                Chuyển khoản đúng nội dung <strong>DH{order.id}</strong> để hệ thống tự xác nhận.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                isPending ? 'bg-amber-100' : 'bg-blue-50'
                              }`}
                            >
                              {isPending ? (
                                <Clock className="w-6 h-6 text-amber-600" />
                              ) : (
                                <Package className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-lg text-gray-900">
                                Đơn hàng <span className="text-blue-600">DH{order.id}</span>
                              </p>
                              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mt-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {order.createdAt || order.created_at
                                  ? new Date(order.createdAt || order.created_at).toLocaleDateString('vi-VN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl border flex w-fit items-center gap-2 ${
                              statusColors[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {statusLabels[order.status] || order.status}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100/50">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="line-clamp-1">{order.shipping_address || 'Không có địa chỉ'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                  order.payment_status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                  order.payment_method === 'cod'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:items-end gap-2">
                            <span className="text-xl font-black text-blue-600">
                              {parseFloat(order.total_amount).toLocaleString('vi-VN')}đ
                            </span>
                            <div className="flex flex-wrap gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => toggleExpandOrder(order.id)}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-colors"
                              >
                                {isExpanded ? (
                                  <>Thu gọn <ChevronUp className="w-4 h-4" /></>
                                ) : (
                                  <>Xem chi tiết <ChevronDown className="w-4 h-4" /></>
                                )}
                              </button>
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => resumePayment(order)}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
                                  >
                                    <QrCode className="w-4 h-4" /> Xem QR
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleClaimTransfer(order)}
                                    disabled={claimingId === order.id}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
                                  >
                                    {claimingId === order.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : null}
                                    Báo đã CK
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Order Items Details */}
                        {isExpanded && (
                          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-2">
                              <ShoppingBag className="w-4 h-4 text-blue-600" /> Danh sách sản phẩm
                            </h4>
                            <div className="space-y-3">
                              {(order.items || []).map((item, idx) => {
                                const isWarrantyFormActive = warrantyProduct && warrantyProduct.orderId === order.id && warrantyProduct.productId === item.product_id;
                                return (
                                  <div key={idx} className="bg-gray-50/50 hover:bg-gray-50 rounded-xl p-4 border border-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                      {item.product?.image_url ? (
                                        <img
                                          src={item.product.image_url}
                                          alt={item.product?.name || item.product_name}
                                          className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
                                        />
                                      ) : (
                                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
                                          <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                          {item.product?.name || item.product_name}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-400 mt-1">
                                          SL: {item.quantity} × {parseFloat(item.price_at_purchase).toLocaleString('vi-VN')}đ
                                        </p>
                                      </div>
                                      <div className="text-right flex flex-col items-end gap-2">
                                        <span className="text-sm font-extrabold text-gray-900">
                                          {(item.quantity * parseFloat(item.price_at_purchase)).toLocaleString('vi-VN')}đ
                                        </span>
                                        {['confirmed', 'shipping', 'completed'].includes(order.status) && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isWarrantyFormActive) {
                                                setWarrantyProduct(null);
                                              } else {
                                                setWarrantyProduct({ orderId: order.id, productId: item.product_id });
                                                setWarrantyIssue('');
                                                setWarrantyMsg({ type: '', text: '' });
                                              }
                                            }}
                                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-black rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                                          >
                                            <Wrench className="w-3.5 h-3.5" /> Bảo hành
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Warranty Issue Form */}
                                    {isWarrantyFormActive && (
                                      <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                                          <Info className="w-3.5 h-3.5 text-blue-500" />
                                          <span>Nhập mô tả lỗi hoặc lý do gửi yêu cầu bảo hành:</span>
                                        </div>
                                        <textarea
                                          value={warrantyIssue}
                                          onChange={(e) => setWarrantyIssue(e.target.value)}
                                          placeholder="Ví dụ: Sản phẩm không lên nguồn, màn hình bị sọc dọc sau 2 ngày sử dụng..."
                                          className="w-full text-sm font-medium text-gray-800 placeholder-gray-400 bg-white border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors"
                                          rows={3}
                                        />
                                        
                                        {warrantyMsg.text && (
                                          <div className={`p-3 rounded-lg text-xs font-bold border ${
                                            warrantyMsg.type === 'success'
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                              : 'bg-rose-50 text-rose-700 border-rose-200'
                                          }`}>
                                            {warrantyMsg.text}
                                          </div>
                                        )}

                                        <div className="flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setWarrantyProduct(null)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-extrabold rounded-lg transition-colors"
                                          >
                                            Hủy bỏ
                                          </button>
                                          <button
                                            type="button"
                                            disabled={warrantySubmitting}
                                            onClick={() => handleWarrantySubmit(order.id, item.product_id)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-extrabold rounded-lg shadow-md transition-colors flex items-center gap-1.5"
                                          >
                                            {warrantySubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                            Gửi yêu cầu
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
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

export default OrderHistoryPage;
