import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, Search, X, Loader2, Save, User, Mail, PhoneCall, Lock, ShieldCheck, Briefcase, CalendarRange, Wrench, Sparkles, ImagePlus } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/media.js';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';

const AdminTechniciansPage = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password_hash: '',
    avatar_url: '',
    position: '',
    gender: '',
    age: '',
    specialty: '',
    experience_years: '',
    skills: ''
  });

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/v1/admin/technicians', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setTechnicians(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        full_name: item.full_name,
        email: item.email,
        phone: item.phone || '',
        password_hash: '', // leave blank for edit
        avatar_url: item.avatar_url || '',
        position: item.position || '',
        gender: item.gender || '',
        age: item.age ?? '',
        specialty: item.specialty || '',
        experience_years: item.experience_years ?? '',
        skills: item.skills || ''
      });
    } else {
      setEditItem(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password_hash: '',
        avatar_url: '',
        position: '',
        gender: '',
        age: '',
        specialty: '',
        experience_years: '',
        skills: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editItem 
        ? `/api/v1/admin/technicians/${editItem.id}` 
        : `/api/v1/admin/technicians`;
      const method = editItem ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      payload.age = (payload.age === '' || payload.age === null) ? null : Number(payload.age);
      payload.experience_years = (payload.experience_years === '' || payload.experience_years === null) ? null : Number(payload.experience_years);
      if (payload.gender === '') payload.gender = null;

      if (editItem && !payload.password_hash) {
        delete payload.password_hash;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        fetchTechnicians();
        handleCloseModal();
        showMessage('success', editItem ? 'Cập nhật kỹ thuật viên thành công.' : 'Thêm kỹ thuật viên thành công.');
      } else {
        showMessage('error', data.message || 'Lỗi lưu thông tin');
      }
    } catch (err) {
      showMessage('error', 'Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const res = await fetch('/api/v1/admin/technicians/upload-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body,
      });
      const data = await res.json();
      if (!data.success) {
        showMessage('error', data.message || 'Upload ảnh thất bại.');
        return;
      }
      setFormData((prev) => ({ ...prev, avatar_url: data.data.avatar_url }));
    } catch {
      showMessage('error', 'Lỗi kết nối khi upload ảnh.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/v1/admin/technicians/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setTechnicians(prev => prev.filter(t => t.id !== id));
        showMessage('success', 'Đã xóa kỹ thuật viên.');
      } else {
        showMessage('error', data.message || 'Lỗi xóa KTV');
      }
    } catch (err) {
      showMessage('error', 'Lỗi xóa KTV');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = useMemo(() => technicians.filter(t =>
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [technicians, searchTerm]);

  const summary = useMemo(() => {
    const total = technicians.length;
    const hasProfile = technicians.filter((t) => t.specialty || t.skills).length;
    const active = technicians.filter((t) => t.is_active !== false).length;
    return { total, hasProfile, active };
  }, [technicians]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedTechnicians = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, technicians.length]);

  return (
    <div className="space-y-6">
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kỹ Thuật Viên</h1>
            <p className="text-sm text-gray-500">Quản lý đội ngũ kỹ thuật viên</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" /> Thêm KTV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3">
          <p className="text-xs text-blue-700 font-semibold">Tổng kỹ thuật viên</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3">
          <p className="text-xs text-emerald-700 font-semibold">Đang hoạt động</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{summary.active}</p>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-linear-to-r from-violet-50 to-indigo-50 px-4 py-3">
          <p className="text-xs text-violet-700 font-semibold">Đã có hồ sơ chuyên môn</p>
          <p className="text-2xl font-black text-violet-900 mt-1">{summary.hasProfile}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo Tên, SĐT, Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="px-3 py-2.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl whitespace-nowrap">
          Kết quả: {filtered.length} KTV
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-auto max-h-[68vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">KTV</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Họ và Tên</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Email</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Số Điện Thoại</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Hồ sơ chuyên môn</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy kỹ thuật viên nào.
                  </td>
                </tr>
              ) : (
                pagedTechnicians.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        {t.avatar_url ? (
                          <img 
                            src={resolveMediaUrl(t.avatar_url)} 
                            alt={t.full_name} 
                            className="w-full h-full object-cover" 
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full items-center justify-center text-gray-400"
                          style={{ display: t.avatar_url ? 'none' : 'flex' }}
                        >
                          <User className="w-5 h-5" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-900">{t.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-gray-800">{t.position || 'Kỹ thuật viên'}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{t.specialty || t.skills || 'Chưa cập nhật chuyên môn'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(t)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(t.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-blue-50">
            <div className="p-5 border-b border-gray-100 bg-linear-to-r from-blue-50/60 via-white to-indigo-50/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    {editItem ? 'Sửa Thông Tin KTV' : 'Thêm Kỹ Thuật Viên'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {editItem ? 'Cập nhật hồ sơ kỹ thuật viên trong hệ thống quản trị.' : 'Tạo tài khoản kỹ thuật viên để nhận đơn và cập nhật tiến độ.'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 font-medium">
                  Thông tin đăng nhập nên đặt theo chuẩn nội bộ để dễ quản lý và đảm bảo bảo mật tài khoản.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 bg-white grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và Tên *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="ktv@cuahang118.vn"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0704.818.118"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ảnh đại diện</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                    {formData.avatar_url ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <img 
                          src={resolveMediaUrl(formData.avatar_url)} 
                          alt="Avatar preview" 
                          className="w-full h-full object-cover" 
                          loading="lazy" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden items-center justify-center w-full h-full text-gray-300">
                          <User className="w-8 h-8" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <ImagePlus className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.avatar_url}
                      readOnly
                      placeholder="Chưa có ảnh đại diện"
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl outline-none transition-all text-gray-500"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 cursor-pointer transition-colors whitespace-nowrap">
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    {uploadingAvatar ? 'Đang tải...' : 'Tải từ máy'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
              </div>
              <div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chức vụ</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      placeholder="VD: Trưởng nhóm kỹ thuật"
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tuổi</label>
                  <div className="relative">
                    <CalendarRange className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="18"
                      max="80"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      placeholder="VD: 28"
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kinh nghiệm (năm)</label>
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                      placeholder="VD: 5"
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chuyên môn chính</label>
                <div className="relative">
                  <Wrench className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    placeholder="VD: Sửa laptop / mainboard / camera IP"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kỹ năng / chứng chỉ</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  placeholder="VD: Cisco CCNA, Hikvision, Mikrotik, Data Recovery"
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Mật khẩu {editItem && '(Để trống nếu không đổi)'} {!editItem && '*'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="password" 
                    value={formData.password_hash}
                    onChange={(e) => setFormData({...formData, password_hash: e.target.value})}
                    required={!editItem}
                    placeholder={editItem ? 'Giữ trống để không thay đổi mật khẩu' : 'Nhập mật khẩu đăng nhập'}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="pt-3 flex gap-3 md:col-span-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/25"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa kỹ thuật viên"
        message="Bạn có chắc muốn xóa kỹ thuật viên này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
      />
    </div>
  );
};

export default AdminTechniciansPage;
