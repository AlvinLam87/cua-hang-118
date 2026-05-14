import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, Pencil, X, Save, Activity, UserRound, Stethoscope, Wallet, Search,
  Info, Camera, CheckCircle2, Clock, CalendarDays, Phone, DollarSign, TrendingUp, ChevronRight
} from 'lucide-react';
import { resolveMediaUrl } from '../../utils/media.js';
import { formatDate, formatDateTime } from '../../utils/format.js';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';
import { io } from 'socket.io-client';
import { API_V1_URL } from '../../utils/api.js';

const statusOptions = [
  { value: 'received', label: 'Đã tiếp nhận', color: 'bg-blue-100 text-blue-700' },
  { value: 'diagnosing', label: 'Đang chẩn đoán', color: 'bg-orange-100 text-orange-700' },
  { value: 'quoted', label: 'Đã báo giá', color: 'bg-purple-100 text-purple-700' },
  { value: 'in_progress', label: 'Đang sửa chữa', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'testing', label: 'Đang kiểm tra', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'completed', label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  { value: 'returned', label: 'Đã bàn giao', color: 'bg-green-200 text-green-800' },
  { value: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ status: '', technician_name: '', estimated_cost: '', final_cost: '', diagnosis: '' });
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    try {
      const ts = Date.now();
      const [oRes, tRes] = await Promise.all([
        fetch(`${API_V1_URL}/admin/orders?t=${ts}`, { headers }),
        fetch(`${API_V1_URL}/admin/technicians?t=${ts}`, { headers })
      ]);
      const [oData, tData] = await Promise.all([oRes.json(), tRes.json()]);
      
      if (oData.success) setOrders(oData.data);
      if (tData.success) setTechnicians(tData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 

    // ── Listen for global updates from AdminLayout ──────────────
    const handleGlobalUpdate = () => {
      console.log('⚡ [GlobalUpdate] Refreshing Orders Page...');
      fetchData();
    };

    window.addEventListener('admin-data-update', handleGlobalUpdate);
    return () => window.removeEventListener('admin-data-update', handleGlobalUpdate);
  }, []);

  // Sync selectedDetail when orders data changes
  useEffect(() => {
    if (selectedDetail) {
      const updated = orders.find(o => o.id === selectedDetail.id);
      if (updated) setSelectedDetail(updated);
    }
  }, [orders]);

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  const openEdit = (o) => {
    setEditing(o.id);
    setForm({ status: o.status, technician_name: o.technician_name || '', estimated_cost: o.estimated_cost || '', final_cost: o.final_cost || '', diagnosis: o.diagnosis || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...form, 
        estimated_cost: form.estimated_cost !== '' ? Number(form.estimated_cost) : 0, 
        final_cost: form.final_cost !== '' ? Number(form.final_cost) : 0 
      };
      console.log('🚀 [AdminOrders] Updating order:', editing, payload);

      const res = await fetch(`${API_V1_URL}/admin/orders/${editing}`, { 
        method: 'PUT', 
        headers, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Không thể cập nhật đơn sửa chữa.');
      
      setEditing(null);
      showMessage('success', 'Cập nhật đơn sửa chữa thành công.');
      fetchData();
    } catch (error) {
      console.error('❌ [AdminOrders] Update failed:', error);
      showMessage('error', error.message);
    }
  };

  const getStatusStyle = (status) => statusOptions.find(s => s.value === status) || {};
  const filteredOrders = useMemo(() => orders.filter((o) => {
    const keyword = query.trim().toLowerCase();
    const matchKeyword = !keyword || o.receipt_code?.toLowerCase().includes(keyword) || o.customer?.name?.toLowerCase().includes(keyword) || o.device_name?.toLowerCase().includes(keyword);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchKeyword && matchStatus;
  }), [orders, query, statusFilter]);
  const summary = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => !['completed', 'returned', 'cancelled'].includes(o.status)).length;
    const done = orders.filter((o) => ['completed', 'returned'].includes(o.status)).length;
    return { total, active, done };
  }, [orders]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * pageSize, page * pageSize),
    [filteredOrders, page]
  );

  useEffect(() => {
    setPage(1);
  }, [orders.length, query, statusFilter]);

  if (loading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div>
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản Lý Đơn Sửa Chữa</h1>
        <p className="text-gray-500 text-sm">{orders.length} đơn</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3">
          <p className="text-xs text-blue-700 font-semibold">Tổng đơn</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-linear-to-r from-amber-50 to-yellow-50 px-4 py-3">
          <p className="text-xs text-amber-700 font-semibold">Đang xử lý</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{summary.active}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3">
          <p className="text-xs text-emerald-700 font-semibold">Đã hoàn tất</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{summary.done}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 mb-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mã biên nhận, khách hàng, thiết bị..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
            <option value="all">Tất cả trạng thái</option>
            {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Kết quả lọc: <span className="font-bold text-gray-700">{filteredOrders.length}</span> đơn
        </p>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/55 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-3xl p-0 w-full max-w-3xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] border border-blue-50 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="w-full p-5 border-b border-gray-100 bg-linear-to-r from-blue-50/60 via-white to-indigo-50/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Cập Nhật Đơn #{editing}</h2>
                    <p className="text-xs text-gray-500 mt-1">Điều chỉnh tiến độ xử lý, kỹ thuật viên phụ trách và chi phí đơn sửa chữa.</p>
                  </div>
                  <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2 transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-5">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
                <div className="relative">
                <Activity className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select></div></div>
               <div><label className="block text-sm font-semibold text-gray-700 mb-1">KTV phụ trách</label>
                 <div className="relative">
                 <UserRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                 <select 
                   value={form.technician_name} 
                   onChange={e => setForm({...form, technician_name: e.target.value})} 
                   className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                 >
                   <option value="">-- Chọn kỹ thuật viên --</option>
                   {technicians.map(t => (
                     <option key={t.id} value={t.full_name}>{t.full_name}</option>
                   ))}
                 </select></div></div>
              <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-1">Chẩn đoán</label>
                <div className="relative">
                <Stethoscope className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <textarea value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} rows="2" className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Chi phí dự kiến</label>
                  <div className="relative">
                  <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="number" value={form.estimated_cost} onChange={e => setForm({...form, estimated_cost: e.target.value})} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Chi phí thực tế</label>
                  <div className="relative">
                  <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="number" value={form.final_cost} onChange={e => setForm({...form, final_cost: e.target.value})} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div></div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 md:col-span-2 shadow-lg shadow-blue-600/20"><Save className="w-4 h-4" /> Cập Nhật</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-auto max-h-[68vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10"><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã biên nhận</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Thiết bị</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Lỗi</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Chi phí dự kiến</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">KTV</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Thao tác</th>
            </tr></thead>
            <tbody>
              {pagedOrders.map((o) => {
                const st = getStatusStyle(o.status);
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{o.receipt_code}</td>
                    <td className="px-4 py-3"><div className="font-semibold text-gray-800">{o.customer?.name || '—'}</div><div className="text-xs text-gray-400">{o.customer?.phone}</div></td>
                    <td className="px-4 py-3 text-gray-700">{o.device_name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{o.issue}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">{o.estimated_cost ? `${o.estimated_cost.toLocaleString()}đ` : '—'}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${st.color || ''}`}>{st.label || o.status}</span></td>
                    <td className="px-4 py-3 text-gray-600">{o.technician_name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setSelectedDetail(o)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center" title="Xem chi tiết"><Info className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(o)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* REPAIR DETAIL MODAL (Shared Style) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Chi Tiết Đơn Sửa Chữa</h2>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Mã: #{selectedDetail.receipt_code}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ảnh Trước</p>
                      <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
                        {(selectedDetail.device_image_before || selectedDetail.device_image) ? (
                          <img src={resolveMediaUrl(selectedDetail.device_image_before || selectedDetail.device_image)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200"><Camera className="w-8 h-8" /></div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ảnh Sau</p>
                      <div className="aspect-square rounded-2xl bg-emerald-50/30 border border-emerald-100/50 overflow-hidden">
                        {selectedDetail.device_image_after ? (
                          <img src={resolveMediaUrl(selectedDetail.device_image_after)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-100"><CheckCircle2 className="w-8 h-8" /></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kết quả từ KTV: {selectedDetail.technician_name || '—'}</h3>
                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                      <p className="text-sm font-bold text-gray-900 leading-relaxed">{selectedDetail.diagnosis || 'Chưa có chẩn đoán chi tiết.'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><UserRound className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Khách hàng</p>
                        <p className="text-sm font-bold text-gray-900">{selectedDetail.customer?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm"><Phone className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Liên hệ</p>
                        <p className="text-sm font-bold text-gray-900">{selectedDetail.customer?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm"><DollarSign className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Báo giá dự kiến</p>
                        <p className="text-sm font-bold text-gray-900">{selectedDetail.estimated_cost?.toLocaleString()}đ</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Tiến độ thực hiện</h3>
                  <div className="relative pl-6 border-l-2 border-dashed border-gray-100 space-y-8">
                    {[
                      { s: 'received', label: 'Tiếp nhận máy', date: selectedDetail.received_date },
                      { s: 'diagnosing', label: 'Chẩn đoán lỗi' },
                      { s: 'quoted', label: 'Đã báo giá' },
                      { s: 'in_progress', label: 'Đang sửa chữa' },
                      { s: 'testing', label: 'Kiểm tra kỹ thuật' },
                      { s: 'completed', label: 'Hoàn thành', date: selectedDetail.completed_date },
                    ].map((step, idx) => {
                      const FLOW = ['received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed'];
                      const currentIdx = FLOW.indexOf(selectedDetail.status);
                      const stepIdx = FLOW.indexOf(step.s);
                      const isPast = stepIdx < currentIdx;
                      const isCurrent = stepIdx === currentIdx;
                      return (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${isPast ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-gray-200'}`}></div>
                          <div>
                            <p className={`text-sm font-bold ${isCurrent ? 'text-blue-600' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                            {(isPast || isCurrent) && (
                              <p className="text-[10px] font-medium text-gray-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 
                                {step.s === 'completed' ? formatDateTime(step.date) : (step.date || (isPast ? 'Đã xong' : 'Đang thực hiện...'))}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end border-t border-gray-100">
              <button onClick={() => setSelectedDetail(null)} className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
