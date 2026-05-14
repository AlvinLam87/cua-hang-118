import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, User, Phone, UserPlus, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { API_V1_URL } from '../../utils/api.js';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleOtpChange = (e) => {
    const sanitized = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(sanitized);
    setError('');
  };

  const requestOtp = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_V1_URL}/auth/register/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Không thể gửi mã xác nhận.');
      } else {
        setOtpRequested(true);
        setSuccess(data.message || 'Đã gửi mã xác nhận 6 số. Vui lòng kiểm tra và nhập mã OTP.');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async (e) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã xác nhận 6 số.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_V1_URL}/auth/register/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otpCode,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Xác minh OTP thất bại.');
      } else {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setSuccess('Đăng ký thành công! Đang chuyển hướng...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 bg-transparent relative overflow-hidden flex items-center justify-center">
      {/* Background Orbs */}
      <div className="absolute top-20 right-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float pointer-events-none" />
      <div className="absolute bottom-20 left-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float pointer-events-none" style={{ animationDelay: '-3s' }} />

      <div className="max-w-6xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Info Column */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
              <UserPlus className="w-3 h-3" /> Join Our Community
            </div>
            <h2 className="text-5xl font-black leading-tight text-gray-900 mb-6">
              Quản lý thiết bị <br />
              <span className="text-gradient">Thông minh & Chuyên nghiệp</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              Tạo tài khoản để theo dõi tiến độ sửa chữa, lưu lịch sử thiết bị và nhận các ưu đãi dành riêng cho thành viên Cửa Hàng 118.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Wrench, text: "Theo dõi tiến độ sửa chữa thời gian thực" },
              { icon: Mail, text: "Nhận thông báo qua Email & Hệ thống" },
              { icon: Lock, text: "Bảo mật thông tin & Lịch sử dịch vụ" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 glass rounded-2xl hover:scale-105 transition-transform cursor-default">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Form Column */}
        <div className="w-full max-w-lg mx-auto">
          <div className="lux-card rounded-[40px] p-8 md:p-10 border border-white/60 relative overflow-hidden">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Đăng ký</h1>
              <p className="text-gray-500 font-medium">Bắt đầu hành trình của bạn ngay hôm nay</p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50/80 border border-red-100 rounded-2xl text-red-700 text-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> 
                <span className="font-medium">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl text-emerald-700 text-sm animate-fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> 
                <span className="font-medium">{success}</span>
              </div>
            )}

            <form onSubmit={verifyOtpAndRegister} className="space-y-5">
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Họ và tên</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-12 pr-4 py-3.5 premium-input rounded-2xl outline-none text-gray-800 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full pl-12 pr-4 py-3.5 premium-input rounded-2xl outline-none text-gray-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Số điện thoại</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0901 234 567"
                    className="w-full pl-12 pr-4 py-3.5 premium-input rounded-2xl outline-none text-gray-800 font-medium"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Mật khẩu</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 premium-input rounded-2xl outline-none text-gray-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Xác nhận</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 premium-input rounded-2xl outline-none text-gray-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {!otpRequested && (
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={loading}
                  className="w-full py-4 mt-4 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_12px_24px_-8px_rgba(37,99,235,0.5)] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Gửi mã xác nhận
                    </>
                  )}
                </button>
              )}

              {otpRequested && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 space-y-3">
                  <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" /> Nhập mã OTP 6 số để hoàn tất đăng ký
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={handleOtpChange}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 text-center tracking-[0.35em] text-lg font-bold bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-60"
                    >
                      Xác minh và tạo tài khoản
                    </button>
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={loading}
                      className="w-full py-3 bg-white border border-blue-200 hover:border-blue-300 text-blue-700 font-semibold rounded-xl transition-all disabled:opacity-60"
                    >
                      Gửi lại mã
                    </button>
                  </div>
                </div>
              )}
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <Link to="/dang-nhap" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                Đăng nhập
              </Link>
            </p>
            <p className="mt-3 text-center text-xs text-gray-400">Đăng ký đồng nghĩa bạn chấp nhận điều khoản dịch vụ của Cửa Hàng 118.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
