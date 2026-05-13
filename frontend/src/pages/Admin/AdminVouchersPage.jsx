import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Ticket, Plus, X, Save, Trash2, Search, Calendar, DollarSign, Percent, Info, Award, Pencil } from 'lucide-react';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';

const AdminVouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    code: '',
    type: 'fixed',
    value: '',
    min_order_value: '',
    max_discount_value: '',
    usage_limit: '',
    expiry_date: '',
    is_active: true,
    points_required: 0
  });
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/vouchers', { headers });
      const data = await res.json();
      if (data.success) setVouchers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setForm({
      code: '',
      type: 'fixed',
      value: '',
      min_order_value: '0',
      max_discount_value: '',
      usage_limit: '',
      expiry_date: '',
      is_active: true,
      points_required: 0
    });
    setShowAdd(true);
  };

  const handleOpenEdit = (v) => {
    setEditing(v.id);
    setForm({
      code: v.code,
      type: v.type,
      value: v.value,
      min_order_value: v.min_order_value,
      max_discount_value: v.max_discount_value || '',
      usage_limit: v.usage_limit || '',
      expiry_date: v.expiry_date ? v.expiry_date.split('T')[0] : '',
      is_active: v.is_active,
      points_required: v.points_required || 0
    });
    setShowAdd(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `/api/v1/admin/vouchers/${editing}` : '/api/v1/admin/vouchers';
    const method = editing ? 'PUT' : 'POST';

    try {
      const payload = {
        ...form,
        value: Number(form.value),
        min_order_value: Number(form.min_order_value) || 0,
        max_discount_value: form.max_discount_value ? Number(form.max_discount_value) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        expiry_date: form.expiry_date || null,
        points_required: Number(form.points_required) || 0
      };

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi thao tác.');

      setShowAdd(false);
      showMessage('success', editing ? 'Cập nhật thành công.' : 'Thêm mã mới thành công.');
      fetchData();
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mã này?')) return;
    try {
      const res = await fetch(`/api/v1/admin/vouchers/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Đã xóa mã giảm giá.');
        fetchData();
      }
    } catch (err) {
      showMessage('error', 'Không thể xóa mã.');
    }
  };

  const filteredVouchers = useMemo(() => vouchers.filter((v) => {
    const keyword = query.trim().toLowerCase();
    return !keyword || v.code.toLowerCase().includes(keyword);
  }), [vouchers, query]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / pageSize));
  const pagedVouchers = useMemo(
    () => filteredVouchers.slice((page - 1) * pageSize, page * pageSize),
    [filteredVouchers, page]
  );

  if (loading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="animate-in fade-in duration-500">
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Ticket className="text-blue-600" /> Quản Lý Mã Giảm Giá
          </h1>
          <p className="text-gray-500 text-sm mt-1">Tạo mã khuyến mãi và quản lý các voucher đổi thưởng.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-5 h-5" /> Thêm Mã Mới
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 mb-6 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã giảm giá..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-blue-50 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-blue-50/50 to-indigo-50/50">
              <h2 className="text-xl font-black text-gray-900">{editing ? 'Cập Nhật Mã' : 'Thêm Mã Giảm Giá Mới'}</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mã giảm giá</label>
                <input 
                  type="text" 
                  required 
                  value={form.code} 
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                  placeholder="VD: GIAM50K"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Loại giảm giá</label>
                <select 
                  value={form.type} 
                  onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fixed">Tiền cố định (VNĐ)</option>
                  <option value="percent">Phần trăm (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá trị giảm</label>
                <div className="relative">
                  {form.type === 'fixed' ? <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /> : <Percent className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />}
                  <input 
                    type="number" 
                    required 
                    value={form.value} 
                    onChange={e => setForm({...form, value: e.target.value})}
                    placeholder={form.type === 'fixed' ? '50000' : '10'}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Đơn hàng tối thiểu (VNĐ)</label>
                <input 
                  type="number" 
                  value={form.min_order_value} 
                  onChange={e => setForm({...form, min_order_value: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Giảm tối đa (VNĐ)</label>
                <input 
                  type="number" 
                  disabled={form.type === 'fixed'}
                  value={form.max_discount_value} 
                  onChange={e => setForm({...form, max_discount_value: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Số lần sử dụng</label>
                <input 
                  type="number" 
                  value={form.usage_limit} 
                  onChange={e => setForm({...form, usage_limit: e.target.value})}
                  placeholder="Để trống nếu không giới hạn"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày hết hạn</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date" 
                    value={form.expiry_date} 
                    onChange={e => setForm({...form, expiry_date: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" /> Số điểm cần đổi (Reward Points)
                </label>
                <input 
                  type="number" 
                  value={form.points_required} 
                  onChange={e => setForm({...form, points_required: e.target.value})}
                  placeholder="0 = Không dùng để đổi thưởng"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/30"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">* Nhập số điểm &gt; 0 để mã này hiện ở trang Đổi Điểm Thưởng của khách hàng.</p>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  checked={form.is_active} 
                  onChange={e => setForm({...form, is_active: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-bold text-gray-700">Kích hoạt mã này ngay lập tức</label>
              </div>

              <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100 flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Save className="w-5 h-5" /> {editing ? 'Lưu Thay Đổi' : 'Tạo Mã Ngay'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-auto max-h-[68vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10"><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã / Loại</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Giá trị</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Đơn tối thiểu</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Điểm đổi</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Lượt dùng</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Hạn dùng</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Thao tác</th>
            </tr></thead>
            <tbody>
              {pagedVouchers.map((v) => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-blue-700 font-mono text-base">{v.code}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">{v.type === 'fixed' ? 'Tiền mặt' : 'Phần trăm'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-800">
                      {v.type === 'fixed' ? Number(v.value).toLocaleString('vi-VN') + 'đ' : v.value + '%'}
                    </div>
                    {v.type === 'percent' && v.max_discount_value && (
                      <div className="text-[10px] text-orange-600">Tối đa: {Number(v.max_discount_value).toLocaleString('vi-VN')}đ</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{Number(v.min_order_value).toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-center">
                    {v.points_required > 0 ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-black text-xs">
                        {v.points_required} pts
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-700">{v.used_count}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-400">{v.usage_limit || '∞'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-medium">
                    {v.expiry_date ? new Date(v.expiry_date).toLocaleDateString('vi-VN') : 'Không hạn'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {v.is_active ? 'Đang bật' : 'Đã tắt'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenEdit(v)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedVouchers.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-gray-400">Không tìm thấy mã giảm giá nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <div className="mt-8 bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
          <Info className="text-white w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 mb-1">Mẹo quản lý mã giảm giá</h3>
          <p className="text-sm text-blue-700 leading-relaxed">
            Bạn có thể tạo mã dành riêng cho khách hàng bằng cách gán <b>User ID</b>. 
            Mã <b>Phần trăm</b> nên đi kèm với <b>Giảm tối đa</b> để kiểm soát chi phí marketing hiệu quả.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminVouchersPage;
