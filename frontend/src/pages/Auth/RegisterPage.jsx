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
        // Chuyển hướng tức thì như bạn yêu cầu
        window.location.href = '/';
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-10 px-4 sm:px-6 bg-transparent relative overflow-hidden">
      <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="hidden lg:flex rounded-[32px] bg-linear-to-br from-[#1e1b4b] via-blue-700 to-[#0f766e] text-white p-9 border border-white/10 shadow-[0_30px_80px_-30px_rgba(30,64,175,0.6)] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-100/90 font-bold mb-4">Create Account</p>
            <h2 className="text-[34px] font-black leading-tight">Bắt đầu quản lý lịch hẹn và đơn sửa chữa chuyên nghiệp hơn.</h2>
            <p className="text-indigo-100/85 text-sm mt-4 leading-relaxed">
              Tạo tài khoản miễn phí để lưu thông tin thiết bị, nhận ưu đãi thành viên và theo dõi toàn bộ tiến độ xử lý.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Đồng bộ lịch hẹn theo tài khoản</div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Lưu lịch sử sửa chữa rõ ràng theo từng thiết bị</div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Nhận thông báo trạng thái nhanh qua hệ thống</div>
          </div>
        </div>

        <div className="w-full max-w-md lg:max-w-none mx-auto flex flex-col">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-900/20">
                <Wrench className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-gray-900">Cửa Hàng 118</span>
            </Link>
          </div>

          {/* Card */}
          <div className="w-full lux-card rounded-[30px] p-8 border border-white/50 shadow-[0_24px_60px_-28px_rgba(37,99,235,0.35)]">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Tạo tài khoản</h1>
              <p className="text-gray-500 text-sm">Đăng ký nhanh trong vài bước để bắt đầu sử dụng dịch vụ.</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" /> <span>{error}</span>
              </div>
            )}


            <form onSubmit={verifyOtpAndRegister} className="space-y-4">
              {/* Full Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all text-gray-800"
                    />
                  </div>
                </div>

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
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0901 234 567"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all text-gray-800"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Tối thiểu 8 ký tự"
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {!otpRequested && (
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={loading}
                  className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6 shadow-lg shadow-blue-600/25"
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
