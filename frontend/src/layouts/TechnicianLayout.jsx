import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Menu, X, Wrench, FolderOpen, ChevronRight
} from 'lucide-react';

const TechnicianLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      navigate('/dang-nhap');
      return;
    }
    try {
      const parsed = JSON.parse(userData);
      // Ensure only technician or admin can access
      if (parsed.role !== 'technician' && parsed.role !== 'admin') {
        navigate('/');
        return;
      }
      setUser(parsed);
    } catch {
      navigate('/dang-nhap');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/dang-nhap';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f6f8ff] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto border-r border-white/10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">CỬA HÀNG 118</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Kỹ Thuật Viên</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            to="/ky-thuat-vien"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/ky-thuat-vien'
                ? 'bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-700/30'
                : 'text-gray-300 hover:text-white hover:bg-white/8'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Bảng Điều Khiển
          </Link>
        </nav>

        <div className="px-3 pb-4 border-t border-white/10 pt-4 mt-auto">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all mb-1">
            <FolderOpen className="w-5 h-5" /> Về Trang Chủ
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all w-full">
            <LogOut className="w-5 h-5" /> Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 glass border-b border-white/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 border border-gray-200">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
            <span>Kỹ Thuật Viên</span> <ChevronRight className="w-4 h-4" />
            <span className="text-gray-800 font-semibold">Bảng Điều Khiển</span>
          </div>

          <div className="flex items-center justify-end flex-1 lg:flex-none gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
              <div className="text-xs text-indigo-600 font-medium tracking-wide pb-0.5">Technician</div>
            </div>
            <div className="w-10 h-10 bg-linear-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
              {user.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TechnicianLayout;
