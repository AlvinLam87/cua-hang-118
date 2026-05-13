import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, ShieldCheck, CheckCircle2, Clock, Award, Wrench, MonitorPlay, Printer, Search, Phone, Box } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProductImage from '../../components/ProductImage.jsx';
import { normalizeProductImages } from '../../utils/media.js';
import { API_V1_URL } from '../../utils/api.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 p-10 font-bold">ERROR: {this.state.error.message} <br/> {this.state.error.stack}</div>;
    }
    return this.props.children;
  }
}

const HomePageRender = () => {
  const [products, setProducts] = useState([]);
  const [publicReviews, setPublicReviews] = useState([]);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [trackingInput, setTrackingInput] = useState('');
  const [stats, setStats] = useState([
    { value: '10.000+', label: 'Thiết bị đã xử lý' },
    { value: '4.9/5', label: 'Điểm đánh giá khách hàng' },
    { value: '95%', label: 'Hoàn tất trong ngày' },
    { value: '30 phút', label: 'Thời gian phản hồi nội thành' },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_V1_URL}/products`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data.slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch products');
      }
    };
    
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_V1_URL}/public/stats`);
        const data = await res.json();
        if (data.success) {
          setStats([
            { value: data.data.devicesRepaired, label: 'Thiết bị đã xử lý' },
            { value: data.data.avgRating, label: 'Điểm đánh giá khách hàng' },
            { value: data.data.completionRate, label: 'Hoàn tất trong ngày' },
            { value: data.data.responseTime, label: 'Thời gian phản hồi nội thành' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch stats');
      }
    };

    const fetchPublicReviews = async () => {
      try {
        const res = await fetch('/api/v1/public/reviews');
        const data = await res.json();
        if (data.success) {
          setPublicReviews(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch public reviews');
      }
    };

    fetchProducts();
    fetchStats();
    fetchPublicReviews();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleTrackingSearch = () => {
    if (!trackingInput.trim()) return;
    navigate(`/tra-cuu?q=${encodeURIComponent(trackingInput.trim())}`);
  };

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section - 3D Exploded Hardware View */}
      <section className="relative pt-20 pb-48 px-4 overflow-hidden bg-[#050810] text-white">
        {/* 3D Space Background */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#050810_100%)]" />
           {/* Deep Space Grid */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)] opacity-40" />
        </div>

        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            
            {/* Left Column: Blueprint Content (Restored) */}
            <div className="lg:w-3/5 text-left relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-[1px] w-12 bg-blue-500/50" />
                <span className="text-[10px] font-mono text-blue-400 tracking-[0.5em] uppercase">Hệ_thống.Khởi_tạo.118</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.85] tracking-tighter">
                SỬA CHỮA <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">VƯỢT XA</span> <br/>
                GIỚI HẠN.
              </h1>
              
              <p className="text-slate-500 text-lg md:text-xl max-w-lg mb-12 font-medium leading-relaxed border-l-2 border-blue-500/20 pl-6">
                Giải mã mọi sự cố phần cứng với độ chính xác tuyệt đối. 
                Chúng tôi không chỉ sửa chữa, chúng tôi tối ưu hóa thiết bị của bạn.
              </p>

              <div className="flex items-center gap-6">
                <Link to="/dich-vu" className="group px-10 py-5 bg-blue-600 text-white font-black rounded-sm skew-x-[-12deg] transition-all hover:skew-x-0 hover:bg-blue-500 shadow-[10px_10px_0px_rgba(37,99,235,0.2)]">
                  <span className="skew-x-[12deg] group-hover:skew-x-0 block flex items-center gap-2 tracking-widest">
                    ĐẶT LỊCH NGAY <ArrowRight className="w-5 h-5" />
                  </span>
                </Link>
                <Link to="/tra-cuu" className="text-sm font-black tracking-widest text-slate-400 hover:text-white transition-colors flex items-center gap-2 underline underline-offset-8 decoration-blue-500/30">
                  TRA CỨU MÁY <Search className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: High-End Interactive Module Stack */}
            <div className="lg:w-2/5 flex flex-col gap-6 relative">
              {/* Vertical Connector Line */}
              <div className="absolute left-[27px] top-10 bottom-10 w-[1px] bg-gradient-to-b from-blue-500/0 via-blue-500/40 to-blue-500/0 hidden sm:block" />

              {[
                { 
                  title: 'SIÊU TỐC', 
                  desc: 'Phản hồi & xử lý trong 30-60 phút đầu tiên.', 
                  icon: <Clock />, 
                  meta: 'STATUS: ACTIVE' 
                },
                { 
                  title: 'CHÍNH HÃNG', 
                  desc: 'Cam kết 100% linh kiện gốc, nguồn gốc rõ ràng.', 
                  icon: <CheckCircle2 />, 
                  meta: 'VERIFIED: 100%' 
                },
                { 
                  title: 'BẢO HÀNH', 
                  desc: 'Hỗ trợ dài hạn từ 3 đến 12 tháng sử dụng.', 
                  icon: <Award />, 
                  meta: 'SECURE: YES' 
                },
                { 
                  title: 'MINH BẠCH', 
                  desc: 'Báo giá tức thì, theo dõi tiến độ thời gian thực.', 
                  icon: <Search />, 
                  meta: 'FEED: LIVE' 
                },
              ].map((item, idx) => (
                <div key={idx} className="group relative bg-[#ffffff03] hover:bg-[#ffffff07] border border-white/5 p-5 rounded-2xl transition-all duration-500 cursor-pointer flex items-center gap-6 overflow-hidden backdrop-blur-sm">
                  {/* Glossy Reflection Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {/* Icon Module */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-500 z-10 relative">
                      {React.cloneElement(item.icon, { className: "w-7 h-7 group-hover:scale-110 group-hover:rotate-[10deg] transition-transform" })}
                    </div>
                    {/* Pulsing Connector Dot */}
                    <div className="absolute top-1/2 -left-[31px] w-2 h-2 bg-blue-500 rounded-full -translate-y-1/2 shadow-[0_0_10px_#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </div>

                  {/* Content Module */}
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-sm text-white tracking-[0.2em] group-hover:text-blue-400 transition-colors uppercase">{item.title}</h3>
                      <span className="text-[8px] font-mono text-slate-600 group-hover:text-blue-500 transition-colors tracking-tighter">{item.meta}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold group-hover:text-slate-300 transition-colors leading-tight">{item.desc}</p>
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute top-0 right-0 w-8 h-8 opacity-10">
                    <div className="absolute top-2 right-2 w-[1px] h-2 bg-white" />
                    <div className="absolute top-2 right-2 w-2 h-[1px] bg-white" />
                  </div>
                </div>
              ))}

              {/* Data Stream Decoration */}
              <div className="absolute -bottom-20 right-0 font-mono text-[7px] text-blue-500/10 select-none leading-none tracking-tighter pointer-events-none">
                010101010111010101010101010101110101010101010101011101010101010101010111010101<br/>
                SYSTEM_STABLE_UPTIME_99.99%_READY_FOR_REPAIR_OPERATION_STATION_118_AUTH_OK
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2.5 Interactive Expanding Accordion Showcase */}

      {/* 2.5 Interactive Expanding Accordion Showcase */}
      {/* 2.5 Interactive Expanding Accordion Showcase */}
      <section className="py-24 px-4 bg-[#f8fafc] overflow-hidden border-y border-slate-100">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6">
              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="text-sm font-bold text-blue-700 tracking-wider uppercase">Giá trị cốt lõi</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              Chất lượng đến từ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">sự tỉ mỉ</span>.
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Chúng tôi áp dụng quy trình kiểm soát khắt khe nhất để thiết bị của bạn luôn đạt trạng thái hoàn hảo.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:h-[500px] lg:h-[600px] w-full">
            {[
              { 
                id: 0, title: 'Độ chính xác cao', 
                desc: 'Sử dụng hệ thống chẩn đoán tiên tiến nhất. Bắt đúng bệnh, báo đúng giá, không vẽ thêm lỗi.',
                icon: <Search className="w-6 h-6" />, color: 'from-blue-600 to-indigo-600',
                image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80'
              },
              { 
                id: 1, title: 'Linh kiện chọn lọc', 
                desc: 'Cam kết 100% linh kiện Grade A+ rõ ràng nguồn gốc. Hoạt động bền bỉ, an toàn tuyệt đối.',
                icon: <Box className="w-6 h-6" />, color: 'from-amber-500 to-orange-600',
                image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80'
              },
              { 
                id: 2, title: 'Kỹ thuật viên 5 sao', 
                desc: 'Đội ngũ tay nghề cao, được đào tạo chuyên sâu từ các hãng lớn. Xử lý triệt để mọi pan bệnh khó.',
                icon: <Award className="w-6 h-6" />, color: 'from-emerald-500 to-teal-600',
                image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80'
              },
              { 
                id: 3, title: 'Bảo hành trách nhiệm', 
                desc: 'Chính sách bảo hành rõ ràng từ 3-12 tháng. Hỗ trợ nhiệt tình ngay cả khi thiết bị hết hạn bảo hành.',
                icon: <ShieldCheck className="w-6 h-6" />, color: 'from-purple-600 to-pink-600',
                image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
              }
            ].map((item, idx) => {
              const isActive = activeFeatureIndex === idx;
              return (
                <div 
                  key={item.id}
                  onMouseEnter={() => setActiveFeatureIndex(idx)}
                  onClick={() => setActiveFeatureIndex(idx)}
                  className={`relative rounded-[2rem] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer group
                    ${isActive ? 'md:flex-[4] flex-[4] shadow-2xl' : 'md:flex-[1] flex-[1] shadow-md'}
                    min-h-[140px] md:min-h-0
                  `}
                >
                  {/* Background Image */}
                  <div 
                    className={`absolute inset-0 bg-cover bg-center transition-transform duration-1000 ${isActive ? 'scale-105' : 'scale-100 grayscale-[30%]'}`}
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  
                  {/* Overlays */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${isActive ? 'from-slate-900/95 via-slate-900/40' : 'from-slate-900/90'} to-transparent transition-all duration-500`} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} mix-blend-multiply transition-opacity duration-500 ${isActive ? 'opacity-50' : 'opacity-80'}`} />
                  
                  {/* Content Container */}
                  <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                     {/* Icon */}
                     <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4 md:mb-6 border border-white/30 transition-all duration-500 origin-bottom-left
                       ${isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-50'}
                     `}>
                       {item.icon}
                     </div>
                     
                     {/* Text Area */}
                     <div className="relative">
                        {/* Title */}
                        <h3 className={`text-xl md:text-3xl font-bold text-white transition-all duration-500 whitespace-nowrap
                          ${isActive ? 'translate-x-0' : 'md:opacity-0'}
                        `}>
                          {item.title}
                        </h3>
                        
                        {/* Vertical Title (Only visible on Desktop when not active) */}
                        {!isActive && (
                           <div className="hidden md:block absolute bottom-0 left-0 origin-bottom-left -rotate-90 translate-x-4 -translate-y-12">
                             <h3 className="text-xl font-bold text-white whitespace-nowrap tracking-wider">
                               {item.title}
                             </h3>
                           </div>
                        )}

                        {/* Description */}
                        <div className={`grid transition-all duration-500 ease-in-out ${isActive ? 'grid-rows-[1fr] mt-3 opacity-100' : 'grid-rows-[0fr] mt-0 opacity-0'}`}>
                          <p className="text-slate-200/90 font-medium leading-relaxed overflow-hidden text-sm md:text-lg">
                            {item.desc}
                          </p>
                        </div>
                     </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-16 text-center">
             <Link to="/dich-vu" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-1 transition-all">
               Khám phá quy trình của chúng tôi <ArrowRight className="w-5 h-5" />
             </Link>
          </div>
        </div>
      </section>

      {/* 3. Dịch Vụ Nổi Bật */}
      <section className="py-24 px-4 bg-white relative">
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="font-bold text-blue-600 tracking-wider text-sm mb-4 uppercase">Dịch vụ của chúng tôi</p>
          <h2 className="text-4xl font-black text-gray-900 mb-6">Dịch Vụ Nổi Bật Tại 118</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-16">Hỗ trợ trọn gói từ cài đặt, sửa chữa, đến nâng cấp và lắp đặt hệ thống an ninh.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-blue-50/30 p-10 rounded-[32px] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-blue-50">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/30">
                <MonitorPlay className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-2xl text-gray-900 mb-4 tracking-tight">Sửa Chữa PC & Laptop</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">Khắc phục nhanh sự cố phần cứng, phần mềm. Nâng cấp hiệu suất và bảo mật dữ liệu tuyệt đối cho thiết bị của bạn.</p>
              <Link to="/dich-vu" className="text-blue-600 font-bold flex items-center gap-2 group">
                Tìm hiểu thêm <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-purple-50/30 p-10 rounded-[32px] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-purple-50">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-600/30">
                <Printer className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-2xl text-gray-900 mb-4 tracking-tight">Thiết Bị Văn Phòng & Mạng</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">Sửa lỗi máy in, cài đặt hệ thống mạng nội bộ LAN/Wifi. Giải pháp hạ tầng IT cho doanh nghiệp vừa và nhỏ.</p>
              <Link to="/dich-vu" className="text-blue-600 font-bold flex items-center gap-2 group">
                Tìm hiểu thêm <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-emerald-50/30 p-10 rounded-[32px] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-emerald-50">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-600/30">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-2xl text-gray-900 mb-4 tracking-tight">Thi Công Camera An Ninh</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">Lắp đặt hệ thống camera giám sát chất lượng cao. Theo dõi từ xa 24/7, bảo hành dài hạn, hỗ trợ kỹ thuật trọn đời.</p>
              <Link to="/giai-phap-camera" className="text-blue-600 font-bold flex items-center gap-2 group">
                Tìm hiểu thêm <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Products Section — Editorial Bento */}
      <section className="py-20 px-4 bg-[#f5f5f7]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-2">Sản phẩm linh kiện</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Sản Phẩm Bán Chạy</h2>
            </div>
            <Link
              to="/cua-hang"
              className="group hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Xem tất cả <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Clean Symmetrical Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => {
              const imageSources = normalizeProductImages(product.image_url);
              const hasDiscount = Number(product.original_price) > Number(product.price);
              
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/san-pham/${product.id}`)}
                  className="group bg-white rounded-3xl overflow-hidden cursor-pointer hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col border border-transparent hover:border-blue-100"
                >
                  {/* Image Container */}
                  <div className="bg-gray-50/50 aspect-[4/3] flex items-center justify-center p-6 lg:p-8 relative">
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      {product.is_hot && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-3 py-1 rounded-full w-max">
                          HOT
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-3 py-1 rounded-full w-max">
                          -{Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)}%
                        </span>
                      )}
                    </div>

                    <ProductImage
                      imageSources={imageSources}
                      alt={product.name}
                      containerClassName="w-full h-full relative z-0"
                      imgClassName="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-darken"
                      fallbackClassName="w-full h-full flex items-center justify-center text-gray-200"
                      fallbackContent={<MonitorPlay className="w-12 h-12" />}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1.5">
                      {product.category?.name || 'Sản Phẩm'}
                    </div>
                    <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Footer section (Price + Action) */}
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
                      <div>
                        {hasDiscount && (
                          <div className="text-[11px] text-gray-400 line-through font-medium mb-0.5">
                            {formatPrice(product.original_price)}
                          </div>
                        )}
                        <div className="text-lg lg:text-xl font-black text-gray-900 tracking-tight">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-blue-600 flex items-center justify-center transition-all duration-300">
                         <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-white group-hover:-rotate-45 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Skeleton Fallback */}
            {products.length === 0 && Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-gray-100 flex flex-col animate-pulse">
                <div className="bg-gray-50 aspect-[4/3] w-full" />
                <div className="p-5 flex-1 flex flex-col justify-end space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-6 bg-gray-100 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile "Xem tất cả" */}
          <div className="mt-6 text-center sm:hidden">
            <Link to="/cua-hang" className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600">
              Xem tất cả sản phẩm <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Tra Cứu Banner */}
      <section className="py-24 px-4 bg-gray-50 relative overflow-hidden">
        {/* Background elements to integrate the banner seamlessly */}
        <div className="absolute top-1/2 left-0 w-[40%] h-[500px] bg-indigo-200 rounded-full blur-[120px] opacity-20 -translate-y-1/2 -translate-x-1/2 mix-blend-multiply" />
        <div className="absolute top-1/2 right-0 w-[40%] h-[500px] bg-blue-200 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2 mix-blend-multiply" />
        
        <div className="max-w-[1200px] mx-auto bg-gradient-to-br from-indigo-900 via-[#111827] to-[#0f172a] rounded-[48px] p-10 md:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-16 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border border-white/10 group">
          
          {/* Animated Glowing Orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000 -translate-y-1/2 translate-x-1/4 mix-blend-screen pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[80px] opacity-30 translate-y-1/3 -translate-x-1/4 mix-blend-screen pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
          
          <div className="relative z-10 w-full max-w-xl text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:block"></span>
              <span className="font-extrabold tracking-widest text-xs uppercase text-indigo-200">Hỗ Trợ Nhanh 24/7</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
              Kiểm Tra Tiến Độ<br />Sửa Chữa
            </h2>
            <p className="text-indigo-200/80 mb-10 text-lg md:text-xl font-light leading-relaxed max-w-lg">
              Nhập số điện thoại hoặc mã biên nhận để theo dõi trạng thái thiết bị của bạn theo thời gian thực.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 relative">
              <div className="relative w-full shadow-lg group/input">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-hover/input:text-white transition-colors z-10" />
                <input 
                  type="text" 
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackingSearch()}
                  placeholder="Nhập SĐT hoặc Mã (VD: RCV-118...)" 
                  className="w-full pl-14 pr-4 py-4 rounded-3xl bg-white/5 border border-white/20 text-white focus:bg-white/10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 backdrop-blur-xl outline-none placeholder:text-indigo-300/50 transition-all font-medium text-lg"
                />
              </div>
              <button 
                onClick={handleTrackingSearch}
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-3xl font-bold transition-all whitespace-nowrap shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1 transform border border-indigo-400/50"
              >
                Tra Cứu Ngay
              </button>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-[350px] aspect-square flex items-center justify-center transform group-hover:scale-105 transition-transform duration-700 mx-auto lg:mx-0">
             {/* Rotating dashed ring */}
             <div className="absolute inset-0 border-[3px] border-dashed border-indigo-400/30 rounded-full animate-[spin_30s_linear_infinite]" />
             <div className="absolute inset-4 border border-indigo-400/20 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
             
             {/* Central floating box */}
             <div className="w-40 h-40 bg-gradient-to-br from-indigo-50 to-white rounded-[32px] rotate-12 flex items-center justify-center shadow-2xl relative z-20 group-hover:-rotate-12 transition-transform duration-700 ease-out border-4 border-white/50 backdrop-blur">
               <Wrench className="w-20 h-20 text-indigo-600 drop-shadow-md" />
             </div>
             
             {/* Floating badge 1 */}
             <div className="absolute top-10 right-10 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] transform rotate-[15deg] group-hover:-translate-y-4 transition-transform duration-500 z-30 animate-bounce">
               <span className="text-2xl">⚡</span>
             </div>
             
             {/* Floating badge 2 */}
             <div className="absolute bottom-16 left-8 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.3)] transform rotate-[-12deg] group-hover:translate-y-3 transition-transform duration-500 z-30">
               <CheckCircle2 className="w-6 h-6 text-white" />
             </div>
          </div>
        </div>
      </section>

    </div>
  );
};

const HomePage = () => (
  <ErrorBoundary>
    <HomePageRender />
  </ErrorBoundary>
);

export default HomePage;
