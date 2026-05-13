import React, { useState } from 'react';
import { 
  Camera, ShieldCheck, Home, Building2, Factory, 
  ChevronRight, CheckCircle2, PhoneCall, ListChecks, 
  MapPin, Settings, HelpCircle, Loader2, Send
} from 'lucide-react';
import { API_V1_URL } from '../../utils/api.js';

const solutions = [
  {
    id: 'home',
    title: 'Camera Gia Đình',
    icon: <Home className="w-8 h-8" />,
    description: 'Bảo vệ tổ ấm của bạn với hệ thống camera đàm thoại 24/7, cảnh báo chuyển động và xem từ xa qua điện thoại cực kỳ ổn định.',
    features: ['Cảnh báo đột nhập', 'Đàm thoại 2 chiều', 'Hồng ngoại ban đêm', 'Lưu trữ đám mây/thẻ nhớ']
  },
  {
    id: 'office',
    title: 'Camera Văn Phòng',
    icon: <Building2 className="w-8 h-8" />,
    description: 'Quản lý nhân sự và tài sản văn phòng hiệu quả. Hệ thống camera độ nét cao, góc nhìn rộng, lắp đặt thẩm mỹ.',
    features: ['Giám sát tập trung', 'Quản lý từ xa', 'Nhận diện khuôn mặt', 'Kết nối mạng nội bộ']
  },
  {
    id: 'factory',
    title: 'Camera Nhà Xưởng',
    icon: <Factory className="w-8 h-8" />,
    description: 'Giải pháp chuyên dụng cho diện tích lớn, môi trường khắc nghiệt. Hệ thống IP công nghiệp, zoom quang học cực xa.',
    features: ['Chống nước & va đập', 'Zoom xa 360 độ', 'Lưu trữ dung lượng lớn', 'Hỗ trợ nhiều màn hình']
  }
];

const processSteps = [
  {
    title: '1. Khảo sát tận nơi',
    description: 'Kỹ thuật viên 118 đến tận nhà/công trình để đo đạc và xác định vị trí lắp đặt tối ưu nhất.'
  },
  {
    title: '2. Tư vấn giải pháp',
    description: 'Đề xuất các loại camera phù hợp với nhu cầu và ngân sách, báo giá trọn gói không phát sinh.'
  },
  {
    title: '3. Thi công chuyên nghiệp',
    description: 'Lắp đặt nhanh chóng, đi dây thẩm mỹ, cấu hình hệ thống xem từ xa qua điện thoại/máy tính.'
  },
  {
    title: '4. Bàn giao & Hướng dẫn',
    description: 'Kiểm tra chất lượng hình ảnh, bàn giao tài khoản và hướng dẫn khách hàng sử dụng thành thạo.'
  }
];

const CameraSolutionsPage = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', date: '', time: '', address: '', type: 'Gia đình', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError('');
    try {
      const res = await fetch(`${API_V1_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          service: `Camera ${formData.type}`,
          address: formData.address || null,
          message: formData.message || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingId(data.data?.id);
        setSubmitted(true);
      } else {
        setSubmitError(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (err) {
      setSubmitError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Các phần Hero và Phân loại đã được loại bỏ */}

      {/* Process Section */}

      <section className="py-28 bg-slate-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]"></div>
          {/* subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'40px 40px'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest mb-5">Quy trình làm việc</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Thi Công <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Chuẩn Chuyên Nghiệp</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Từ khảo sát đến bàn giao — mọi bước đều minh bạch, nhanh chóng và có bảo hành.</p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0"></div>

            {[
              { num: '01', title: 'Khảo sát tận nơi', desc: 'Nhân viên 118 đến tận địa điểm, đo đạc và xác định vị trí đặt camera tối ưu nhất.', color: 'from-blue-500 to-blue-600' },
              { num: '02', title: 'Tư vấn giải pháp', desc: 'Đề xuất thiết bị phù hợp với nhu cầu và ngân sách, báo giá trọn gói minh bạch.', color: 'from-indigo-500 to-indigo-600' },
              { num: '03', title: 'Thi công chuyên nghiệp', desc: 'Lắp đặt nhanh chóng, đi dây âm tường gọn gàng, cấu hình xem từ xa qua điện thoại.', color: 'from-violet-500 to-violet-600' },
              { num: '04', title: 'Bàn giao & Hỗ trợ', desc: 'Kiểm tra hình ảnh, bàn giao tài khoản và hướng dẫn khách hàng sử dụng thành thạo.', color: 'from-cyan-500 to-teal-600' },
            ].map((step, i) => (
              <div key={i} className="relative group">
                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 h-full">
                  {/* Step number badge */}
                  <div className={`relative inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg mb-6`}>
                    <span className="text-white font-black text-sm">{step.num}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3 leading-snug">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {[
              { value: '500+', label: 'Công trình đã lắp đặt' },
              { value: '12 tháng', label: 'Bảo hành thiết bị' },
              { value: '<30 phút', label: 'Phản hồi xác nhận lịch' },
              { value: '100%', label: 'Khách hàng hài lòng' },
            ].map((stat, i) => (
              <div key={i} className="text-center border border-white/10 rounded-2xl px-4 py-6">
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-slate-400 text-xs font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Booking Form */}
      <section id="booking-form" className="py-24 bg-[#f0f4ff]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lux-card rounded-[48px] overflow-hidden shadow-2xl shadow-blue-900/10">
            {submitted ? (
               <div className="relative overflow-hidden p-8 md:p-16">
                 <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                 <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>

                 <div className="relative z-10 text-center py-14 px-4">
                   <div className="relative inline-flex mb-10">
                     <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce">
                       <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={1.5} />
                     </div>
                     <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></div>
                   </div>

                   <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                     Yêu Cầu Đã Được Ghi Nhận!
                   </h2>

                   {bookingId && (
                     <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-2.5 mb-6">
                       <span className="text-blue-600 font-bold text-sm">Mã lịch hẹn:</span>
                       <span className="text-blue-800 font-black text-sm tracking-widest">#{String(bookingId).padStart(4,'0')}</span>
                     </div>
                   )}

                   <p className="text-gray-500 text-lg mb-4 max-w-md mx-auto leading-relaxed">
                     Nhân viên 118 sẽ <strong className="text-gray-800">gọi điện xác nhận</strong> và hẹn lịch khảo sát trong vòng <strong className="text-gray-800">15–30 phút</strong>.
                   </p>

                   {formData.email && (
                     <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3 inline-block mb-10">
                       📧 Email xác nhận đã được gửi về <strong>{formData.email}</strong>
                     </p>
                   )}

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
                     <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                       <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                         <PhoneCall className="w-5 h-5 text-blue-600" />
                       </div>
                       <p className="font-bold text-gray-900 text-sm">Nhân viên sẽ gọi lại</p>
                       <p className="text-gray-500 text-xs mt-1">Trong vòng 15–30 phút</p>
                     </div>
                     <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                       <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                         <MapPin className="w-5 h-5 text-emerald-600" />
                       </div>
                       <p className="font-bold text-gray-900 text-sm">Khảo sát tận nơi</p>
                       <p className="text-gray-500 text-xs mt-1">Miễn phí – Không ràng buộc</p>
                     </div>
                     <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                       <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                         <ShieldCheck className="w-5 h-5 text-purple-600" />
                       </div>
                       <p className="font-bold text-gray-900 text-sm">Bảo hành 12 tháng</p>
                       <p className="text-gray-500 text-xs mt-1">1 đổi 1 tận nơi nội thành</p>
                     </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <button
                       onClick={() => { setSubmitted(false); setFormData({ name: '', phone: '', email: '', address: '', type: 'Gia đình', message: '' }); }}
                       className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/25"
                     >
                       Gửi yêu cầu khác
                     </button>
                     <a href="tel:0704818118" className="px-8 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                       <PhoneCall className="w-4 h-4" /> Gọi ngay: 0704.818.118
                     </a>
                   </div>
                 </div>
               </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5">
                {/* Left Panel - Trust Signals */}
                <div className="lg:col-span-2 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-10 lg:p-14 text-white flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-bold uppercase tracking-widest text-white/80">Đăng ký miễn phí</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black mb-4 leading-tight">
                      Khảo sát tận nơi, <span className="text-blue-300">tư vấn miễn phí.</span>
                    </h2>
                    <p className="text-blue-100/70 leading-relaxed text-sm mb-10">
                      Nhân viên kỹ thuật dày dạn kinh nghiệm của 118 sẽ đến trực tiếp, đánh giá thực tế và đưa ra giải pháp Camera tối ưu cho không gian của bạn.
                    </p>

                    <div className="space-y-4">
                      {[
                        { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />, text: 'Gọi lại xác nhận trong 15–30 phút' },
                        { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />, text: 'Khảo sát tận nơi, báo giá minh bạch' },
                        { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />, text: 'Bảo hành 12 tháng, 1 đổi 1 tận nơi' },
                        { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />, text: 'Không phát sinh chi phí ngoài dự toán' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-sm text-blue-100 font-medium">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-xs text-blue-200/60 mb-3 uppercase tracking-widest font-bold">Liên hệ trực tiếp</p>
                    <a href="tel:0704818118" className="flex items-center gap-3 text-white hover:text-blue-300 transition-colors">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <span className="font-black text-xl tracking-wide">0704.818.118</span>
                    </a>
                  </div>
                </div>

                {/* Right Panel - Form */}
                <div className="lg:col-span-3 p-10 lg:p-14">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black">1</div>
                      <span className="h-px flex-1 bg-gray-100"></span>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-black">2</div>
                      <span className="h-px flex-1 bg-gray-100"></span>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-black">3</div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1 px-1">
                      <span className="text-blue-600">Thông tin</span>
                      <span>Xác nhận</span>
                      <span>Khảo sát</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 mb-1">Điền thông tin đặt lịch</h3>
                  <p className="text-gray-400 text-sm mb-8">Nhân viên sẽ gọi lại trong vòng 15–30 phút để xác nhận.</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Họ và tên *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nguyễn Văn A" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-900" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Số điện thoại *</label>
                        <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0704 818 118" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-900" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email <span className="normal-case font-normal text-gray-400">(nhận xác nhận qua email)</span></label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-900" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Ngày khảo sát mong muốn</label>
                        <input type="date" value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-900" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Giờ thích hợp</label>
                        <select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_1.25rem_center] bg-no-repeat">
                          <option value="">-- Chọn giờ --</option>
                          <option>07:00 – 09:00 (Sáng sớm)</option>
                          <option>09:00 – 11:00 (Sáng)</option>
                          <option>11:00 – 13:00 (Buổi trưa)</option>
                          <option>13:00 – 15:00 (Chiều)</option>
                          <option>15:00 – 17:00 (Chiều muộn)</option>
                          <option>17:00 – 19:00 (Đầu giờ tối)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Địa chỉ khảo sát</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Số nhà, tên đường, phường, quận..." className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-900" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Loại không gian</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Gia đình', 'Cửa hàng / Văn phòng', 'Nhà xưởng / Kho bãi'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormData({...formData, type: opt})}
                            className={`py-3 px-3 rounded-2xl text-xs font-bold text-center border-2 transition-all ${formData.type === opt ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Ghi chú thêm</label>
                      <textarea rows="3" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="VD: Tôi muốn lắp 4 mắt camera IP POE, có mái che ngoài trời..." className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 resize-none" />
                    </div>

                    {submitError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-5 py-3">{submitError}</div>
                    )}

                    <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 active:translate-y-0">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      Đăng Ký Khảo Sát Tận Nơi — Miễn Phí
                    </button>

                    <p className="text-center text-xs text-gray-400">Bằng cách gửi biểu mẫu, bạn đồng ý để nhân viên 118 liên hệ với bạn.</p>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CameraSolutionsPage;
