import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle2, Wrench, AlertCircle, Loader2, Calendar, User, Smartphone, Tag, ShieldCheck, PhoneCall, ArrowRight, ClipboardList, Info } from 'lucide-react';
import { API_V1_URL } from '../../utils/api.js';

const statusStyles = {
  received: { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', label: 'Đã tiếp nhận', icon: <Package className="w-5 h-5" /> },
  diagnosing: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Đang chẩn đoán', icon: <Search className="w-5 h-5" /> },
  quoted: { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', label: 'Đã báo giá', icon: <Tag className="w-5 h-5" /> },
  in_progress: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Đang sửa chữa', icon: <Wrench className="w-5 h-5" /> },
  testing: { color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', label: 'Đang kiểm tra', icon: <ShieldCheck className="w-5 h-5" /> },
  completed: { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'Hoàn thành', icon: <CheckCircle2 className="w-5 h-5" /> },
  returned: { color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20', label: 'Đã bàn giao', icon: <CheckCircle2 className="w-5 h-5" /> },
  cancelled: { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', label: 'Đã hủy', icon: <AlertCircle className="w-5 h-5" /> },
};

const TrackingPage = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const getWarrantyStatus = useCallback(() => {
    if (!result || !result.warrantyExpiry) return { active: false, text: 'Không bảo hành', daysLeft: 0 };
    const expiry = new Date(result.warrantyExpiry);
    const today = new Date();
    expiry.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) {
      return { active: true, text: 'Đang hoạt động', daysLeft: diffDays };
    } else {
      return { active: false, text: 'Đã hết hạn', daysLeft: diffDays };
    }
  }, [result]);

  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    // Use either the current query state or a forced value
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    setResult(null);
    setNotFound(false);

    try {
      const res = await fetch(`${API_V1_URL}/tracking?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Lỗi tra cứu:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Handle URL query parameters (?q=...)
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      // We need to trigger search. Since query state might not be updated yet, 
      // we can't call handleSearch directly without changes or another useEffect.
    }
  }, [location.search]);

  // Second effect to trigger search once query state is set from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && query === q && !searched && !loading) {
      handleSearch();
    }
  }, [query, location.search, searched, loading, handleSearch]);

  const statusInfo = result ? (statusStyles[result.status] || { color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', label: result.statusLabel, icon: <Package className="w-5 h-5" /> }) : null;
  const wStatus = getWarrantyStatus();

  return (
    <div className="bg-[#0f172a] min-h-screen pb-24 text-slate-200 selection:bg-blue-500/30 font-sans">
      {/* Premium Hero Section */}
      <section className="relative pt-28 pb-40 overflow-hidden">
        {/* Advanced Tech Background */}
        <div className="absolute inset-0 z-0">
          {/* Base Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e293b_0%,#0f172a_100%)]" />
          
          {/* Tech Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
          
          {/* Strategic Glow Orbs */}
          <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full" />
          
          {/* Subtle Particles */}
          <div className="absolute top-[30%] left-[20%] w-1 h-1 bg-blue-400/40 rounded-full animate-ping" />
          <div className="absolute top-[60%] right-[15%] w-1 h-1 bg-indigo-400/40 rounded-full animate-ping delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
             <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Hệ Thống Tra Cứu Thời Gian Thực
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
            Kiểm Tra <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">Tiến Độ</span><br/>Sửa Chữa
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed opacity-80 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Nhập mã biên nhận để theo dõi minh bạch từng giai đoạn xử lý thiết bị của bạn tại Cửa Hàng 118.
          </p>

          {/* Futuristic Search Bar */}
          <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[34px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex flex-col sm:flex-row gap-3 p-2.5 bg-[#161f35]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-400/70" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="RCV-118... hoặc Số điện thoại"
                    className="w-full pl-14 pr-6 py-5 bg-transparent text-white placeholder-slate-500 outline-none font-bold text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-5 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-[24px] font-black text-lg transition-all shadow-xl shadow-blue-900/40 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 group/btn"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Search className="w-5 h-5 group-hover/btn:scale-110 transition-transform" /> Tra cứu</>}
                </button>
              </div>
            </form>
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">Ví dụ: <span className="text-slate-300">RCV-118001</span></div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">Ví dụ: <span className="text-slate-300">0704818118</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-6xl mx-auto px-4 -mt-24 relative z-20">
        {/* Loading State */}
        {loading && (
          <div className="bg-[#161f35]/60 backdrop-blur-xl rounded-[48px] p-24 border border-white/10 shadow-2xl text-center flex flex-col items-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-indigo-500/10 border-b-indigo-500 rounded-full animate-spin-reverse" />
              <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Đang kết nối máy chủ</h3>
            <p className="text-slate-400 font-medium">Vui lòng đợi trong giây lát...</p>
          </div>
        )}

        {/* Result UI */}
        {result && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-[#161f35]/80 backdrop-blur-3xl rounded-[48px] shadow-3xl border border-white/10 overflow-hidden">
              {/* Status Banner */}
              <div className={`p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 ${statusInfo.color.split(' ')[1]}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl bg-slate-900 border ${statusInfo.color.split(' ')[2]} ${statusInfo.color.split(' ')[0]}`}>
                    {statusInfo.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Trạng thái hiện tại</p>
                    <h2 className="text-4xl font-black text-white tracking-tight">{statusInfo.label}</h2>
                  </div>
                </div>
                {result.technician && (
                  <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-3xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kỹ thuật phụ trách</p>
                      <p className="text-base font-black text-white">{result.technician}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-10 md:p-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  {/* Info Grid */}
                  <div className="lg:col-span-7 space-y-12">
                    <div>
                      <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        Chi tiết biên nhận
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                        <ResultItem icon={<Tag className="w-5 h-5" />} label="Mã biên nhận" value={result.receiptCode} highlight />
                        <ResultItem icon={<Smartphone className="w-5 h-5" />} label="Thiết bị sửa chữa" value={result.device} />
                        <ResultItem icon={<User className="w-5 h-5" />} label="Tên khách hàng" value={result.customer} />
                        <ResultItem icon={<Calendar className="w-5 h-5" />} label="Ngày tiếp nhận" value={result.receivedDate} />
                        
                        <div className="sm:col-span-2 p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-blue-500/30 transition-colors">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5 text-blue-400" /> Tình trạng & Lỗi mô tả
                          </p>
                          <p className="text-slate-200 font-bold leading-relaxed text-lg">{result.issue}</p>
                        </div>
                      </div>
                    </div>

                    {/* Financials */}
                    {(result.estimatedCost || result.finalCost) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {result.estimatedCost && (
                          <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 group hover:bg-blue-500/5 transition-all">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Chi phí dự kiến</p>
                            <p className="text-3xl font-black text-blue-400">{result.estimatedCost.toLocaleString('vi-VN')}đ</p>
                          </div>
                        )}
                        {result.finalCost && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-8">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Chi phí thực tế</p>
                            <p className="text-3xl font-black text-emerald-400">{result.finalCost.toLocaleString('vi-VN')}đ</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Thẻ Bảo Hành Điện Tử Bento Style */}
                    {['completed', 'returned'].includes(result.status) && (
                      <div className="relative overflow-hidden bg-gradient-to-br from-[#161f35] to-[#0e1526] border border-blue-500/20 rounded-[36px] p-8 sm:p-10 shadow-2xl group transition-all duration-700 mt-10">
                        {/* Glow backdrops */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-[50px] group-hover:bg-blue-500/25 transition-all duration-500" />
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-[40px]" />
                        
                        <div className="relative z-10">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-900/20 relative">
                                <span className="absolute inset-0 bg-blue-400/20 blur-md rounded-2xl animate-pulse" />
                                <ShieldCheck className="w-7 h-7 relative z-10" />
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Cửa Hàng 118</span>
                                <h4 className="text-2xl font-black text-white tracking-tight mt-0.5">BẢO HÀNH ĐIỆN TỬ</h4>
                              </div>
                            </div>

                            {/* Badge */}
                            <div className={`px-4.5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-2 transition-all ${
                              wStatus.active 
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-lg shadow-emerald-950/20' 
                                : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${wStatus.active ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                              {wStatus.text}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thời hạn bảo hành</p>
                              <p className="text-lg font-black text-white">
                                {result.warrantyPeriod ? `${result.warrantyPeriod} tháng` : 'Không bảo hành'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ngày hết hạn</p>
                              <p className="text-lg font-black text-white">
                                {result.warrantyExpiry ? new Date(result.warrantyExpiry).toLocaleDateString('vi-VN') : '—'}
                              </p>
                            </div>
                            
                            {wStatus.active && result.warrantyExpiry && (
                              <div className="sm:col-span-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex items-center gap-4.5">
                                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                                  <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400">Thời gian bảo hành còn lại</p>
                                  <p className="text-lg font-black text-emerald-400 mt-0.5">
                                    Còn <span className="text-2xl font-black">{wStatus.daysLeft}</span> ngày bảo hành
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {result.warrantyTerms && (
                            <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-blue-400" /> Điều khoản áp dụng
                              </p>
                              <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                                {result.warrantyTerms}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Timeline */}
                  <div className="lg:col-span-5 bg-black/20 rounded-[40px] p-10 border border-white/5">
                    <h3 className="text-lg font-black text-white mb-10 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-indigo-400" /> Tiến trình xử lý
                    </h3>
                    <div className="space-y-0 relative">
                      {/* Vertical line background */}
                      <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-white/5" />
                      
                      {result.steps?.map((step, idx) => (
                        <div key={idx} className="flex gap-6 relative group mb-10 last:mb-0">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-500 shadow-xl ${
                            step.done ? 'bg-blue-500 text-white scale-110 rotate-3' : 'bg-slate-800 text-slate-600 border border-white/5'
                          }`}>
                            {step.done ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors" />}
                          </div>
                          <div className="pt-1.5">
                            <p className={`font-black text-lg leading-none mb-2 ${step.done ? 'text-white' : 'text-slate-600'}`}>{step.label}</p>
                            <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                              {step.date ? new Date(step.date).toLocaleDateString('vi-VN') : 'Đang chờ...'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Premium Call to Action */}
              <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 p-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-black text-white mb-2">Bạn có thắc mắc về kỹ thuật?</h4>
                  <p className="text-slate-400 font-medium italic">Kỹ thuật viên của chúng tôi luôn sẵn sàng hỗ trợ bạn.</p>
                </div>
                <a href="tel:0704818118" className="group flex items-center gap-4 bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-2xl hover:scale-105 active:scale-95">
                  <PhoneCall className="w-6 h-6 text-blue-600 group-hover:animate-bounce" />
                  0704.818.118
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Not Found UI */}
        {notFound && searched && !loading && (
          <div className="bg-[#161f35]/60 backdrop-blur-2xl rounded-[48px] p-20 border border-red-500/20 shadow-2xl text-center max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-rose-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 border border-rose-500/20 shadow-inner">
              <AlertCircle className="w-12 h-12 text-rose-500" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Không tìm thấy thông tin</h3>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
              Rất tiếc, hệ thống không tìm thấy biên nhận cho <span className="text-rose-400 font-black">"{query}"</span>. 
              Vui lòng kiểm tra lại mã số hoặc gọi cho chúng tôi để được trợ giúp.
            </p>
            <button 
              onClick={() => { setSearched(false); setQuery(''); }}
              className="px-10 py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 mx-auto"
            >
              Thử lại mã khác <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Premium Feature Cards */}
        {!searched && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-1000">
            <GlassCard 
              icon={<ClipboardList className="w-10 h-10 text-blue-400" />} 
              title="Minh bạch 100%" 
              desc="Tất cả dữ liệu được đồng bộ trực tiếp từ kỹ thuật viên sửa chữa." 
            />
            <GlassCard 
              icon={<ShieldCheck className="w-10 h-10 text-indigo-400" />} 
              title="Dữ liệu an toàn" 
              desc="Thông tin khách hàng được mã hóa và bảo mật tuyệt đối." 
            />
            <GlassCard 
              icon={<Clock className="w-10 h-10 text-cyan-400" />} 
              title="Tiết kiệm 5 phút" 
              desc="Tra cứu ngay tại nhà, không cần chờ đợi nhân viên tư vấn." 
            />
          </div>
        )}
      </section>
    </div>
  );
};

const ResultItem = ({ icon, label, value, highlight }) => (
  <div className="flex items-start gap-5 group">
    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-400/10 transition-all border border-white/5">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-black tracking-tight ${highlight ? 'text-blue-400 text-xl' : 'text-white text-lg'}`}>{value || '—'}</p>
    </div>
  </div>
);

const GlassCard = ({ icon, title, desc }) => (
  <div className="group relative bg-white/5 backdrop-blur-xl p-10 rounded-[40px] border border-white/5 hover:border-blue-500/30 transition-all duration-700 hover:-translate-y-4 overflow-hidden">
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
    <div className="mb-8 p-4 bg-slate-900 rounded-3xl w-fit shadow-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500">{icon}</div>
    <h4 className="text-xl font-black text-white mb-4 tracking-tight">{title}</h4>
    <p className="text-slate-400 text-base font-medium leading-relaxed opacity-80">{desc}</p>
  </div>
);

export default TrackingPage;
