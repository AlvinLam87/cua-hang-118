import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Save, Wrench, Wallet, Tag, LayoutGrid, Search } from 'lucide-react';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';
import { API_V1_URL } from '../../utils/api.js';

const AdminServicesPage = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [form, setForm] = useState({ name: '', price: '', price_label: '', category_id: '', icon: 'Wrench', has_warranty: true });
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([
      fetch(`${API_V1_URL}/admin/services`, { headers }),
      fetch(`${API_V1_URL}/admin/categories?type=service`, { headers }),
    ]);
    const [sData, cData] = await Promise.all([sRes.json(), cRes.json()]);
    if (sData.success) setServices(sData.data);
    if (cData.success) setCategories(cData.data);
    setLoading(false);
  };

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', price: '', price_label: '', category_id: categories[0]?.id || '', icon: 'Wrench', has_warranty: true }); setShowForm(true); };
  const openEdit = (s) => { setEditing(s.id); setForm({ name: s.name, price: s.price, price_label: s.price_label || '', category_id: s.category_id, icon: s.icon || 'Wrench', has_warranty: s.has_warranty }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `${API_V1_URL}/admin/services/${editing}` : `${API_V1_URL}/admin/services`;
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify({ ...form, price: Number(form.price) }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Không thể lưu dịch vụ.');
      setShowForm(false);
      showMessage('success', editing ? 'Cập nhật dịch vụ thành công.' : 'Thêm dịch vụ mới thành công.');
      fetchData();
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_V1_URL}/admin/services/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Không thể xóa dịch vụ.');
      showMessage('success', 'Đã xóa dịch vụ.');
      fetchData();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredServices = useMemo(() => services.filter((s) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return (
      s.name?.toLowerCase().includes(keyword) ||
      s.category?.name?.toLowerCase().includes(keyword)
    );
  }), [services, query]);

  const summary = useMemo(() => {
    const total = services.length;
    const warranty = services.filter((s) => s.has_warranty).length;
    const priced = services.filter((s) => Number(s.price) > 0).length;
    return { total, warranty, priced };
  }, [services]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const pagedServices = useMemo(
    () => filteredServices.slice((page - 1) * pageSize, page * pageSize),
    [filteredServices, page]
  );

  useEffect(() => {
    setPage(1);
  }, [services.length, query]);

  if (loading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div>
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản Lý Dịch Vụ</h1>
          <p className="text-gray-500 text-sm">{services.length} dịch vụ</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25">
          <Plus className="w-4 h-4" /> Thêm Dịch Vụ
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3">
          <p className="text-xs text-blue-700 font-semibold">Tổng dịch vụ</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3">
          <p className="text-xs text-emerald-700 font-semibold">Có bảo hành</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{summary.warranty}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-linear-to-r from-amber-50 to-yellow-50 px-4 py-3">
          <p className="text-xs text-amber-700 font-semibold">Có giá niêm yết</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{summary.priced}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 mb-5 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên dịch vụ hoặc danh mục..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Kết quả lọc: <span className="font-bold text-gray-700">{filteredServices.length}</span> dịch vụ
        </p>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/55 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl p-0 w-full max-w-3xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] border border-blue-50 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="w-full p-5 border-b border-gray-100 bg-linear-to-r from-blue-50/60 via-white to-indigo-50/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{editing ? 'Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}</h2>
                    <p className="text-xs text-gray-500 mt-1">Điền thông tin dịch vụ theo chuẩn danh mục để dễ quản lý và báo giá.</p>
                  </div>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2 transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-5">
              <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên dịch vụ *</label>
                <div className="relative">
                  <Wrench className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Sửa lỗi mainboard laptop" />
                </div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá (VNĐ)</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: 300000" />
                </div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Nhãn giá</label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" value={form.price_label} onChange={e => setForm({...form, price_label: e.target.value})} placeholder="VD: Từ 200.000đ" className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Danh mục</label>
                <div className="relative">
                  <LayoutGrid className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              </div>
              <label className="flex items-center gap-2.5 text-sm self-end pb-2 font-medium text-gray-700">
                <input type="checkbox" checked={form.has_warranty} onChange={e => setForm({...form, has_warranty: e.target.checked})} className="rounded text-blue-600" />
                Có bảo hành
              </label>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 md:col-span-2 shadow-lg shadow-blue-600/20"><Save className="w-4 h-4" /> {editing ? 'Cập Nhật' : 'Thêm Mới'}</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-auto max-h-[68vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10"><tr className="bg-gray-50/95 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">ID</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Tên dịch vụ</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Danh mục</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Giá</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Bảo hành</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Thao tác</th>
            </tr></thead>
            <tbody>
              {pagedServices.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-400 font-mono">#{s.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">{s.price_label || (s.price ? s.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ')}</td>
                  <td className="px-4 py-3 text-center">{s.has_warranty ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(s.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa dịch vụ"
        message="Bạn có chắc muốn xóa dịch vụ này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
      />
    </div>
  );
};

export default AdminServicesPage;
