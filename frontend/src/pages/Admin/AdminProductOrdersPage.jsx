import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, Eye, Filter, CheckCircle2, Clock, Truck, XCircle, User, MapPin, Package } from 'lucide-react';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import { normalizeProductImages } from '../../utils/media.js';
import { formatDate, formatCurrency } from '../../utils/format.js';
import { API_V1_URL } from '../../utils/api.js';

const statusMap = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  shipping: { label: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const paymentStatusMap = {
  unpaid: { label: 'Chưa thanh toán', color: 'bg-gray-100 text-gray-600' },
  paid: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-700' },
  refunded: { label: 'Đã hoàn tiền', color: 'bg-orange-100 text-orange-700' },
};

const AdminProductOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_V1_URL}/admin/product-orders`, { headers });
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.data || []);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Lỗi từ server' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Không thể kết nối đến máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (orderId, field, value) => {
    try {
      setUpdating(true);
      const res = await fetch(`${API_V1_URL}/admin/product-orders/${orderId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ [field]: value })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Cập nhật trạng thái thành công.' });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: value } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, [field]: value }));
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = useMemo(() => orders.filter(o => {
    const keyword = query.toLowerCase().trim();
    const guestName = o.guest_name || '';
    const guestPhone = o.guest_phone || '';
    const orderId = o.id ? o.id.toString() : '';
    const paymentMethod = o.payment_method || '';
    
    const matchSearch = !keyword || 
      guestName.toLowerCase().includes(keyword) || 
      guestPhone.includes(keyword) || 
      orderId.includes(keyword) ||
      paymentMethod.toLowerCase().includes(keyword);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, query, statusFilter]);

  const pageSize = 10;
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  if (loading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản Lý Đơn Bán Hàng</h1>
          <p className="text-sm text-slate-500 font-medium">Tổng số {filteredOrders.length} đơn hàng được tìm thấy</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại hoặc mã đơn..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            className="bg-slate-50 border-none rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([val, info]) => (
              <option key={val} value={val}>{info.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Mã Đơn</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Khách Hàng</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Tổng Tiền</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Thanh Toán</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Trạng Thái</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Ngày Đặt</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">#{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{order.guest_name}</div>
                    <div className="text-xs text-slate-500">{order.guest_phone}</div>
                  </td>
                  <td className="px-6 py-4 font-black text-blue-600">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${paymentStatusMap[order.payment_status]?.color}`}>
                        {paymentStatusMap[order.payment_status]?.label}
                      </span>
                    </div>
                    <div className="mt-1.5 pl-0.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${order.payment_method === 'cod' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {order.payment_method === 'cod' ? 'COD' : 'Bank Transfer'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusMap[order.status]?.color}`}>
                      {statusMap[order.status]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded-xl transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-slate-400 font-medium">Không có đơn hàng nào khớp với tìm kiếm.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-50 bg-slate-50/30">
          <AdminPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">Chi Tiết Đơn Hàng #{selectedOrder.id}</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Đặt ngày {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Info Columns */}
                <div className="md:col-span-2 space-y-8">
                  {/* Items List */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" /> Danh sách sản phẩm
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                            <ProductImage 
                              imageSources={normalizeProductImages(item.product?.image_url)} 
                              alt={item.product?.name}
                              imgClassName="w-full h-full object-cover"
                              fallbackContent={<Package className="w-6 h-6 text-slate-300" />}
                              fallbackClassName="w-full h-full flex items-center justify-center bg-slate-50"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate">{item.product?.name || 'Sản phẩm đã bị xóa'}</div>
                            <div className="text-xs text-slate-500 font-medium">Số lượng: {item.quantity}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900 text-sm">{Number(item.price_at_purchase).toLocaleString('vi-VN')}đ</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Thành tiền: {Number(item.price_at_purchase * item.quantity).toLocaleString('vi-VN')}đ</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-900 text-white p-6 rounded-[24px] flex justify-between items-center shadow-xl shadow-slate-900/20">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Tổng tiền thanh toán</p>
                      <h4 className="text-3xl font-black mt-1">{Number(selectedOrder.total_amount).toLocaleString('vi-VN')}đ</h4>
                      <p className="text-xs opacity-60 mt-1">Hình thức: {selectedOrder.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}</p>
                    </div>
                    <div className="text-right">
                       {selectedOrder.discount_amount > 0 && (
                         <div className="mb-2">
                            <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-bold">Giảm giá: -{Number(selectedOrder.discount_amount).toLocaleString('vi-VN')}đ</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Actions & Customer */}
                <div className="space-y-6">
                  {/* Trạng thái đơn */}
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Trạng thái đơn hàng</h4>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 mb-4"
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, 'status', e.target.value)}
                      disabled={updating}
                    >
                      {Object.entries(statusMap).map(([val, info]) => (
                        <option key={val} value={val}>{info.label}</option>
                      ))}
                    </select>
                    
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Trạng thái thanh toán</h4>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                      value={selectedOrder.payment_status}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, 'payment_status', e.target.value)}
                      disabled={updating}
                    >
                      {Object.entries(paymentStatusMap).map(([val, info]) => (
                        <option key={val} value={val}>{info.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Khách hàng */}
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Thông tin khách hàng</h4>
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{selectedOrder.guest_name}</p>
                        <p className="text-xs text-slate-500 font-medium">{selectedOrder.guest_phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start pt-2 border-t border-slate-50">
                      <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{selectedOrder.shipping_address}</p>
                    </div>
                    {selectedOrder.note && (
                       <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                         <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Ghi chú</p>
                         <p className="text-xs text-amber-800 italic">{selectedOrder.note}</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductOrdersPage;
