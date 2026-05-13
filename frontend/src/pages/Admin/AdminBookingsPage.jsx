import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Trash2, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';
import { formatDate } from '../../utils/format.js';
import { API_V1_URL } from '../../utils/api.js';

const statusMap = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
};

import { io } from 'socket.io-client';



const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [technicians, setTechnicians] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null); // Booking ID to assign
  const [selectedTech, setSelectedTech] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    try {
      const [bRes, tRes] = await Promise.all([
        fetch(`${API_V1_URL}/admin/bookings`, { headers }),
        fetch(`${API_V1_URL}/admin/technicians`, { headers })
      ]);
      const [bData, tData] = await Promise.all([bRes.json(), tRes.json()]);
      
      if (bData.success) setBookings(bData.data);
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
      console.log('⚡ [GlobalUpdate] Refreshing Bookings Page...');
      fetchData();
    };

    window.addEventListener('admin-data-update', handleGlobalUpdate);
    return () => window.removeEventListener('admin-data-update', handleGlobalUpdate);
  }, []);

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  const updateStatus = async (id, status, techId = null) => {
    try {
      const body = { status };
      if (techId) body.technician_id = techId;

      const res = await fetch(`${API_V1_URL}/admin/bookings/${id}`, { 
        method: 'PUT', 
        headers, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Không thể cập nhật trạng thái.');
      showMessage('success', status === 'confirmed' ? 'Đã xác nhận và tạo đơn sửa chữa.' : 'Cập nhật trạng thái thành công.');
      setAssignTarget(null);
      setSelectedTech('');
      fetchData();
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_V1_URL}/admin/bookings/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Không thể xóa lịch hẹn.');
      showMessage('success', 'Đã xóa lịch hẹn.');
      fetchData();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredBookings = useMemo(() => bookings.filter((b) => {
    const keyword = query.trim().toLowerCase();
    const matchKeyword = !keyword || b.name?.toLowerCase().includes(keyword) || b.phone?.includes(keyword) || b.service?.toLowerCase().includes(keyword);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchKeyword && matchStatus;
  }), [bookings, query, statusFilter]);
  const summary = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    return { total, pending, completed };
  }, [bookings]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const pagedBookings = useMemo(
    () => filteredBookings.slice((page - 1) * pageSize, page * pageSize),
    [filteredBookings, page]
  );

  useEffect(() => {
    setPage(1);
  }, [bookings.length, query, statusFilter]);

  if (loading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div>
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản Lý Lịch Hẹn</h1>
        <p className="text-gray-500 text-sm">{bookings.length} lịch hẹn</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3">
          <p className="text-xs text-blue-700 font-semibold">Tổng lịch hẹn</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-linear-to-r from-amber-50 to-yellow-50 px-4 py-3">
          <p className="text-xs text-amber-700 font-semibold">Chờ xác nhận</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{summary.pending}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3">
          <p className="text-xs text-emerald-700 font-semibold">Đã hoàn thành</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{summary.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 mb-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, số điện thoại hoặc dịch vụ..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([value, cfg]) => <option key={value} value={value}>{cfg.label}</option>)}
          </select>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Kết quả lọc: <span className="font-bold text-gray-700">{filteredBookings.length}</span> lịch hẹn
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-auto max-h-[68vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10"><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">SĐT</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Dịch vụ</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày hẹn</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Thao tác</th>
            </tr></thead>
            <tbody>
              {pagedBookings.map((b) => {
                const st = statusMap[b.status] || statusMap.pending;
                return (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400 font-mono">#{b.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{b.name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.phone}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="font-medium text-gray-900 line-clamp-2">{b.service}</div>
                      {b.preferredTechnician && (
                        <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                          Y/C: {b.preferredTechnician.full_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.booking_date) || '—'} {b.booking_time || ''}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {b.status === 'pending' && (
                          <button 
                            onClick={() => {
                              if (b.preferred_technician_id) {
                                updateStatus(b.id, 'confirmed', b.preferred_technician_id);
                              } else {
                                setAssignTarget(b.id);
                              }
                            }} 
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold"
                          >
                            Xác nhận
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => updateStatus(b.id, 'completed')} className="px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 text-xs font-bold">Hoàn thành</button>
                        )}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button onClick={() => updateStatus(b.id, 'cancelled')} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold">Hủy</button>
                        )}
                        <button onClick={() => setDeleteTarget(b.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
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

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa lịch hẹn"
        message="Bạn có chắc muốn xóa lịch hẹn này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
      />

      {/* ASSIGN TECHNICIAN MODAL */}
      {assignTarget && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Xác nhận & Phân công</h2>
                <p className="text-sm text-gray-500">Chọn kỹ thuật viên để thực hiện ca này.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kỹ thuật viên</label>
                <select 
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700 appearance-none"
                >
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.specialty || 'KTV'})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setAssignTarget(null)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
                >
                  Bỏ qua
                </button>
                <button 
                  disabled={!selectedTech}
                  onClick={() => updateStatus(assignTarget, 'confirmed', selectedTech)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
                >
                  Xác nhận ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
