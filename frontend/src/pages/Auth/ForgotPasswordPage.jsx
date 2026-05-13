import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, ArrowLeft, Send, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { API_V1_URL } from '../../utils/api.js';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_V1_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-10 px-4 sm:px-6 bg-transparent relative overflow-hidden">
      <div className="absolute top-40 left-20 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-25 pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-25 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="hidden lg:flex rounded-[32px] bg-linear-to-br from-[#0f172a] via-[#0c4a6e] to-[#1e3a8a] text-white p-9 border border-white/10 shadow-[0_30px_80px_-30px_rgba(14,116,144,0.6)] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/90 font-bold mb-4">Password Recovery</p>
            <h2 className="text-[34px] font-black leading-tight">Khôi phục mật khẩu an toàn chỉ trong vài phút.</h2>
            <p className="text-cyan-100/85 text-sm mt-4 leading-relaxed">
              Hệ thống gửi hướng dẫn đặt lại mật khẩu qua email để bạn truy cập lại tài khoản nhanh và bảo mật.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Liên kết đặt lại có thời hạn bảo mật</div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Không tiết lộ thông tin tài khoản nhạy cảm</div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">Có thể yêu cầu gửi lại nếu chưa nhận email</div>
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
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Quên Mật Khẩu?</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email đăng ký</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="email@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all text-gray-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gửi Yêu Cầu
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
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Yêu Cầu Đã Gửi!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                Nếu email <span className="font-semibold text-gray-700">{email}</span> tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                Vui lòng kiểm tra hộp thư đến (và thư mục Spam) của bạn.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
              >
                Gửi lại yêu cầu
              </button>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-8 text-center">
            <Link to="/dang-nhap" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Quay lại Đăng nhập
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-gray-400">Yêu cầu đặt lại mật khẩu được xử lý theo chuẩn bảo mật nội bộ.</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
