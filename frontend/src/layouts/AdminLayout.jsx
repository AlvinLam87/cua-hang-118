import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Settings, ClipboardList, Calendar,
  Users, LogOut, Menu, X, Wrench, ChevronRight, FolderOpen, Star, Ticket, ShoppingBag
} from 'lucide-react';
import { io } from 'socket.io-client';
import { API_V1_URL, API_BASE_URL } from '../utils/api.js';

const sidebarLinks = [
  { to: '/admin', label: 'Tổng Quan', icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
  { to: '/admin/san-pham', label: 'Sản Phẩm & Kho', icon: <Package className="w-5 h-5" /> },
  { to: '/admin/don-hang', label: 'Đơn Bán Hàng', icon: <ShoppingBag className="w-5 h-5" /> },
  { to: '/admin/dich-vu', label: 'Dịch Vụ', icon: <Settings className="w-5 h-5" /> },
  { to: '/admin/don-sua-chua', label: 'Đơn Sửa Chữa', icon: <ClipboardList className="w-5 h-5" />, key: 'repair' },
  { to: '/admin/dat-lich', label: 'Lịch Hẹn', icon: <Calendar className="w-5 h-5" />, key: 'booking' },
  { to: '/admin/khach-hang', label: 'Khách Hàng', icon: <Users className="w-5 h-5" /> },
  { to: '/admin/ky-thuat-vien', label: 'Kỹ Thuật Viên', icon: <Wrench className="w-5 h-5" /> },
  { to: '/admin/danh-gia', label: 'Đánh Giá', icon: <Star className="w-5 h-5" /> },
  { to: '/admin/vouchers', label: 'Mã Giảm Giá', icon: <Ticket className="w-5 h-5" /> },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState({ repair: 0, booking: 0 });
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
      if (parsed.role !== 'admin') {
        navigate('/');
        return;
      }
      setUser(parsed);
    } catch {
      navigate('/dang-nhap');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_V1_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNotifications({
            repair: data.data.activeRepairs || 0,
            booking: data.data.pendingBookings || 0
          });
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông báo:', err);
      }
    };

    fetchStats();

    // ── Socket.io: Re-fetch stats on any change ──────────────────
    const getSocketUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
          return `http://${hostname}:3001`;
        }
      }
      return import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
    };
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10
    });

    socket.on('connect', () => {
      console.log('✅ [Socket] Admin Layout connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket] Connection error:', err.message);
    });

    const handleUpdate = (data) => {
      console.log('🔄 [Socket] Data change detected, notifying all pages:', data);
      fetchStats();
      // Dispatch a global event for sub-pages to refresh
      window.dispatchEvent(new CustomEvent('admin-data-update', { detail: data }));
    };

    socket.on('new_booking', handleUpdate);
    socket.on('technician_update', handleUpdate);
    socket.on('new_repair_order', handleUpdate);
    socket.on('data_changed', handleUpdate);

    return () => {
      console.log('🔌 [Socket] Admin Layout disconnecting');
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/dang-nhap';
  };

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f6f8ff] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto border-r border-white/10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">CỬA HÀNG 118</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(link)
                  ? 'bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-700/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/8'
              }`}
            >
              <div className="flex items-center gap-3">
                {link.icon}
                {link.label}
              </div>
              
              {link.key && notifications[link.key] > 0 && (
                <div className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
                  {notifications[link.key]}
                </div>
              )}
            </Link>
          ))}
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 glass border-b border-white/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 border border-gray-200">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
            <span>Admin</span> <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-semibold">{sidebarLinks.find(l => isActive(l))?.label || 'Tổng Quan'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold border border-blue-200">
              {user.full_name?.charAt(0)}
            </div>
            <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user.full_name}</span>
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

export default AdminLayout;
