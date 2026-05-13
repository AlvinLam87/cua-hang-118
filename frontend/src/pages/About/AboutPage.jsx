import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Users, Target, Award, Star, PhoneCall, CheckCircle2, MapPin, Clock } from 'lucide-react';

const stats = [
  { value: '500+', label: 'Khách hàng phục vụ', color: 'text-blue-600' },
  { value: '5+', label: 'Năm kinh nghiệm', color: 'text-indigo-600' },
  { value: '99%', label: 'Hài lòng', color: 'text-emerald-600' },
  { value: '24/7', label: 'Hỗ trợ khẩn cấp', color: 'text-amber-600' },
];

const values = [
  { icon: <Target className="w-6 h-6" />, title: 'Sứ Mệnh', desc: 'Mang đến dịch vụ IT chất lượng cao, giá cả hợp lý cho mọi gia đình và doanh nghiệp.' },
  { icon: <Award className="w-6 h-6" />, title: 'Chất Lượng', desc: 'Luôn sử dụng linh kiện chính hãng, bảo hành dài hạn và cam kết sửa đúng bệnh.' },
  { icon: <Users className="w-6 h-6" />, title: 'Đội Ngũ', desc: 'Kỹ thuật viên được đào tạo bài bản, nhiều năm kinh nghiệm xử lý các tình huống phức tạp.' },
  { icon: <Star className="w-6 h-6" />, title: 'Uy Tín', desc: 'Được hàng trăm khách hàng tin tưởng, đánh giá 5 sao trên các nền tảng review.' },
];

const AboutPage = () => {
  return (
    <div>
      {/* Hero */}
      <section className="bg-slate-900 pt-16 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500 rounded-full filter blur-[180px] opacity-10" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500 rounded-full filter blur-[150px] opacity-10" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-block text-blue-400 font-bold text-sm tracking-wider uppercase mb-3">Về Chúng Tôi</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Cửa Hàng 118 – Đối Tác IT Tin Cậy
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Chúng tôi tự hào là đơn vị tiên phong cung cấp dịch vụ sửa chữa máy tính, lắp đặt camera an ninh 
            và bảo trì hệ thống IT cho gia đình & doanh nghiệp tại khu vực.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12 z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100 text-center">
                <p className={`text-3xl font-extrabold ${s.color} mb-1`}>{s.value}</p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-bold text-sm tracking-wider uppercase">Câu Chuyện Của Chúng Tôi</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-3 mb-6">
                Từ cửa hàng nhỏ đến đối tác IT đáng tin cậy
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  <b className="text-gray-900">Cửa Hàng 118</b> được thành lập với mong muốn mang đến cho khách hàng dịch vụ sửa chữa 
                  và hỗ trợ công nghệ thông tin chất lượng cao nhất. Với đội ngũ kỹ thuật viên giàu kinh nghiệm, 
                  chúng tôi đã phục vụ hàng trăm khách hàng cá nhân và doanh nghiệp trong khu vực.
                </p>
                <p>
                  Không chỉ dừng lại ở sửa chữa, chúng tôi còn cung cấp giải pháp toàn diện bao gồm lắp đặt 
                  camera an ninh, thiết kế hệ thống mạng nội bộ, tư vấn nâng cấp thiết bị và cung cấp linh kiện chính hãng.
                </p>
                <p>
                  Với cam kết <b className="text-blue-600">"Uy tín – Nhanh chóng – Chuyên nghiệp"</b>, chúng tôi luôn nỗ lực
                  để trở thành người bạn đồng hành đáng tin cậy nhất trong lĩnh vực công nghệ cho mọi nhà.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map((v, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-900/5 transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                    {v.icon}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{v.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-12">Tại sao chọn Cửa Hàng 118?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <CheckCircle2 className="w-8 h-8" />, title: 'Bảo Hành Chính Hãng', desc: 'Mọi linh kiện thay thế đều có bảo hành rõ ràng. Sửa xong không hài lòng – hoàn tiền 100%.' },
              { icon: <Clock className="w-8 h-8" />, title: 'Nhanh Chóng, Đúng Hẹn', desc: 'Cam kết thời gian xử lý nhanh nhất. Hỗ trợ s/c ngoài giờ và sửa tận nơi theo yêu cầu.' },
              { icon: <MapPin className="w-8 h-8" />, title: 'Phục Vụ Tận Nơi', desc: 'Đội ngũ kỹ thuật viên sẵn sàng đến tận nhà/văn phòng để khắc phục sự cố nhanh chóng.' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-5">
                  {item.icon}
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-3">{item.title}</h4>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Sẵn sàng trải nghiệm dịch vụ?</h2>
          <p className="text-blue-100 text-lg mb-8">Liên hệ ngay để được tư vấn miễn phí và đặt lịch hẹn sửa chữa.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/lien-he" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              Đặt Lịch Ngay
            </Link>
            <a href="tel:0704818118" className="px-8 py-4 border-2 border-white/40 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <PhoneCall className="w-5 h-5" /> Gọi Hotline
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
