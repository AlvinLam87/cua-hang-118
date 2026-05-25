import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { 
  ArrowLeft, ShoppingCart, User, Phone, MapPin, 
  Trash2, Plus, Minus, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Truck, Lock, Building2, Map, CreditCard, Banknote, Ticket
} from 'lucide-react';
import ProductImage from '../../components/ProductImage.jsx';
import { normalizeProductImages } from '../../utils/media.js';
import { API_V1_URL } from '../../utils/api.js';

const formatPrice = (price) => price.toLocaleString('vi-VN') + 'đ';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    note: '',
    payment_method: 'cod'
  });

  const [addressData, setAddressData] = useState({
    provinceCode: '',
    provinceName: '',
    districtCode: '',
    districtName: '',
    wardCode: '',
    wardName: '',
    street: ''
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherData, setVoucherData] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [myVouchers, setMyVouchers] = useState([]);
  const [showVoucherList, setShowVoucherList] = useState(false);

  // Lấy danh sách Tỉnh/Thành ban đầu
  useEffect(() => {
    fetch('https://esgoo.net/api-tinhthanh/1/0.htm')
      .then(res => res.json())
      .then(res => {
        if (res.error === 0) setProvinces(res.data);
      })
      .catch(err => console.error("Error fetching provinces:", err));
  }, []);

  // Tính phí ship trực tiếp trong component render
  const calculateShippingFee = () => {
    if (!addressData.provinceCode) return 0;
    if (cartTotal >= 2000000) return 0;
    
    const p = addressData.provinceName.toLowerCase();
    if (p.includes('bạc liêu') || p.includes('cà mau')) {
      const d = addressData.districtName.toLowerCase();
      if (d.includes('thành phố') || d.includes('thị xã') || d.includes('tp')) return 15000;
      return 25000;
    }
    return 40000;
  };

  const handleCheckVoucher = async () => {
    if (!voucherCode) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch(`${API_V1_URL}/public/check-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode,
          amount: cartTotal,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setVoucherData(data.data);
        setVoucherError('');
      } else {
        setVoucherData(null);
        setVoucherError(data.message);
      }
    } catch (err) {
      setVoucherError('Lỗi kiểm tra mã.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const fetchMyVouchers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_V1_URL}/auth/my-vouchers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Chỉ lấy những mã chưa dùng và còn hạn
        const activeVouchers = data.data.filter(v => v.used_count === 0 && (!v.expiry_date || new Date(v.expiry_date) > new Date()));
        setMyVouchers(activeVouchers);
      }
    } catch (err) {
      console.error('Lỗi tải voucher của tôi:', err);
    }
  };

  const shippingFee = calculateShippingFee();
  const discountAmount = voucherData?.discountAmount || 0;
  const finalTotal = Math.max(0, cartTotal + shippingFee - discountAmount);

  // Auto fill if logged in
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      setIsLoggedIn(Boolean(token));
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        setForm(prev => ({
          ...prev,
          guest_name: user.full_name || '',
          guest_phone: user.phone || ''
        }));
        
        // Nếu muốn bóc tách chuỗi address cũ gán vào ô addressData.street thì làm thêm, tạm thời gán luôn vào street để khách tự sửa
        if (user.address) {
          setAddressData(prev => ({ ...prev, street: user.address }));
        }
        fetchMyVouchers();
      }
    } catch {}
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleStreetChange = (e) => setAddressData({ ...addressData, street: e.target.value });

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressData(prev => ({ 
      ...prev, provinceCode: code, provinceName: name, 
      districtCode: '', districtName: '', wardCode: '', wardName: '' 
    }));
    setDistricts([]);
    setWards([]);
    if (code) {
      fetch(`https://esgoo.net/api-tinhthanh/2/${code}.htm`)
        .then(res => res.json())
        .then(res => {
          if (res.error === 0) setDistricts(res.data);
        })
        .catch(err => console.error("Error fetching districts:", err));
    }
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressData(prev => ({ 
      ...prev, districtCode: code, districtName: name, 
      wardCode: '', wardName: '' 
    }));
    setWards([]);
    if (code) {
      fetch(`https://esgoo.net/api-tinhthanh/3/${code}.htm`)
        .then(res => res.json())
        .then(res => {
           if (res.error === 0) setWards(res.data);
        })
        .catch(err => console.error("Error fetching wards:", err));
    }
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressData(prev => ({ ...prev, wardCode: code, wardName: name }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return setError('Giỏ hàng của bạn đang trống.');
    if (!isLoggedIn) {
      setError('Bạn cần đăng nhập trước khi thanh toán.');
      return;
    }

    if (!addressData.provinceCode || !addressData.districtCode || !addressData.wardCode || !addressData.street) {
      setError('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã và nhập địa chỉ cụ thể.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const fullAddress = `${addressData.street}, ${addressData.wardName}, ${addressData.districtName}, ${addressData.provinceName}`;

      const payload = {
        ...form,
        shipping_address: fullAddress,
        shipping_fee: shippingFee,
        voucher_id: voucherData?.voucherId,
        discount_amount: discountAmount,
        items: cart.map(item => ({ id: item.id, qty: item.qty }))
      };

      const res = await fetch(`${API_V1_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        clearCart();
        navigate('/dat-hang-thanh-cong', {
          state: {
            orderId: data.data.order_id,
            paymentMethod: data.data.payment_method,
            totalAmount: data.data.total_amount,
            guestPhone: form.guest_phone,
          },
        });
      } else {
        setError(data.message || 'Có lỗi xảy ra khi đặt hàng.');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50/50 px-4">
        <ShoppingCart className="w-24 h-24 text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-8 text-center max-w-sm">
          Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá thêm các sản phẩm tuyệt vời của chúng tôi nhé!
        </p>
        <Link to="/cua-hang" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30">
          Khám phá thêm sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen pb-20">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white py-12 text-center">
        <div className="absolute -top-10 right-16 w-44 h-44 bg-blue-400/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-12 left-16 w-52 h-52 bg-indigo-500/20 blur-3xl rounded-full" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <Link to="/cua-hang" className="inline-flex items-center gap-2 text-sm text-indigo-200 hover:text-white transition mb-5 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Quay lại xem sản phẩm
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">
            Giỏ Hàng & Thanh Toán
          </h1>
          <p className="text-indigo-100/80">Hoàn tất thông tin để Cửa Hàng 118 giao hàng nhanh và an toàn.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left: Thông tin giao hàng */}
          <div className="w-full lg:w-2/3">
            <div className="lux-card rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_30px_70px_-32px_rgba(37,99,235,0.35)]">
              <div className="mb-6 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="text-blue-600 w-6 h-6" /> Thông tin giao hàng
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                  <Lock className="w-3.5 h-3.5" /> Bảo mật SSL
                </span>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}
              {!isLoggedIn && (
                <div className="mb-6 p-4 sm:p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 shadow-[0_12px_30px_-22px_rgba(245,158,11,0.7)]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold">Yêu cầu đăng nhập trước khi thanh toán</p>
                      <p className="text-xs sm:text-sm mt-1 text-amber-800/90">Đăng nhập để hoàn tất đơn hàng, theo dõi trạng thái và lưu lịch sử mua sắm.</p>
                    </div>
                    <div className="shrink-0">
                      <Link
                        to="/dang-nhap"
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition shadow-lg shadow-amber-500/20"
                      >
                        Đăng nhập ngay
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className={!isLoggedIn ? 'opacity-75 relative' : 'relative'}>
                {/* Overlay preventing clicks if not logged in */}
                {!isLoggedIn && <div className="absolute inset-0 z-10"></div>}
                
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-extrabold text-slate-800">Thông tin người nhận</p>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">Bắt buộc</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wide font-bold text-gray-500 mb-1.5">Họ và tên *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input type="text" name="guest_name" value={form.guest_name} onChange={handleChange} required className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all" placeholder="Nguyễn Văn A" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wide font-bold text-gray-500 mb-1.5">Số điện thoại *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input type="tel" name="guest_phone" value={form.guest_phone} onChange={handleChange} required className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all" placeholder="0704818118" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 sm:p-5">
                    <p className="text-sm font-extrabold text-slate-800 mb-4">Địa chỉ giao hàng</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Tỉnh / Thành phố */}
                      <div>
                        <label className="block text-xs uppercase tracking-wide font-bold text-gray-500 mb-1.5">Tỉnh / Thành phố *</label>
                        <div className="relative">
                          <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select 
                            required
                            value={addressData.provinceCode}
                            onChange={handleProvinceChange}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all appearance-none text-sm"
                          >
                            <option value="" disabled>Chọn Tỉnh / Thành</option>
                            {provinces.map(p => (
                              <option key={p.id} value={p.id}>{p.full_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Quận / Huyện */}
                      <div>
                        <label className="block text-xs uppercase tracking-wide font-bold text-gray-500 mb-1.5">Quận / Huyện *</label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select 
                            required
                            disabled={districts.length === 0}
                            value={addressData.districtCode}
                            onChange={handleDistrictChange}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all appearance-none text-sm disabled:opacity-50 disabled:bg-gray-50"
                          >
                            <option value="" disabled>Chọn Quận / Huyện</option>
                            {districts.map(d => (
                              <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Phường / Xã */}
                      <div>
                        <label className="block text-xs uppercase tracking-wide font-bold text-gray-500 mb-1.5">Phường / Xã *</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select 
                            required
                            disabled={wards.length === 0}
                            value={addressData.wardCode}
                            onChange={handleWardChange}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all appearance-none text-sm disabled:opacity-50 disabled:bg-gray-50"
                          >
                            <option value="" disabled>Chọn Phường / Xã</option>
                            {wards.map(w => (
                              <option key={w.id} value={w.id}>{w.full_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Số nhà, tên đường */}
                    <div>
                      <label className="block text-xs uppercase tracking-wide font-bold text-gray-500 mb-1.5">Số nhà, Tên đường *</label>
                      <input 
                        type="text" 
                        required
                        value={addressData.street}
                        onChange={handleStreetChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none transition-all" 
                        placeholder="Ví dụ: Số 55, Đường Cách Mạng" 
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 sm:p-5">
                    <p className="text-sm font-extrabold text-slate-800 mb-4">Phương thức thanh toán</p>
                    <div className="space-y-3">
                      {/* COD */}
                      <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.payment_method === 'cod' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                          <Banknote className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                          <p className="text-xs text-gray-500 mt-0.5">Thanh toán bằng tiền mặt khi giao hàng</p>
                        </div>
                        <div className="shrink-0">
                          <input type="radio" name="payment_method" value="cod" checked={form.payment_method === 'cod'} onChange={handleChange} className="w-5 h-5 text-blue-600" />
                        </div>
                      </label>

                      {/* Bank Transfer */}
                      <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.payment_method === 'bank_transfer' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Chuyển khoản Ngân hàng (VietQR)</p>
                          <p className="text-xs text-gray-500 mt-0.5">Quét mã QR tự động qua ứng dụng ngân hàng</p>
                        </div>
                        <div className="shrink-0">
                          <input type="radio" name="payment_method" value="bank_transfer" checked={form.payment_method === 'bank_transfer'} onChange={handleChange} className="w-5 h-5 text-blue-600" />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 sm:p-5">
                    <label className="block text-xs uppercase tracking-wide font-bold text-gray-500 mb-1.5">Ghi chú giao hàng (tùy chọn)</label>
                    <textarea name="note" value={form.note} onChange={handleChange} rows="2" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none outline-none transition-all" placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..." />
                    <p className="mt-2 text-xs text-gray-500">Thông tin này giúp kỹ thuật viên/giao nhận phục vụ bạn nhanh hơn.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 font-semibold flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {(!addressData.provinceCode) ? 'Vui lòng chọn địa chỉ' : shippingFee === 0 ? 'Miễn phí vận chuyển' : `Phí vận chuyển: ${formatPrice(shippingFee)}`}
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Bảo hành chính hãng
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right: Tóm tắt đơn hàng */}
          <div className="w-full lg:w-1/3">
            <div className="lux-card rounded-3xl p-6 sm:p-8 flex flex-col h-full sticky top-24 border border-white/60 shadow-[0_28px_65px_-30px_rgba(79,70,229,0.45)]">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingCart className="text-indigo-600 w-6 h-6" /> Giỏ hàng ({cart.length})
              </h2>

              <ul className="space-y-4 mb-6 flex-1 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <li key={item.id} className="flex gap-4 rounded-2xl p-2.5 border border-gray-100 bg-white/75">
                    <ProductImage
                      imageSources={normalizeProductImages(item.image_url)}
                      alt={item.name}
                      containerClassName="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0"
                      imgClassName="w-full h-full object-cover"
                      fallbackClassName="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold"
                      fallbackContent="No img"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <h4 className="text-gray-900 font-bold text-sm line-clamp-2">{item.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-blue-700 font-bold text-sm">{formatPrice(item.price)}</span>
                        
                        {/* Quanity Controls */}
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                          <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 h-fit">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="Mã giảm giá"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                    <button 
                      type="button"
                      id="apply-btn"
                      onClick={handleCheckVoucher}
                      disabled={voucherLoading || !voucherCode}
                      className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50"
                    >
                    {voucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Áp dụng'}
                  </button>
                </div>
                {voucherError && <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {voucherError}</p>}
                {voucherData && <p className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã áp dụng mã {voucherData.code}</p>}
                
                {/* Danh sách mã của tôi */}
                {myVouchers.length > 0 && (
                  <div className="mt-3">
                    <button 
                      type="button"
                      onClick={() => setShowVoucherList(!showVoucherList)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Ticket className="w-3 h-3" /> {showVoucherList ? 'Ẩn bớt' : `Bạn có ${myVouchers.length} mã khả dụng. Xem ngay`}
                    </button>
                    
                    {showVoucherList && (
                      <div className="mt-2 grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {myVouchers.map(v => (
                          <div 
                            key={v.id} 
                            onClick={() => {
                              setVoucherCode(v.code);
                              setShowVoucherList(false);
                              // Trigger check sau khi state update (sử dụng setTimeout hoặc effect)
                              setTimeout(() => document.getElementById('apply-btn')?.click(), 100);
                            }}
                            className="p-3 border border-dashed border-blue-200 rounded-xl bg-white hover:bg-blue-50 cursor-pointer transition-all group"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs font-black text-gray-900 group-hover:text-blue-700">{v.code}</p>
                                <p className="text-[10px] text-blue-600 font-bold">Giảm {Number(v.value).toLocaleString('vi-VN')}đ</p>
                              </div>
                              <span className="text-[10px] font-black text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Chọn</span>
                            </div>
                            {v.min_order_value > 0 && (
                              <p className="text-[9px] text-gray-400 mt-1 italic">Đơn tối thiểu {Number(v.min_order_value).toLocaleString('vi-VN')}đ</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-3 mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Tạm tính</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Phí vận chuyển</span>
                  <span className={shippingFee === 0 ? 'text-green-600 font-bold' : 'text-gray-700 font-bold'}>
                    {!addressData.provinceCode ? 'Chưa tính' : (shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee))}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-bold">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-gray-900 font-bold text-lg">Tổng cộng</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={loading || !isLoggedIn}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 cursor-pointer"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                {isLoggedIn ? 'Xác Nhận Đặt Hàng' : 'Đăng nhập để thanh toán'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
