import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, QrCode, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createAppSocket } from '../../utils/socket.js';

const OrderSuccessPage = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const paymentMethod = location.state?.paymentMethod;
  const totalAmount = location.state?.totalAmount;
  const [mounted, setMounted] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Bắn pháo hoa 🎆
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (paymentMethod !== 'bank_transfer' || !orderId) return;

    const socket = createAppSocket();
    const onPaid = (data) => {
      if (data?.type !== 'order') return;
      if (Number(data.id) !== Number(orderId)) return;
      if (data.payment_status === 'paid' || data.action === 'payment') {
        setPaymentConfirmed(true);
      }
    };

    socket.on('data_changed', onPaid);
    socket.on('new_product_order', onPaid);
    return () => socket.disconnect();
  }, [paymentMethod, orderId]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className={`max-w-md w-full lux-card rounded-3xl p-8 text-center transform transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Đặt Hàng Thành Công!</h1>
        <p className="text-gray-500 mb-6">
          Cảm ơn bạn đã mua hàng tại Cửa Hàng 118. Chúng tôi sẽ sớm liên hệ để xác nhận đơn hàng của bạn.
        </p>

        {orderId && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
            <p className="text-sm font-semibold text-blue-900 flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> Mã đơn hàng: <span className="text-lg text-blue-700">#{orderId}</span>
            </p>
          </div>
        )}

        {paymentMethod === 'bank_transfer' && orderId && (
          <div className="bg-white rounded-2xl p-5 mb-8 border border-gray-200 shadow-md">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2 justify-center">
              <QrCode className="w-5 h-5 text-blue-600" /> Quét mã để thanh toán
            </h3>
            <div className="flex justify-center mb-4">
              <img 
                src={`https://img.vietqr.io/image/vpbank-0839280494-compact.png?amount=${totalAmount}&addInfo=DH${orderId}%20Thanh%20toan&accountName=LAM%20DIEN`} 
                alt="VietQR" 
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl border border-gray-100 p-2 bg-white"
              />
            </div>
            <div className="text-sm text-left bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
              <p className="flex justify-between"><span className="text-gray-500">Ngân hàng:</span> <span className="font-bold text-gray-900">VPBank</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Số tài khoản:</span> <span className="font-bold text-blue-700">0839280494</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Chủ tài khoản:</span> <span className="font-bold text-gray-900">LAM DIEN</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Số tiền:</span> <span className="font-bold text-red-600">{totalAmount?.toLocaleString('vi-VN')}đ</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Nội dung CK:</span> <span className="font-bold bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">DH{orderId} Thanh toan</span></p>
            </div>
            {paymentConfirmed ? (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Đã nhận thanh toán — đơn hàng đang được xử lý
              </div>
            ) : (
              <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang chờ xác nhận chuyển khoản (thường 1–3 phút)...
              </p>
            )}
          </div>
        )}

        {paymentMethod === 'cod' && (
          <div className="bg-emerald-50 rounded-2xl p-4 mb-8 border border-emerald-100">
            <p className="text-sm text-emerald-800 font-medium">Bạn đã chọn <span className="font-bold">Thanh toán khi nhận hàng (COD)</span>.</p>
            <p className="text-xs text-emerald-600 mt-1">Vui lòng chuẩn bị {totalAmount?.toLocaleString('vi-VN')}đ để thanh toán khi shipper giao hàng.</p>
          </div>
        )}

        <div className="space-y-3">
          <Link to="/cua-hang" className="w-full py-3.5 lux-button font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            Tiếp tục mua sắm <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/" className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200">
            <Home className="w-5 h-5" /> Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
