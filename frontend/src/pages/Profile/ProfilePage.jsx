import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ProfileSidebar from './ProfileSidebar';
import { User, Mail, Phone, MapPin, Shield, Save, Loader2, CheckCircle2, AlertCircle, Package, CalendarDays, Settings, ShieldCheck } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/dang-nhap');

        const res = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          setUser(data.data);
          setForm({
            full_name: data.data.full_name || '',
            phone: data.data.phone || '',
            address: data.data.address || '',
          });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/dang-nhap');
        }
      } catch (err) {
        console.error('Lỗi tải thông tin user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Có lỗi xảy ra.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-[#f6f8ff]"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div>;
  if (!user) return null;

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
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Thông Tin Liên Hệ</h2>
                <p className="text-gray-500 text-sm">Cập nhật thông tin để chúng tôi hỗ trợ bạn tốt nhất.</p>
              </div>
              <div className="hidden sm:flex w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
            </div>

            {message.text && (
              <div className={`mb-8 p-5 rounded-2xl flex items-center gap-4 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Họ và Tên</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <input type="text" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" placeholder="Nguyễn Văn A" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Số Điện Thoại</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Phone className="h-5 w-5" />
                    </div>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" placeholder="Chưa cập nhật" />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2.5 md:col-span-2">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Địa Chỉ Liên Hệ</label>
                  <div className="relative group">
                    <div className="absolute top-4 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <textarea rows="3" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none leading-relaxed" placeholder="Nhập địa chỉ của bạn để tiện giao hàng và sửa chữa tận nơi..." />
                  </div>
                </div>
              </div>

              {/* Secure Info Alert */}
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex gap-4 items-start">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-emerald-900 font-bold text-sm tracking-wide">Bảo mật dữ liệu tuyệt đối</h4>
                  <p className="text-emerald-700 text-sm mt-1 leading-relaxed">Thông tin của bạn được mã hóa an toàn và chỉ sử dụng cho mục đích liên hệ dịch vụ nội bộ của Cửa Hàng 118.</p>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="submit" disabled={saving} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-blue-600/40 disabled:opacity-50 disabled:hover:translate-y-0">
                  {saving ? (<><Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...</>) : (<><Save className="w-5 h-5" /> Lưu Thay Đổi</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
