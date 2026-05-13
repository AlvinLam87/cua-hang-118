import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, Users, Search, Plus, Star, Phone, Mail, 
  MapPin, Edit, Trash2, X, Save, Trophy, Filter, 
  UserPlus, Award, History, ArrowRight, User
} from 'lucide-react';
import AdminPagination from '../../components/admin/AdminPagination.jsx';
import AdminToast from '../../components/admin/AdminToast.jsx';
import { API_V1_URL } from '../../utils/api.js';

const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [pointData, setPointData] = useState({ points: '', reason: '' });
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    points: 0
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_V1_URL}/admin/customers`, { headers });
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    } catch (err) {
      showMessage('error', 'Lỗi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_V1_URL}/admin/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Đã thêm khách hàng tích điểm.');
        setShowForm(false);
        setForm({ name: '', phone: '', email: '', address: '', points: 0 });
        fetchData();
      } else {
        showMessage('error', data.message);
      }
    } catch (err) {
      showMessage('error', 'Lỗi thao tác.');
    }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_V1_URL}/admin/customers/${editingCustomer.id}/adjust-points`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(pointData)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', data.message);
        setShowPointModal(false);
        fetchData();
      }
    } catch (err) {
      showMessage('error', 'Lỗi cập nhật điểm.');
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Xóa thông tin khách hàng này?')) return;
    try {
      const res = await fetch(`${API_V1_URL}/admin/customers/${id}`, { method: 'DELETE', headers });
      if ((await res.json()).success) {
        showMessage('success', 'Đã xóa.');
        fetchData();
      }
    } catch (err) { showMessage('error', 'Lỗi xóa.'); }
  };

  const filteredCustomers = useMemo(() => customers.filter((c) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return (
      c.name?.toLowerCase().includes(keyword) || 
      c.phone?.includes(keyword) || 
      c.email?.toLowerCase().includes(keyword)
    );
  }), [customers, query]);

  const stats = useMemo(() => {
    const total = customers.length;
    const totalPoints = customers.reduce((acc, c) => acc + (c.points || 0), 0);
    const goldMembers = customers.filter(c => c.points >= 500).length;
    return { total, totalPoints, goldMembers };
  }, [customers]);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const pagedCustomers = useMemo(
    () => filteredCustomers.slice((page - 1) * pageSize, page * pageSize),
    [filteredCustomers, page]
  );

  useEffect(() => { setPage(1); }, [customers.length, query]);

  if (loading) return <div className="flex items-center justify-center py-40 bg-slate-50 min-h-screen"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-700 pb-20">
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-40 px-4 lg:px-8 py-5">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
              <Users className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">QUẢN LÝ KHÁCH HÀNG</h1>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                Customer Database & Loyalty Points <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </div>

          <button 
            onClick={() => setShowForm(true)}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" /> Thêm khách hàng mới
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Users className="w-7 h-7" /></div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tổng khách hàng</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Star className="w-7 h-7" /></div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Quỹ điểm hệ thống</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.totalPoints.toLocaleString()}đ</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Trophy className="w-7 h-7" /></div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Khách hàng VIP</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.goldMembers}</h3>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 mb-8 shadow-sm">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tra cứu nhanh theo Tên, SĐT hoặc Email khách hàng..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-800"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Khách hàng</th>
                  <th className="text-left px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Liên hệ</th>
                  <th className="text-center px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Điểm tích lũy</th>
                  <th className="text-left px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Địa chỉ</th>
                  <th className="text-right px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-sm border border-slate-200">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">ID: #{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                          <Phone className="w-3.5 h-3.5 text-blue-500" /> {c.phone}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                            <Mail className="w-3.5 h-3.5" /> {c.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <div className={`px-4 py-1.5 rounded-full font-black text-sm flex items-center gap-2 ${
                          c.points >= 500 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          <Star className={`w-4 h-4 ${c.points >= 500 ? 'fill-amber-500 text-amber-500' : ''}`} />
                          {c.points || 0}đ
                        </div>
                        {c.points >= 500 && <span className="text-[9px] font-black text-amber-600 uppercase">Hạng Vàng</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-start gap-2 max-w-[250px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                        <span className="text-slate-500 font-medium leading-tight">{c.address || 'Chưa cập nhật'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingCustomer(c);
                            setPointData({ points: c.points, reason: '' });
                            setShowPointModal(true);
                          }}
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Điều chỉnh điểm"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteCustomer(c.id)}
                          className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-40 text-center">
                      <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">Chưa có khách hàng nào trong hệ thống.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none">Khách hàng mới</h2>
                <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mt-2 flex items-center gap-1">
                  <UserPlus className="w-3 h-3 text-blue-500" /> New Loyalty Profile
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-3 hover:bg-white rounded-2xl transition-colors bg-slate-100"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" placeholder="Tên khách hàng" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Điểm ban đầu</label>
                  <div className="relative">
                    <Star className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                    <input type="number" value={form.points} onChange={e => setForm({...form, points: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</label>
                <textarea rows="2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium text-slate-600"></textarea>
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-[24px] font-black shadow-2xl shadow-slate-300 transition-all flex items-center justify-center gap-3 mt-4">
                <Save className="w-5 h-5" /> Lưu hồ sơ khách hàng
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST POINTS MODAL */}
      {showPointModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setShowPointModal(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-amber-50/30">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none">Tích điểm thủ công</h2>
                <p className="text-amber-600 text-[10px] uppercase font-black tracking-widest mt-2">{editingCustomer?.name}</p>
              </div>
              <button onClick={() => setShowPointModal(false)} className="p-3 hover:bg-white rounded-2xl transition-colors bg-slate-100"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdjustPoints} className="p-10 space-y-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Điểm hiện tại</p>
                <h4 className="text-4xl font-black text-indigo-600">{editingCustomer?.points}đ</h4>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điểm mới</label>
                <div className="relative">
                  <Star className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 fill-amber-500" />
                  <input required type="number" value={pointData.points} onChange={e => setPointData({...pointData, points: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-xl text-slate-800" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lý do điều chỉnh</label>
                <input type="text" value={pointData.reason} onChange={e => setPointData({...pointData, reason: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" placeholder="VD: Khách mua trực tiếp tại quầy" />
              </div>

              <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black shadow-2xl shadow-indigo-300 transition-all flex items-center justify-center gap-3 mt-4">
                <Award className="w-6 h-6" /> Xác nhận cập nhật điểm
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomersPage;
