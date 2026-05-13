import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSidebar from './ProfileSidebar';
import { Loader2, CheckCircle2, AlertCircle, CreditCard, Gift, Ticket, Copy, Award, Info } from 'lucide-react';

const PointsExchangePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [vouchers, setVouchers] = useState([]); // Mã của tôi
  const [availableVouchers, setAvailableVouchers] = useState([]); // Mã có thể đổi
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('token');
      const [myRes, availableRes] = await Promise.all([
        fetch('/api/v1/auth/my-vouchers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/auth/available-exchange-vouchers', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const myData = await myRes.json();
      const availableData = await availableRes.json();

      if (myData.success) setVouchers(myData.data);
      if (availableData.success) setAvailableVouchers(availableData.data);
    } catch (err) {
      console.error('Lỗi tải voucher:', err);
    }
  };

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
          fetchVouchers();
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/dang-nhap');
        }
      } catch (err) {
        console.error('Lỗi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleExchangePoints = async (v) => {
    if ((user.points || 0) < v.points_required) {
      setMessage({ type: 'error', text: `Bạn cần tối thiểu ${v.points_required} điểm để đổi mã này.` });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn dùng ${v.points_required} điểm để đổi mã giảm giá ${Number(v.value).toLocaleString('vi-VN')}đ không?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/auth/exchange-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ voucherId: v.id })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Đổi thành công! Mã giảm giá: ${data.data.voucherCode}` });
        setUser({ ...user, points: data.data.remainingPoints });
        fetchVouchers();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi khi đổi điểm.' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-[#f6f8ff]"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="bg-[#f6f8ff] min-h-screen pb-20 pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">

        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Đổi Điểm Thưởng</h1>
          <p className="text-gray-500 text-lg">Đổi điểm tích lũy lấy các mã giảm giá hấp dẫn.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <ProfileSidebar user={user} />

          <div className="flex-1 flex flex-col gap-8 w-full">

            {/* Thông báo */}
            {message.text && (
              <div className={`p-5 rounded-2xl flex items-center gap-4 text-sm font-bold animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> : <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />}
                {message.text}
              </div>
            )}

            {/* Header Điểm hiện tại */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-600/20 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 text-center sm:text-left">
                <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">Số điểm bạn đang có</p>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <Award className="w-10 h-10 text-amber-400 fill-amber-400/20" />
                  <h2 className="text-5xl font-black">{user.points || 0} <span className="text-xl font-bold text-blue-200">điểm</span></h2>
                </div>
              </div>
              <div className="relative z-10 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                <p className="text-xs font-bold text-blue-100 italic">Mỗi 100k thanh toán = 1 điểm tích lũy</p>
              </div>
            </div>

            {/* Danh sách các gói đổi thưởng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableVouchers.map(v => (
                <div key={v.id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-blue-900/5 hover:border-blue-200 hover:shadow-blue-900/10 transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 group-hover:bg-blue-100 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Gift className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-lg leading-tight">Giảm {Number(v.value).toLocaleString('vi-VN')}đ</h3>
                        <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">
                          <Ticket className="w-3 h-3" /> Đơn từ {Number(v.min_order_value).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                      Đổi <b>{v.points_required} điểm</b> lấy mã giảm giá này. Hạn sử dụng 30 ngày kể từ lúc đổi.
                    </p>
                  </div>

                  <button
                    onClick={() => handleExchangePoints(v)}
                    disabled={(user.points || 0) < v.points_required}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                      (user.points || 0) >= v.points_required
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {(user.points || 0) >= v.points_required ? (
                      <><CreditCard className="w-4 h-4" /> Đổi {v.points_required} Điểm</>
                    ) : (
                      <><AlertCircle className="w-4 h-4" /> Cần thêm {v.points_required - (user.points || 0)} điểm</>
                    )}
                  </button>
                </div>
              ))}

              {availableVouchers.length === 0 && (
                <div className="md:col-span-2 bg-gray-50 rounded-[32px] p-12 text-center border border-dashed border-gray-200">
                  <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">Hiện chưa có chương trình đổi thưởng nào từ Admin.</p>
                  <p className="text-gray-400 text-sm mt-1">Vui lòng quay lại sau nhé!</p>
                </div>
              )}
            </div>

            {/* Danh sách voucher của tôi */}
            <div className="bg-white rounded-[40px] p-8 sm:p-10 border border-gray-100 shadow-2xl shadow-blue-900/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-600" /> Mã Giảm Giá Của Tôi
                </h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{vouchers.length} mã</span>
              </div>

              {vouchers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-semibold">Bạn chưa có mã giảm giá nào.</p>
                  <p className="text-gray-400 text-sm mt-1">Hãy tích lũy điểm và đổi thưởng nhé!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vouchers.map((v, idx) => {
                    const isUsed = v.used_count > 0;
                    const isExpired = v.expiry_date && new Date(v.expiry_date) < new Date();
                    const isInactive = isUsed || isExpired;

                    return (
                      <div key={v.id || idx} className={`relative p-5 rounded-2xl border flex items-center gap-4 transition-all ${isInactive ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-blue-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5'}`}>
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${isInactive ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                          %
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-gray-900 tracking-wider uppercase text-sm">{v.code}</span>
                            {isUsed && <span className="text-[9px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">ĐÃ DÙNG</span>}
                            {!isUsed && isExpired && <span className="text-[9px] font-bold bg-red-100 text-red-500 px-2 py-0.5 rounded-full">HẾT HẠN</span>}
                          </div>
                          <p className="text-sm font-bold text-blue-600">Giảm {Number(v.value).toLocaleString('vi-VN')}đ</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            HSD: {new Date(v.expiry_date).toLocaleDateString('vi-VN')}
                            {v.min_order_value > 0 && ` • Đơn tối thiểu ${Number(v.min_order_value).toLocaleString('vi-VN')}đ`}
                          </p>
                        </div>

                        {/* Copy button */}
                        {!isInactive && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(v.code);
                              setMessage({ type: 'success', text: `Đã sao chép mã ${v.code}!` });
                              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                            }}
                            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" /> Sao chép
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hướng dẫn */}
            <div className="bg-white rounded-[40px] p-8 sm:p-10 border border-gray-100 shadow-2xl shadow-blue-900/5">
              <h4 className="text-sm font-black text-gray-900 mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hướng dẫn tích điểm & đổi thưởng
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 font-medium leading-relaxed">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</div>
                  <p>Mua hàng hoặc sử dụng dịch vụ sửa chữa tại Cửa Hàng 118 để tích điểm tự động.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</div>
                  <p>Cứ mỗi 100.000đ thanh toán, bạn nhận được 1 điểm thưởng.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</div>
                  <p>Đổi điểm tích lũy lấy các mã giảm giá hấp dẫn ngay tại trang này.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">4</div>
                  <p>Nhập mã voucher khi thanh toán đơn hàng linh kiện để được giảm giá.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsExchangePage;
