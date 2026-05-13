import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Settings, ShoppingBag, Search, MapPin, Phone, Wrench, MessageSquare, LogOut, ShoppingCart, User, MessageCircle, Camera } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

const MainLayout = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const user = (() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/dang-nhap');
    window.location.reload();
  };

  const navLinks = [
    { name: 'Trang Chủ', path: '/', icon: Home },
    { name: 'Sửa Chữa', path: '/dich-vu', icon: Wrench },
    { name: 'Camera', path: '/giai-phap-camera', icon: Camera },
    { name: 'Sản Phẩm', path: '/cua-hang', icon: ShoppingBag },
    { name: 'Liên Hệ', path: '/lien-he', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8ff] flex flex-col font-sans relative">
      <header className="sticky top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[88px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group pr-4">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <Wrench className="text-white w-5 h-5 drop-shadow-md" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all">Cửa Hàng 118</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">IT Services & Security</span>
              </div>
            </Link>

            {/* Navigation (Center) */}
            <nav className="hidden lg:flex items-center gap-1 p-1.5 rounded-full bg-white/85 border border-gray-100 shadow-[0_10px_28px_-18px_rgba(30,64,175,0.4)]">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Actions (Right) */}
            <div className="hidden md:flex items-center gap-3 p-1.5 rounded-full bg-white/85 border border-gray-100 shadow-[0_10px_28px_-18px_rgba(30,64,175,0.35)]">
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3.5 py-2 rounded-full">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm whitespace-nowrap">0704.818.118</span>
              </div>

              {/* Shopping Cart */}
              <Link to="/gio-hang" className="relative p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors group">
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute 1 top-0 right-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1 shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <div className="w-px h-6 bg-gray-200" />
              
              {user ? (
                 <div className="flex items-center gap-3">
                   {user.role === 'admin' && (
                     <Link to="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition whitespace-nowrap px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-full">
                       Quản trị Admin
                     </Link>
                   )}
                   {user.role === 'technician' && (
                     <Link to="/ky-thuat-vien" className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition whitespace-nowrap px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-full">
                       Kỹ thuật viên
                     </Link>
                   )}
                   <Link to="/ho-so" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-blue-50 transition">
                     <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                       {user.full_name?.charAt(0) || <User className="w-4 h-4" />}
                     </div>
                     <span className="text-sm font-bold text-gray-700 hidden xl:block whitespace-nowrap">{user.full_name}</span>
                   </Link>
                   <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition" title="Đăng xuất"><LogOut className="w-5 h-5"/></button>
                 </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/dang-nhap" className="text-sm font-bold text-gray-600 hover:text-blue-700 transition whitespace-nowrap px-3.5 py-2 rounded-full hover:bg-blue-50">Đăng Nhập</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full bg-transparent">
        <Outlet />
      </main>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 p-2 md:hidden">
        <div className="grid grid-cols-4 gap-2">
          <a href="tel:0704818118" className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-gray-500 hover:text-blue-600 font-bold text-[10px]">
             <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
             Gọi Ngay
          </a>
          <Link to="/dich-vu" className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-gray-500 hover:text-blue-600 font-bold text-[10px]">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Wrench className="w-4 h-4" /></div>
            Đặt Lịch
          </Link>
          <Link to="/tra-cuu" className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-gray-500 hover:text-blue-600 font-bold text-[10px]">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><Search className="w-4 h-4" /></div>
            Tra Cứu
          </Link>
          <Link to="/ho-so" className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-gray-500 hover:text-blue-600 font-bold text-[10px]">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center"><User className="w-4 h-4" /></div>
            Hồ Sơ
          </Link>
        </div>
      </div>

      {/* Floating Action Buttons đã được loại bỏ theo yêu cầu */}

      <footer className="bg-[#1a1f2c] text-gray-300 pt-16 pr-8 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Wrench className="text-white w-4 h-4" />
                </div>
                <span className="text-xl font-black text-white leading-tight uppercase tracking-tight">Cửa Hàng 118</span>
              </div>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Chuyên sửa chữa máy tính, lắp đặt camera an ninh và bảo trì thiết bị văn phòng. Uy tín - Nhanh chóng - Chuyên nghiệp.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                  <MessageSquare className="w-4 h-4 text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                  <Phone className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Dịch Vụ</h4>
              <ul className="space-y-4">
                <li><Link to="/dich-vu" className="text-sm text-gray-400 hover:text-white transition-colors">Sửa chữa PC & Laptop</Link></li>
                <li><Link to="/dich-vu" className="text-sm text-gray-400 hover:text-white transition-colors">Bảo trì máy in & mạng</Link></li>
                <li><Link to="/giai-phap-camera" className="text-sm text-gray-400 hover:text-white transition-colors">Lắp đặt Camera An Ninh</Link></li>
                <li><Link to="/dich-vu" className="text-sm text-gray-400 hover:text-white transition-colors">Nâng cấp linh kiện</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Liên Kết</h4>
              <ul className="space-y-4">
                <li><Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">Trang Chủ</Link></li>
                <li><Link to="/cua-hang" className="text-sm text-gray-400 hover:text-white transition-colors">Sản Phẩm Linh Kiện</Link></li>
                <li><Link to="/tra-cuu" className="text-sm text-gray-400 hover:text-white transition-colors">Tra Cứu Tiến Độ</Link></li>
                <li><Link to="/lien-he" className="text-sm text-gray-400 hover:text-white transition-colors">Liên Hệ & Đặt Lịch</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Liên Hệ</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-400">55, Cách Mạng, Phường Bạc Liêu, Tỉnh Cà Mau</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-400">0704.818.118</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-400">support@cuahang118.vn</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 text-center md:text-left">
              © 2026 Cửa Hàng 118. Mọi quyền được bảo lưu.
            </p>
            <p className="text-sm text-gray-500">
              Thiết kế bởi Đội Ngũ 118 Tech
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
