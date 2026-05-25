import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, QrCode, Loader2, Clock, History } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createAppSocket } from '../../utils/socket.js';
import { useOrderPaymentPoll } from '../../hooks/useOrderPaymentPoll.js';
import { claimBankTransfer } from '../../utils/claimBankTransfer.js';

const formatPrice = (n) => (n != null ? Number(n).toLocaleString('vi-VN') : '0') + 'đ';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const paymentMethod = location.state?.paymentMethod;
  const totalAmount = location.state?.totalAmount;
  const guestPhone = location.state?.guestPhone;
  const [mounted, setMounted] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const confettiFired = useRef(false);

  const isBankTransfer = paymentMethod === 'bank_transfer';
  const isCod = paymentMethod === 'cod';
  const isPaidView = isCod || paymentConfirmed;

  const resolvedPhone = guestPhone || (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.phone || '';
    } catch {
      return '';
    }
  })();

  useOrderPaymentPoll({
    orderId,
    guestPhone: resolvedPhone,
    enabled: isBankTransfer && !!orderId && !!resolvedPhone && !paymentConfirmed,
    onPaid: () => setPaymentConfirmed(true),
  });

  const handleClaimTransfer = async () => {
    if (!orderId || !resolvedPhone || claimLoading) return;
    setClaimLoading(true);
    setClaimMessage('');
    try {
      const { ok, data } = await claimBankTransfer(orderId, resolvedPhone);
      if (ok && data.data?.payment_status === 'paid') {
        setPaymentConfirmed(true);
        setClaimMessage(data.message || 'Đã ghi nhận thanh toán.');
      } else if (ok) {
        setClaimMessage(
          data.message ||
            'Đã ghi nhận. Nếu quá 5 phút vẫn chưa xác nhận, liên hệ cửa hàng hoặc thử lại sau.'
        );
      } else {
        setClaimMessage(data.message || 'Không gửi được yêu cầu. Thử lại sau.');
      }
    } catch {
      setClaimMessage('Lỗi kết nối. Kiểm tra mạng và thử lại.');
    } finally {
      setClaimLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      navigate('/cua-hang', { replace: true });
      return;
    }
    setMounted(true);
  }, [orderId, navigate]);

  useEffect(() => {
    if (!isPaidView || confettiFired.current) return;
    confettiFired.current = true;

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [isPaidView]);

  useEffect(() => {
    if (!isBankTransfer || !orderId || paymentConfirmed) return;

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
  }, [isBankTransfer, orderId, paymentConfirmed]);

  if (!orderId) return null;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div
        className={`max-w-lg w-full lux-card rounded-3xl p-8 text-center transform transition-all duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${
            isPaidView ? 'bg-green-100' : 'bg-amber-100'
          }`}
        >
          {isPaidView ? (
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          ) : (
            <Clock className="w-12 h-12 text-amber-600" />
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          {isPaidView ? 'Đặt Hàng Thành Công!' : 'Đơn Hàng Đã Tạo — Chờ Thanh Toán'}
        </h1>
        <p className="text-gray-500 mb-6">
          {isPaidView
            ? 'Cảm ơn bạn đã thanh toán. Cửa Hàng 118 sẽ xử lý và giao hàng sớm nhất.'
            : 'Vui lòng quét mã VietQR và chuyển khoản. Hệ thống tự xác nhận — không cần bấm thêm nút nào.'}
        </p>

        <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
          <p className="text-sm font-semibold text-blue-900 flex items-center justify-center gap-2">
            <Package className="w-4 h-4" /> Mã đơn hàng: <span className="text-lg text-blue-700">#{orderId}</span>
          </p>
        </div>

        {isBankTransfer && !paymentConfirmed && (
          <div className="bg-white rounded-2xl p-5 mb-6 border-2 border-amber-200 shadow-md text-left">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2 justify-center">
              <QrCode className="w-5 h-5 text-amber-600" /> Quét mã chuyển khoản
            </h3>
            <div className="flex justify-center mb-4">
              <img
                src={`https://img.vietqr.io/image/VPB-0839280494-compact2.png?amount=${totalAmount}&addInfo=DH${orderId}&accountName=LAM DIEN`}
                alt="VietQR"
                className="w-52 h-52 object-contain rounded-xl border border-gray-100 p-2 bg-white mx-auto"
              />
            </div>
            <div className="text-sm bg-amber-50/80 p-4 rounded-xl border border-amber-100 space-y-2">
              <p className="flex justify-between">
                <span className="text-gray-500">Số tiền</span>
                <span className="font-bold text-rose-600">{formatPrice(totalAmount)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Nội dung CK</span>
                <span className="font-bold bg-yellow-100 text-amber-900 px-2 py-0.5 rounded">DH{orderId}</span>
              </p>
              <p className="text-xs text-amber-800 pt-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Đang chờ ngân hàng xác nhận (thường 1–3 phút)...
              </p>
            </div>
            <button
              type="button"
              onClick={handleClaimTransfer}
              disabled={claimLoading}
              className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {claimLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang gửi...
                </>
              ) : (
                'Tôi đã chuyển khoản'
              )}
            </button>
            {claimMessage && (
              <p className="text-xs text-center text-emerald-800 mt-2 font-medium">{claimMessage}</p>
            )}
            <p className="text-xs text-center text-gray-500 mt-3">
              Chưa thanh toán? Đơn sẽ hiển thị <strong>Chờ thanh toán</strong> trong{' '}
              <Link to="/lich-su-don-hang" className="text-blue-600 font-bold hover:underline">
                Lịch sử đơn hàng
              </Link>
              .
            </p>
          </div>
        )}

        {isBankTransfer && paymentConfirmed && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">
            Đã nhận thanh toán chuyển khoản — đơn đang được xử lý.
          </div>
        )}

        {isCod && (
          <div className="bg-emerald-50 rounded-2xl p-4 mb-8 border border-emerald-100">
            <p className="text-sm text-emerald-800 font-medium">
              Bạn đã chọn <span className="font-bold">Thanh toán khi nhận hàng (COD)</span>.
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Vui lòng chuẩn bị {formatPrice(totalAmount)} khi shipper giao hàng.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {!isPaidView && (
            <Link
              to="/lich-su-don-hang"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <History className="w-5 h-5" /> Xem đơn treo trong hồ sơ
            </Link>
          )}
          <Link
            to="/cua-hang"
            className="w-full py-3.5 lux-button font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Tiếp tục mua sắm <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/"
            className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200"
          >
            <Home className="w-5 h-5" /> Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
