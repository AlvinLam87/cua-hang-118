import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Settings, ClipboardList, Calendar, Users, Loader2, TrendingUp, AlertCircle, ArrowRight, Sparkles, ShieldCheck, Activity, DollarSign, Download } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState('month');

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const ts = Date.now();
      const res = await fetch(`/api/v1/admin/stats?t=${ts}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // ── Listen for global updates from AdminLayout ──────────────
    const handleGlobalUpdate = () => {
      console.log('⚡ [GlobalUpdate] Refreshing Dashboard Stats...');
      fetchStats();
    };

    window.addEventListener('admin-data-update', handleGlobalUpdate);
    return () => window.removeEventListener('admin-data-update', handleGlobalUpdate);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <span className="ml-3 text-gray-500 font-medium">Đang tải...</span>
    </div>
  );

  const cards = [
    { label: 'Sản phẩm', value: stats?.products || 0, icon: <Package className="w-6 h-6" />, color: 'from-blue-500 to-blue-600', link: '/admin/san-pham' },
    { label: 'Dịch vụ', value: stats?.services || 0, icon: <Settings className="w-6 h-6" />, color: 'from-indigo-500 to-indigo-600', link: '/admin/dich-vu' },
    { label: 'Đơn sửa chữa', value: stats?.orders || 0, icon: <ClipboardList className="w-6 h-6" />, color: 'from-teal-500 to-teal-600', link: '/admin/don-sua-chua' },
    { label: 'Lịch hẹn', value: stats?.bookings || 0, icon: <Calendar className="w-6 h-6" />, color: 'from-orange-500 to-orange-600', link: '/admin/dat-lich' },
    { label: 'Khách hàng', value: stats?.customers || 0, icon: <Users className="w-6 h-6" />, color: 'from-purple-500 to-purple-600', link: '/admin/khach-hang' },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const handleExportRevenue = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/admin/export-revenue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'doanh_thu.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Lỗi khi tải file báo cáo');
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8 rounded-3xl border border-blue-100 bg-linear-to-r from-blue-50/80 via-white to-indigo-50/80 p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 left-1/4 w-44 h-44 bg-indigo-200/30 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-blue-100 text-blue-700 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Admin Overview
            </p>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Tổng Quan Hệ Thống</h1>
            <p className="text-gray-600 mt-2">Theo dõi nhanh tình trạng vận hành cửa hàng, đơn sửa chữa và lịch hẹn trong ngày.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            <div className="bg-white/90 border border-gray-100 rounded-2xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold">Đơn đang xử lý</p>
              <p className="text-xl font-black text-blue-700 mt-1">{stats?.activeRepairs || 0}</p>
            </div>
            <div className="bg-white/90 border border-gray-100 rounded-2xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold">Lịch chờ xác nhận</p>
              <p className="text-xl font-black text-orange-600 mt-1">{stats?.pendingBookings || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/40 group">
          {/* Glowing Orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                <DollarSign className="w-6 h-6 text-emerald-300" />
              </div>
              <span className="text-emerald-50 font-bold tracking-widest uppercase text-xs opacity-90">Doanh thu tổng</span>
            </div>
            
            <div>
              <p className="text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-emerald-50 to-emerald-300 drop-shadow-sm">
                {formatPrice(stats?.totalRevenue)}
              </p>
            </div>

            <div className="mt-auto bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <p className="text-emerald-100/70 text-sm font-medium">Tổng cộng từ các đơn bán hàng và sửa chữa</p>
              <button 
                onClick={handleExportRevenue}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 group/btn border border-white/10 shadow-sm w-max hover:shadow-emerald-500/20"
                title="Xuất file Excel báo cáo doanh thu"
              >
                <Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                <span className="text-xs font-bold tracking-wide">Xuất Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Period Revenue */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40 group">
          {/* Glowing Orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-indigo-100 font-bold tracking-widest uppercase text-xs opacity-90">Theo thời gian</span>
            </div>
            
            <div>
              <p className="text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-50 to-indigo-300 drop-shadow-sm">
                {formatPrice(
                  revenuePeriod === 'week' ? stats?.thisWeekRevenue :
                  revenuePeriod === 'month' ? stats?.thisMonthRevenue :
                  stats?.thisYearRevenue
                )}
              </p>
            </div>

            <div className="mt-auto bg-black/20 backdrop-blur-xl border border-white/5 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <p className="text-indigo-200/60 text-sm font-medium pl-1">
                Doanh thu phát sinh trong {revenuePeriod === 'week' ? 'tuần này' : revenuePeriod === 'month' ? 'tháng này' : 'năm nay'}
              </p>
              
              {/* Period Tabs */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-max">
                {['week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setRevenuePeriod(period)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                      revenuePeriod === period
                        ? 'bg-indigo-500/80 text-white shadow-md border border-white/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {period === 'week' ? 'Tuần' : period === 'month' ? 'Tháng' : 'Năm'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-white rounded-3xl border border-gray-100 p-5 hover:shadow-xl hover:shadow-blue-100/50 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                {card.icon}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="text-3xl font-black text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 font-medium mt-1">{card.label}</div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 mt-4 overflow-hidden">
              <div className={`h-full rounded-full bg-linear-to-r ${card.color}`} style={{ width: `${Math.min(100, (card.value || 0) * 8)}%` }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.pendingBookings > 0 && (
          <div className="bg-white border border-orange-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-orange-800">{stats.pendingBookings} lịch hẹn chờ xác nhận</h3>
              <p className="text-orange-600 text-sm mt-1">Có khách hàng đang đợi phản hồi. Hãy xem và xác nhận ngay.</p>
              <Link to="/admin/dat-lich" className="text-orange-700 text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:underline">
                Xem lịch hẹn <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {stats?.activeRepairs > 0 && (
          <div className="bg-white border border-blue-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-blue-800">{stats.activeRepairs} đơn sửa chữa đang xử lý</h3>
              <p className="text-blue-600 text-sm mt-1">Cập nhật trạng thái cho khách hàng theo dõi tiến độ.</p>
              <Link to="/admin/don-sua-chua" className="text-blue-700 text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:underline">
                Xem đơn <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/admin/don-sua-chua" className="bg-white border border-gray-100 rounded-3xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900">Cập nhật tiến độ sửa chữa</h3>
          <p className="text-sm text-gray-500 mt-1">Theo dõi và cập nhật trạng thái xử lý thiết bị theo thời gian thực.</p>
        </Link>
        <Link to="/admin/dat-lich" className="bg-white border border-gray-100 rounded-3xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900">Điều phối lịch hẹn</h3>
          <p className="text-sm text-gray-500 mt-1">Xác nhận lịch mới và phân công kỹ thuật viên theo năng lực chuyên môn.</p>
        </Link>
        <Link to="/admin/ky-thuat-vien" className="bg-white border border-gray-100 rounded-3xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900">Quản lý đội ngũ kỹ thuật</h3>
          <p className="text-sm text-gray-500 mt-1">Theo dõi hồ sơ, kỹ năng và năng suất của kỹ thuật viên trong hệ thống.</p>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
