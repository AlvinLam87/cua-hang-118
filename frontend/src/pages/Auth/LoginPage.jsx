import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_V1_URL } from '../../utils/api.js';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_V1_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
      } else {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Chuyển hướng tức thì dựa trên vai trò
        if (data.data.user.role === 'admin') {
          window.location.href = '/admin';
        } else if (data.data.user.role === 'technician') {
          window.location.href = '/ky-thuat-vien';
        } else {
          window.location.href = '/';
        }
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-10 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute -top-10 -left-20 w-96 h-96 bg-blue-300/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-16 -right-12 w-96 h-96 bg-indigo-300/25 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="hidden lg:flex rounded-[32px] bg-linear-to-br from-[#0f172a] via-[#1e3a8a] to-[#312e81] text-white p-9 border border-white/10 shadow-[0_30px_80px_-30px_rgba(30,58,138,0.6)] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue-100/90 font-bold mb-4">Welcome Back</p>
            <h2 className="text-[34px] font-black leading-tight">Đăng nhập để tiếp tục quản lý thiết bị và lịch hẹn.</h2>
            <p className="text-blue-100/85 text-sm mt-4 leading-relaxed">
              Theo dõi tiến độ sửa chữa minh bạch, quản lý đơn hàng và nhận hỗ trợ kỹ thuật nhanh trong cùng một tài khoản.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Tra cứu trạng thái sửa chữa theo thời gian thực</div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Lịch sử đơn hàng và lịch hẹn tập trung một nơi</div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Bảo mật tài khoản theo chuẩn nội bộ 118</div>
          </div>
        </div>

        <div className="w-full max-w-md lg:max-w-none mx-auto flex items-center">
          <div className="w-full lux-card rounded-[30px] p-8 border border-white/50 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.35)]">
            <div className="text-center mb-7">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="w-11 h-11 bg-linear-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25">
                  <Wrench className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tight text-gray-900">Cửa Hàng 118</span>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Đăng nhập</h1>
              <p className="text-gray-500 text-sm mt-2">Nhập thông tin tài khoản để tiếp tục.</p>
            </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all text-gray-800"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
                <Link to="/quen-mat-khau" className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/90 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Đăng Nhập
                </>
              )}
            </button>
          </form>

          {/* Register link */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/dang-ky" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
            <p className="mt-3 text-center text-xs text-gray-400">Bằng việc đăng nhập, bạn đồng ý với chính sách bảo mật của Cửa Hàng 118.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
