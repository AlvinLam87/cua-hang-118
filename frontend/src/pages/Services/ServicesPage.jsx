import React, { useState, useEffect, useRef } from 'react';
import {
  MonitorPlay, Printer, ShieldCheck, Wifi, HardDrive,
  Cpu, Monitor, Wrench, Camera, CheckCircle2, PhoneCall, ChevronRight, Loader2,
  X, User, Mail, Calendar, Clock, MapPin, MessageSquare, Send, AlertCircle, Home, Settings
} from 'lucide-react';
import { resolveMediaUrl } from '../../utils/media.js';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format.js';
import { API_V1_URL } from '../../utils/api.js';

const iconMap = {
  MonitorPlay: <MonitorPlay className="w-6 h-6" />,
  Printer: <Printer className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  Wifi: <Wifi className="w-6 h-6" />,
  HardDrive: <HardDrive className="w-6 h-6" />,
  Cpu: <Cpu className="w-6 h-6" />,
  Monitor: <Monitor className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  Camera: <Camera className="w-6 h-6" />,
};

const tabs = [
  { id: 'svc-pc', label: 'Máy Tính & Laptop', icon: <MonitorPlay className="w-5 h-5" /> },
  { id: 'svc-office', label: 'Thiết Bị Văn Phòng', icon: <Printer className="w-5 h-5" /> },
  { id: 'svc-home', label: 'Sửa Chữa Tận Nhà', icon: <Home className="w-5 h-5" /> },
];

const tabMeta = {
  'svc-pc': { title: 'Sửa Chữa Máy Tính & Laptop', description: 'Đội ngũ kỹ thuật viên nhiều năm kinh nghiệm, chẩn đoán chính xác, sửa chữa nhanh chóng mọi sự cố phần cứng & phần mềm.' },
  'svc-office': { title: 'Thiết Bị Văn Phòng & Mạng', description: 'Giải pháp toàn diện cho hệ thống IT văn phòng: máy in, đổ mực máy in, mạng nội bộ LAN/WiFi.' },
  'svc-home': { title: 'Dịch Vụ Sửa Chữa Tận Nơi', description: 'Giải quyết các vấn đề thiết bị, mạng internet, máy tính nhanh chóng ngay tại nhà/văn phòng của bạn mà không cần mang máy đến tiệm.' },
};

const ServicesPage = () => {
  const [activeTab, setActiveTab] = useState('svc-pc');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  
  // Lấy thời gian địa phương (GMT+7)
  const now = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  const todayStr = now.toISOString().split('T')[0];
  const nowTimeStr = now.toISOString().split('T')[1].substring(0, 5); // "HH:mm"

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', service: '', date: todayStr, time: nowTimeStr, address: '', message: '', preferred_technician_id: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [error, setError] = useState('');
  const [viewingTech, setViewingTech] = useState(null);
  const dateInputRef = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_V1_URL}/services?category=${activeTab}`);
        const data = await res.json();
        if (data.success) {
          setServices(data.data);
        }
      } catch (err) {
        console.error('Lỗi tải dịch vụ:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTechnicians = async () => {
      try {
        const res = await fetch(`${API_V1_URL}/services/technicians`);
        const data = await res.json();
        if (data.success) setTechnicians(data.data);
      } catch (err) {
        console.error('Lỗi tải danh sách KTV:', err);
      }
    };

    fetchServices();
    fetchTechnicians();
  }, [activeTab]);

  const openBookingModal = (serviceName = '') => {
    setFormData(prev => ({ ...prev, service: serviceName, preferred_technician_id: '' }));
    setSubmitted(false);
    setError('');
    setShowModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    // Validate: không cho chọn ngày quá khứ
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setError('Ngày hẹn không thể là ngày trong quá khứ. Vui lòng chọn lại.');
        setSubmitLoading(false);
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
        setBookingData(data.data);
        setSubmitted(true);
      } else {
        setError(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const meta = tabMeta[activeTab];

  return (
    <div>
      {/* Page Header */}
      <section className="bg-slate-900 pt-24 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600 rounded-full filter blur-[160px] opacity-20 animate-pulse" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/3" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest mb-6">
            <Settings className="w-4 h-4 animate-spin-slow" /> Dịch Vụ Chuyên Nghiệp
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-400 mb-6 tracking-tight">
            Sửa Chữa & Bảo Trì IT
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Chúng tôi cung cấp giải pháp kỹ thuật toàn diện cho thiết bị cá nhân và hạ tầng văn phòng. 
            Cam kết <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">Minh Bạch - Tốc Độ - Chất Lượng</span>.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 glass p-2 rounded-2xl max-w-2xl mx-auto mb-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Service Content */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{meta.title}</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{meta.description}</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <span className="text-gray-400 font-medium text-sm">Đang tải dịch vụ...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white border border-gray-100 rounded-3xl p-7 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
                >
                  {/* Icon + Warranty row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      {iconMap[item.icon] || <Wrench className="w-5 h-5" />}
                    </div>
                    {item.has_warranty && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Bảo hành
                      </span>
                    )}
                  </div>

                  {/* Name & description */}
                  <h4 className="text-gray-900 text-lg font-black mb-2 leading-tight">{item.name}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">Dịch vụ chuyên nghiệp với linh kiện chính hãng tại 118.</p>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-blue-600 font-black text-lg">
                        {item.price_label
                          ? (item.price_label.startsWith('Từ') ? item.price_label : `Từ ${item.price_label}`)
                          : `Từ ${item.price?.toLocaleString('vi-VN')}đ`}
                      </span>
                      <p className="text-gray-400 text-[11px] font-medium mt-0.5">Giá tham khảo · Báo giá sau khảo sát</p>
                    </div>
                    <button
                      onClick={() => openBookingModal(item.name)}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-4 py-2.5 rounded-2xl transition-all duration-200"
                    >
                      Đặt lịch <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Pricing Information Table Section */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-xs uppercase tracking-widest mb-4">Bảng Giá Công Khai & Cam Kết</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Chi phí minh bạch,<br className="hidden md:block"/>trải nghiệm chuyên nghiệp</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Chúng tôi tin rằng sự minh bạch là cốt lõi của dịch vụ. Mọi khoản phí đều được trao đổi rõ ràng, không phát sinh chi phí ẩn khi thanh toán.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left: Dark Pricing Card */}
            <div className="lg:col-span-7 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[40px] transform rotate-1 scale-[0.98] opacity-20 blur-md pointer-events-none"></div>
              <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white relative shadow-2xl overflow-hidden border border-slate-800">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                
                <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-white relative z-10">
                  <span className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Monitor className="w-5 h-5" />
                  </span>
                  Báo Giá Dịch Vụ Cơ Bản
                </h3>
                
                <div className="space-y-0 relative z-10">
                  {[
                    { name: 'Cài đặt Windows / MacOS (kèm PM cơ bản)', price: '150k - 250k' },
                    { name: 'Vệ sinh máy tính / Tra keo tản nhiệt MX-4', price: '150k - 200k' },
                    { name: 'Khắc phục lỗi mạng / Cấu hình WiFi', price: '200k - 400k' },
                    { name: 'Nạp mực máy in tận nơi / Thay drum', price: '80k - 150k' },
                    { name: 'Khôi phục dữ liệu ổ cứng, USB', price: 'Từ 500k' },
                  ].map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-5 border-b border-slate-700/50 last:border-0 group">
                      <span className="font-medium text-slate-300 group-hover:text-white transition-colors">{p.name}</span>
                      <span className="font-bold text-blue-400 group-hover:text-blue-300 transition-colors">{p.price}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-5 bg-blue-950/50 rounded-2xl border border-blue-800/50 flex gap-4 relative z-10 backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 text-blue-400 shrink-0" />
                  <p className="text-[13px] text-blue-200/80 leading-relaxed font-medium">Bảng giá trên là phí nhân công tham khảo. Trường hợp phát sinh thay thế linh kiện (RAM, SSD, màn hình...), kỹ thuật viên sẽ báo giá chi tiết và có sự đồng ý của bạn trước khi làm.</p>
                </div>
              </div>
            </div>
            
            {/* Right: Elegant Benefits List */}
            <div className="lg:col-span-5 flex flex-col justify-center h-full space-y-10 lg:py-6">
              {[
                { icon: <ShieldCheck className="w-6 h-6 text-emerald-600"/>, title: 'Bảo Hành Trách Nhiệm', desc: '100% dịch vụ và linh kiện thay thế được bảo hành 3-12 tháng. Miễn phí xử lý tận nơi nếu lỗi tái diễn.' },
                { icon: <Clock className="w-6 h-6 text-blue-600"/>, title: 'Tốc Độ & Đúng Hẹn', desc: 'Có mặt tận nhà chỉ trong 30-60 phút. Hoạt động liên tục cả buổi tối và các ngày cuối tuần.' },
                { icon: <User className="w-6 h-6 text-indigo-600"/>, title: 'Đội Ngũ Chuyên Gia', desc: 'Kỹ thuật viên được đào tạo chuyên sâu, tay nghề cao, thái độ thân thiện và luôn trung thực.' },
                { icon: <MapPin className="w-6 h-6 text-rose-600"/>, title: 'Phục Vụ Tận Nơi', desc: 'Sửa chữa ngay tại bàn làm việc của bạn. Trực tiếp quan sát, không lo đánh tráo linh kiện.' },
              ].map((b, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="w-14 h-14 rounded-[20px] bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-white group-hover:border-blue-200 group-hover:shadow-blue-100 group-hover:scale-110 transition-all duration-300">
                    {b.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{b.title}</h4>
                    <p className="text-gray-500 leading-relaxed text-sm">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section Re-design */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-[#1d1d1f] rounded-[40px] px-8 py-16 md:px-16 md:py-20 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-600/30 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-5 tracking-tight text-white/95">
                  Bạn Cần Hỗ Trợ Kỹ Thuật Ngay?
                </h2>
                <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
                  Đừng để gián đoạn công việc. Kỹ thuật viên của chúng tôi luôn sẵn sàng có mặt để xử lý mọi sự cố thiết bị của bạn.
                </p>
                <div className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full sm:w-auto">
                  <a href="tel:0704818118" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-extrabold rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-3 active:scale-95 shadow-lg">
                    <PhoneCall className="w-5 h-5 text-blue-600" /> 0704.818.118
                  </a>
                  <button onClick={() => openBookingModal()} className="w-full sm:w-auto px-8 py-4 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-extrabold rounded-full transition-colors flex items-center justify-center gap-3 active:scale-95">
                    <Calendar className="w-5 h-5 text-gray-300" /> Đặt Lịch Online
                  </button>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Đặt Lịch Dịch Vụ</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Success Animation Container */}
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                    <div className="absolute inset-2 bg-emerald-500/10 rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">Yêu Cầu Đã Được Ghi Nhận!</h2>
                  
                  {/* Booking ID Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100 mb-8">
                    Mã lịch hẹn: <span className="font-black">#${String(bookingData?.id).padStart(4, '0')}</span>
                  </div>

                  <p className="text-gray-500 mb-8 max-w-md mx-auto text-base leading-relaxed">
                    Nhân viên 118 sẽ <strong className="text-gray-900">gọi điện xác nhận</strong> và hẹn lịch khảo sát trong vòng <strong className="text-blue-600">15–30 phút</strong>.
                  </p>

                  {/* Email Confirmation Notice */}
                  {formData.email && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[13px] font-medium border border-emerald-100 mb-10">
                      <Mail className="w-4 h-4" /> Email xác nhận đã được gửi về <strong className="ml-1 text-emerald-800">{formData.email}</strong>
                    </div>
                  )}

                  {/* Follow-up Feature Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
                    <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Nhân viên sẽ gọi lại</h4>
                      <p className="text-[11px] text-gray-500">Trong vòng 15–30 phút</p>
                    </div>
                    
                    <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Khảo sát tận nơi</h4>
                      <p className="text-[11px] text-gray-500">Miễn phí — Không ràng buộc</p>
                    </div>
                    
                    <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Bảo hành 12 tháng</h4>
                      <p className="text-[11px] text-gray-500">1 đổi 1 tận nơi nội thành</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowModal(false)} 
                    className="w-full sm:w-auto px-12 py-4 bg-gray-900 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    Tiếp tục khám phá
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3">
                    <p className="text-sm font-bold text-blue-900">Phiếu đặt lịch kỹ thuật</p>
                    <p className="text-xs text-blue-700 mt-1">Chúng tôi xác nhận lịch trong 15-30 phút qua điện thoại hoặc email.</p>
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 font-medium text-sm flex gap-2 rounded-xl border border-red-100">
                      <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Thông tin liên hệ</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1"><User className="w-3.5 h-3.5 inline mr-1" /> Họ tên *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white/80 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nguyễn Văn A" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1"><PhoneCall className="w-3.5 h-3.5 inline mr-1" /> Số điện thoại *</label>
                        <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-white/80 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0901 234 567" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Thông tin yêu cầu</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1"><Wrench className="w-3.5 h-3.5 inline mr-1" /> Tên dịch vụ *</label>
                        <input type="text" required value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="w-full px-4 py-3 bg-white/80 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="VD: Sửa chữa máy tính" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5"><User className="w-3.5 h-3.5 inline mr-1 text-emerald-600" /> Chọn Kỹ thuật viên phụ trách trực tiếp (Tùy chọn)</label>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Random / Any Option */}
                      <div 
                        onClick={() => setFormData({...formData, preferred_technician_id: ''})}
                        className={`cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col items-center justify-center text-center gap-2 h-[130px]
                          ${!formData.preferred_technician_id ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm 
                          ${!formData.preferred_technician_id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          ALL
                        </div>
                        <div>
                          <p className={`font-bold text-sm leading-tight ${!formData.preferred_technician_id ? 'text-emerald-900' : 'text-gray-900'}`}>Bất kỳ ai</p>
                          <p className="text-xs text-gray-500 mt-0.5">Sắp xếp tự động</p>
                        </div>
                      </div>
                      
                      {/* Technicians List Options */}
                      {technicians.map(t => (
                        <div 
                          key={t.id}
                          onClick={() => setViewingTech(t)}
                          className={`cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col items-center justify-center text-center gap-2 h-[130px]
                            ${formData.preferred_technician_id === t.id ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg 
                            ${formData.preferred_technician_id === t.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-indigo-100 text-indigo-600'}`}>
                            {t.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="w-full">
                            <p className={`font-bold text-sm leading-tight line-clamp-1 break-words 
                              ${formData.preferred_technician_id === t.id ? 'text-emerald-900' : 'text-gray-900'}`}>
                              {t.full_name.split(' ').slice(-2).join(' ')}
                            </p>
                            <div className="flex flex-col items-center mt-1">
                              <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 line-clamp-1">{t.specialty || 'Chuyên viên IT'}</p>
                              <div className="flex items-center justify-center gap-1 mt-0.5 text-[10px] font-bold text-amber-500">
                                <span>⭐ {t.rating || '5.0'}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-blue-600">{t.experience_years || 1} năm KN</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1"><Calendar className="w-3.5 h-3.5 inline mr-1" /> Ngày hẹn</label>
                      <div className="relative cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
                        <input 
                          type="text" 
                          readOnly 
                          value={formatDate(formData.date) || 'Chọn ngày'} 
                          className="w-full px-4 py-3 bg-white/80 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input 
                          type="date" 
                          ref={dateInputRef}
                          min={todayStr}
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="absolute inset-0 opacity-0 pointer-events-none" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1"><Clock className="w-3.5 h-3.5 inline mr-1" /> Giờ hẹn</label>
                      <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-4 py-3 bg-white/80 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black tracking-wider uppercase text-gray-400 mb-2">Khu vực hỗ trợ</p>
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 mb-4">
                      <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                      Hiện tại chúng tôi chỉ hỗ trợ sửa chữa tận nơi tại: <strong>Cà Mau, Sóc Trăng, Bạc Liêu</strong>.
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1"><MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-500" /> Tỉnh/Thành phố *</label>
                        <select 
                          required 
                          value={formData.province || ''} 
                          onChange={e => setFormData({...formData, province: e.target.value})} 
                          className="w-full px-4 py-3 bg-white/80 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Chọn Tỉnh/Thành</option>
                          <option value="Cà Mau">Cà Mau</option>
                          <option value="Sóc Trăng">Sóc Trăng</option>
                          <option value="Bạc Liêu">Bạc Liêu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1"><MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-500" /> Địa chỉ chi tiết *</label>
                        <input 
                          type="text" 
                          required
                          value={formData.address} 
                          onChange={e => setFormData({...formData, address: e.target.value})} 
                          placeholder="Số nhà, đường, phường/xã..." 
                          className="w-full px-4 py-3 bg-white/80 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1"><Mail className="w-3.5 h-3.5 inline mr-1" /> Email (để nhận hóa đơn/thông báo)</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" className="w-full px-4 py-3 bg-white/80 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800">
                    Thông tin của bạn chỉ dùng để xác nhận lịch và tư vấn kỹ thuật. Cửa Hàng 118 không chia sẻ dữ liệu cho bên thứ ba.
                  </div>

                  <button type="submit" disabled={submitLoading} className="w-full mt-1 py-4 lux-button font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                    {submitLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />} Gửi Phiếu Đặt Lịch
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Technician Details Sub-Modal - Friendly Professional Style */}
      {viewingTech && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] relative border border-gray-100">
            {/* Soft Header Decor */}
            <div className="h-28 bg-gradient-to-br from-blue-50 to-indigo-50 relative">
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={() => setViewingTech(null)} 
                  className="p-2 bg-white/80 hover:bg-white text-gray-400 hover:text-gray-600 rounded-full transition-all shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
            </div>
            
            {/* Avatar with soft glow */}
            <div className="relative -mt-14 flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl scale-110 group-hover:bg-blue-400/30 transition-all" />
                <div className="w-28 h-28 rounded-full border-[6px] border-white bg-blue-50 flex items-center justify-center shadow-md relative overflow-hidden z-10">
                  {viewingTech.avatar_url ? (
                    <img 
                      src={resolveMediaUrl(viewingTech.avatar_url)} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className="text-4xl font-black text-blue-600"
                    style={{ display: viewingTech.avatar_url ? 'none' : 'flex' }}
                  >
                    {viewingTech.full_name.charAt(0)}
                  </span>
                </div>
                {/* Online Badge */}
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full z-20" />
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8 pt-6 text-center">
              <div className="mb-8">
                <h3 className="text-2xl font-black text-gray-900 mb-1">{viewingTech.full_name}</h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold uppercase tracking-wider">
                  {viewingTech.role === 'technician' ? 'Kỹ thuật viên tận tâm' : 'Chuyên viên kỹ thuật'}
                </div>
              </div>
              
              {/* Friendly Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/50">
                  <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Kinh nghiệm</p>
                  <p className="text-base font-black text-gray-900">{viewingTech.experience_years || 1} năm</p>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100/50">
                  <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Đánh giá</p>
                  <p className="text-base font-black text-amber-600">{viewingTech.rating || '5.0'} / 5.0</p>
                </div>
                
                <div className="col-span-2 bg-blue-50/50 border border-blue-100 p-5 rounded-[2rem] text-left">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Wrench className="w-3 h-3" /> Chuyên môn chính
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {viewingTech.specialty || 'Thao tác bảo dưỡng thiết bị IT, sửa chữa và tư vấn các giải pháp máy tính văn phòng.'}
                  </p>
                </div>
              </div>

              {/* Approachable Action Button */}
              <button 
                onClick={() => {
                  setFormData({...formData, preferred_technician_id: viewingTech.id});
                  setViewingTech(null);
                }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2 group active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5"/> Chọn Kỹ thuật viên này
              </button>
              
              <p className="mt-4 text-[11px] text-gray-400 font-medium">Cam kết hỗ trợ nhiệt tình & trung thực</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
