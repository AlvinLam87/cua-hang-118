import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall, MapPin, Clock, Mail, Send,
  Calendar, User, MessageSquare, CheckCircle2, AlertCircle, Loader2, ChevronDown, ArrowRight
} from 'lucide-react';
import { formatDate } from '../../utils/format.js';
import { API_V1_URL } from '../../utils/api.js';

const serviceOptions = [
  'Sửa chữa PC / Laptop',
  'Bảo trì máy in / Scanner',
  'Lắp đặt camera an ninh',
  'Thiết lập mạng LAN / WiFi',
  'Nâng cấp linh kiện',
  'Khác',
];

const ContactPage = () => {
  // Khởi tạo thời gian an toàn bên trong component
  const getInitialDate = () => new Date().toISOString().split('T')[0];
  const getInitialTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', service: '', 
    date: getInitialDate(), time: getInitialTime(), 
    province: '', address: '', message: '', preferred_technician_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const dateInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate: không cho chọn ngày quá khứ
    if (formData.date) {
      const selected = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        setError('Ngày hẹn không thể là ngày trong quá khứ. Vui lòng chọn lại.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`${API_V1_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch {
      setError('Không thể kết nối đến server. Vui lòng thử lại hoặc gọi hotline.');
    } finally {
      setLoading(false);
    }
  };

  const contactItems = [
    { icon: <MapPin className="w-5 h-5" />, label: 'Địa chỉ', value: '55, Cách Mạng, Phường Bạc Liêu, Tỉnh Cà Mau', color: 'bg-blue-50 text-blue-600' },
    { icon: <PhoneCall className="w-5 h-5" />, label: 'Hotline', value: '0704.818.118', href: 'tel:0704818118', color: 'bg-emerald-50 text-emerald-600' },
    { icon: <Mail className="w-5 h-5" />, label: 'Email', value: 'support@cuahang118.vn', color: 'bg-purple-50 text-purple-600' },
    { icon: <Clock className="w-5 h-5" />, label: 'Giờ làm việc', value: '8:00 - 18:00 (Thứ 2 - Thứ 7)', color: 'bg-amber-50 text-amber-600' },
  ];

  const inputClass = "w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="bg-[#f8f9ff] min-h-screen">
      {/* ── Hero ── */}
      <section className="bg-gray-900 pt-20 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[140px] opacity-20" />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-5">
            <MessageSquare className="w-3.5 h-3.5" /> Liên hệ 118
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
            Kết Nối Với Chúng Tôi
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Cần hỗ trợ kỹ thuật hay tư vấn giải pháp? Đội ngũ Cửa Hàng 118 phản hồi trong vòng 15–30 phút.
          </p>
        </div>
      </section>

      {/* ── Main content — pulled up into hero overlap ── */}
      <section className="py-10 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* ── LEFT: Contact info + Map ── */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Contact card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Thông tin liên hệ</h2>
                <div className="space-y-4">
                  {contactItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center shrink-0`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors">{item.value}</a>
                        ) : (
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <a
                    href="tel:0704818118"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Gọi ngay: 0704.818.118
                  </a>
                </div>
              </div>

              {/* Map */}
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                <iframe
                  title="Cửa Hàng 118 Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5177580567843!2d106.69916!3d10.77162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzE4LjAiTiAxMDbCsDQxJzU3LjAiRQ!5e0!3m2!1svi!2svn!4v1"
                  width="100%" height="260"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>


            </div>

            {/* ── RIGHT: Booking form ── */}
            <div className="lg:col-span-3">
              {!submitted ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  {/* Form header */}
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-gray-900 mb-1">Đặt Lịch Hẹn</h2>
                    <p className="text-sm text-gray-500">Điền thông tin bên dưới — đội kỹ thuật sẽ liên hệ xác nhận ngay.</p>
                  </div>

                  {/* Geographic Limit Alert */}
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                    <div>
                      <p className="font-bold mb-1">Khu vực hỗ trợ tận nơi:</p>
                      <p>Hiện tại chúng tôi chỉ hỗ trợ các tỉnh: <strong>Cà Mau, Sóc Trăng, Bạc Liêu</strong>. Các khu vực khác vui lòng liên hệ hotline để được hỗ trợ gửi hàng.</p>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Họ và tên <span className="text-red-500">*</span></label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Nguyễn Văn A" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Số điện thoại <span className="text-red-500">*</span></label>
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="0901 234 567" className={inputClass} />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className={labelClass}>Email <span className="text-gray-400 font-normal normal-case tracking-normal">(nhận xác nhận qua email)</span></label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className={inputClass} />
                    </div>

                    {/* Service */}
                    <div>
                      <label className={labelClass}>Dịch vụ cần hỗ trợ <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select
                          name="service" required value={formData.service} onChange={handleChange}
                          className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                        >
                          <option value="">-- Chọn dịch vụ --</option>
                          {serviceOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Date + Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Ngày hẹn</label>
                        <div className="relative cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
                          <input 
                            type="text" 
                            readOnly 
                            value={formatDate(formData.date) || 'Chọn ngày'} 
                            className={`${inputClass} cursor-pointer`} 
                          />
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input 
                            type="date" 
                            ref={dateInputRef}
                            name="date"
                            min={getInitialDate()}
                            value={formData.date}
                            onChange={handleChange}
                            className="absolute inset-0 opacity-0 pointer-events-none" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Giờ hẹn</label>
                        <input type="time" name="time" value={formData.time} onChange={handleChange} className={inputClass} />
                      </div>
                    </div>

                    {/* Province + Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Tỉnh/Thành phố <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <select
                            name="province" required value={formData.province} onChange={handleChange}
                            className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                          >
                            <option value="">-- Chọn Tỉnh/Thành --</option>
                            <option value="Cà Mau">Cà Mau</option>
                            <option value="Sóc Trăng">Sóc Trăng</option>
                            <option value="Bạc Liêu">Bạc Liêu</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                        <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="Số nhà, đường, xã/phường..." className={inputClass} />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className={labelClass}>Mô tả sự cố</label>
                      <textarea name="message" rows={3} value={formData.message} onChange={handleChange} placeholder="Mô tả chi tiết sự cố để kỹ thuật viên chuẩn bị tốt hơn..." className={`${inputClass} resize-none`} />
                    </div>

                    {/* Privacy note */}
                    <p className="text-xs text-gray-400 leading-relaxed">
                      🔒 Thông tin của bạn chỉ dùng để xác nhận lịch hẹn và tư vấn kỹ thuật. Cửa Hàng 118 cam kết bảo mật tuyệt đối.
                    </p>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-1 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 text-sm shadow-lg shadow-blue-500/20"
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
                        : <><Send className="w-4 h-4" /> Gửi Phiếu Tư Vấn</>
                      }
                    </button>
                  </form>
                </div>
              ) : (
                /* ── Success state ── */
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">Đặt Lịch Thành Công!</h2>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                    Cảm ơn bạn đã tin tưởng Cửa Hàng 118. Chúng tôi sẽ gọi điện xác nhận lịch hẹn trong vòng{' '}
                    <span className="text-blue-600 font-bold">30 phút</span>.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: '', phone: '', email: '', service: '', date: getInitialDate(), time: getInitialTime(), province: '', address: '', message: '', preferred_technician_id: '' }); }}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Đặt lịch khác
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
