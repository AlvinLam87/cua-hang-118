import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Package, CalendarDays, Mail, Shield, Award, Gift } from 'lucide-react';

const ProfileSidebar = ({ user }) => {
  const location = useLocation();

  if (!user) return null;

  const menuItems = [
    { label: 'Hồ Sơ Cá Nhân', icon: User, path: '/ho-so' },
    { label: 'Đổi Điểm Thưởng', icon: Gift, path: '/doi-diem' },
    { label: 'Lịch Sử Đặt Lịch', icon: CalendarDays, path: '/lich-su-dat-lich' },
    { label: 'Đơn Hàng Linh Kiện', icon: Package, path: '/lich-su-don-hang' },
  ];

  return (
    <div className="w-full lg:w-80 shrink-0 space-y-6">
      {/* User Profile Summary Card */}
      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-t-[32px]"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center mt-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-blue-500/40 mb-5 relative">
            {user.full_name?.charAt(0) || 'U'}
            {user.role === 'admin' && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full border-4 border-white flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{user.full_name || 'Người Dùng'}</h2>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium bg-gray-50 px-3 py-1 rounded-full overflow-hidden w-full justify-center mb-2">
            <Mail className="w-4 h-4 shrink-0" /> 
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 shadow-sm shadow-amber-900/5 group/points hover:scale-105 transition-transform cursor-default">
            <Award className="w-5 h-5 text-amber-500 group-hover/points:rotate-12 transition-transform" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Điểm Thưởng</span>
              <span className="text-lg font-black leading-none">{user.points || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white rounded-[32px] p-4 border border-gray-100 shadow-xl shadow-blue-900/5 space-y-1">
        {menuItems.map((menu, idx) => {
          const isActive = location.pathname === menu.path;
          return (
            <Link
              key={idx}
              to={menu.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold transition-all group ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <menu.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {menu.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileSidebar;
