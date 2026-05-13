import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, Lock, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { API_V1_URL } from '../../utils/api.js';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Đường dẫn không hợp lệ hoặc thiếu mã xác nhận (token).');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_V1_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/dang-nhap'), 3000);
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-10 px-4 sm:px-6 bg-transparent relative overflow-hidden">
      <div className="absolute top-40 left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-25 pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-25 pointer-events-none" />

      <div className="max-w-md mx-auto relative z-10 flex flex-col">
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
          {!success ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Đặt Mật Khẩu Mới</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      disabled={!token}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      disabled={!token}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all text-gray-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Cập Nhật Mật Khẩu
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Đổi Mật Khẩu Thành Công!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Mật khẩu của bạn đã được cập nhật. Hệ thống sẽ tự động chuyển hướng đến trang đăng nhập trong vài giây...
              </p>
              <Link
                to="/dang-nhap"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Đăng Nhập Ngay
              </Link>
            </div>
          )}

          {/* Back to login */}
          {!success && (
            <div className="mt-8 text-center">
              <Link to="/dang-nhap" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                <ArrowLeft className="w-4 h-4" />
                Quay lại Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
