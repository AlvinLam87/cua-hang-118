import React, { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, CalendarClock, Wrench, User, CalendarDays, Phone, 
  CheckCircle2, Clock, MapPin, Search, TrendingUp, Package, 
  Camera, ArrowRight, DollarSign, Star, Info, X, ChevronRight, ShieldCheck
} from 'lucide-react';
import { io } from 'socket.io-client';
import { formatDate, formatDateTime } from '../../utils/format.js';
import { API_V1_URL, API_BASE_URL } from '../../utils/api.js';

const TechnicianDashboardPage = () => {
  const [data, setData] = useState({ repairs: [], bookings: [] });
  const [stats, setStats] = useState({ activeJobs: 0, completedMonth: 0, commission: 0, rating: 5.0 });
  const [loading, setLoading] = useState(true);
  const [invLoading, setInvLoading] = useState(false);
  const [invQuery, setInvQuery] = useState('');
  const [inventory, setInventory] = useState([]);
  const [activeTab, setActiveTab] = useState('repairs');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [actionModal, setActionModal] = useState({ show: false, repair: null, type: '' });
  const [actionFormData, setActionFormData] = useState({ diagnosis: '', estimated_cost: '' });

  // Customer warranty lookup states
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState([]);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetch(`${API_V1_URL}/technician/tasks`, { headers }),
        fetch(`${API_V1_URL}/technician/stats`, { headers })
      ]);
      const tasksResult = await tasksRes.json();
      const statsResult = await statsRes.json();
      
      if (tasksResult.success) setData(tasksResult.data);
      if (statsResult.success) setStats(statsResult.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchInventory = useCallback(async (q) => {
    if (!q) {
      setInventory([]);
      return;
    }
    setInvLoading(true);
    try {
      const res = await fetch(`${API_V1_URL}/technician/inventory?query=${encodeURIComponent(q)}`, { headers });
      const result = await res.json();
      if (result.success) setInventory(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setInvLoading(false);
    }
  }, [token]);

  const searchCustomerRepairs = useCallback(async (q) => {
    if (!q || q.trim().length < 6) {
      setCustomerSearchResults([]);
      return;
    }
    setCustomerSearchLoading(true);
    try {
      const res = await fetch(`${API_V1_URL}/technician/search?phone=${encodeURIComponent(q.trim())}`, { headers });
      const result = await res.json();
      if (result.success) {
        setCustomerSearchResults(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCustomerSearchLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();

    // ── Socket.io: Real-time update ──────────────────────────────
    const socketUrl = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });
    
    socket.on('connect', () => {
      console.log('✅ [Socket] KTV Dashboard connected');
    });

    socket.on('new_repair_order', (data) => {
      console.log('📡 [Socket] New repair order detected:', data);
      fetchData();
    });

    socket.on('technician_update', (data) => {
      console.log('📡 [Socket] Update from admin/other tech:', data);
      fetchData();
    });

    socket.on('data_changed', (data) => {
      console.log('📡 [Socket] System data changed:', data);
      fetchData();
    });

    socket.on('new_booking', () => {
      fetchData();
    });

    return () => {
      console.log('🔌 [Socket] KTV Dashboard disconnecting');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchInventory(invQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [invQuery, searchInventory]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchCustomerRepairs(customerQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [customerQuery, searchCustomerRepairs]);

  // Sync selectedRepair when data changes
  useEffect(() => {
    if (selectedRepair) {
      const updated = data.repairs.find(r => r.id === selectedRepair.id);
      if (updated) setSelectedRepair(updated);
    }
  }, [data.repairs]);

  const [saving, setSaving] = useState(false);

  const handleConfirmAction = async () => {
    const { repair, type } = actionModal;
    if (!repair) return;

    setSaving(true);
    try {
      // 1. Cập nhật dữ liệu (Chẩn đoán/Giá)
      const updateRes = await fetch(`${API_V1_URL}/technician/repairs/${repair.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(actionFormData)
      });
      const updateResult = await updateRes.json();

      if (!updateResult.success) {
        alert(updateResult.message);
        setSaving(false);
        return;
      }

      // 2. Chuyển bước
      const nextRes = await fetch(`${API_V1_URL}/technician/repairs/${repair.id}/next-step`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_cost: actionFormData.final_cost })
      });
      const nextResult = await nextRes.json();

      if (nextResult.success) {
        setActionModal({ show: false, repair: null, type: '' });
        fetchData();
      } else {
        alert(nextResult.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRepair = async (id, payload) => {
    try {
      const res = await fetch(`${API_V1_URL}/technician/repairs/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        await fetchData();
        return true;
      }
      alert(result.message);
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleNextStep = async (id, repairStatus) => {
    const rp = data.repairs.find(r => r.id === id);
    const FLOW = ['received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed'];
    const nextStatus = FLOW[FLOW.indexOf(repairStatus) + 1];

    // If moving to quoted: require diagnosis and estimated_cost
    if (nextStatus === 'quoted') {
      setActionFormData({ 
        diagnosis: rp.diagnosis || '', 
        estimated_cost: rp.estimated_cost || '' 
      });
      setActionModal({ show: true, repair: rp, type: 'quote' });
      return;
    }

    // If moving to completed: allow entering final_cost
    if (nextStatus === 'completed') {
      setActionFormData({
        final_cost: rp.final_cost || rp.estimated_cost || ''
      });
      setActionModal({ show: true, repair: rp, type: 'complete' });
      return;
    }

    try {
      const res = await fetch(`${API_V1_URL}/technician/repairs/${id}/next-step`, { 
        method: 'PATCH', 
        headers 
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handleUploadImage = async (id, file, type = 'before') => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      const res = await fetch(`${API_V1_URL}/technician/repairs/${id}/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const { repairs, bookings } = data;

  const STATUS_MAP = {
    received: { label: 'Đã nhận máy', color: 'bg-blue-100 text-blue-700', next: 'Chẩn đoán' },
    diagnosing: { label: 'Đang chẩn đoán', color: 'bg-orange-100 text-orange-700', next: 'Báo giá' },
    quoted: { label: 'Đã báo giá', color: 'bg-purple-100 text-purple-700', next: 'Sửa chữa' },
    in_progress: { label: 'Đang sửa chữa', color: 'bg-yellow-100 text-yellow-700', next: 'Kiểm tra' },
    testing: { label: 'Đang kiểm tra', color: 'bg-cyan-100 text-cyan-700', next: 'Hoàn thành' },
    completed: { label: 'Đã xong', color: 'bg-emerald-100 text-emerald-700', next: null },
    returned: { label: 'Đã bàn giao', color: 'bg-green-100 text-green-700', next: null },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', next: null },
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* HEADER & STATS BAR */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Trạm Làm Việc KTV</h1>
          <p className="text-gray-500 mt-1 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" /> Chào buổi chiều, hãy hoàn thành tốt các mục tiêu hôm nay!
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl border border-blue-100 text-sm font-bold shadow-sm">
          <Star className="w-4 h-4 fill-blue-600" />
          Xếp hạng: {stats.rating.toFixed(1)}/5.0
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Việc đang nhận', val: stats.activeJobs, icon: Wrench, color: 'blue' },
          { label: 'Xong tháng này', val: stats.completedMonth, icon: CheckCircle2, color: 'emerald' },
          { label: 'Lịch hẹn sắp tới', val: bookings.length, icon: CalendarClock, color: 'amber' },
        ].map((s, i) => (
          <div key={i} className={`bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group border-l-4 border-l-${s.color}-500`}>
             <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1 group-hover:text-blue-600 transition-colors">{s.val}</p>
                </div>
                <div className={`p-2.5 bg-${s.color}-50 text-${s.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-6 h-6" />
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center p-1 bg-gray-100/50 backdrop-blur rounded-2xl w-fit overflow-auto max-w-full">
            <button 
              onClick={() => setActiveTab('repairs')}
              className={`px-4 md:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'repairs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đang Xử Lý ({repairs.filter(r => !['completed', 'returned', 'cancelled'].includes(r.status)).length})
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 md:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-slate-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Lịch Sử ({repairs.filter(r => ['completed', 'returned', 'cancelled'].includes(r.status)).length})
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 md:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'bookings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Lịch Hẹn ({bookings.length})
            </button>
          </div>

          {activeTab === 'repairs' || activeTab === 'history' ? (
            <div className="grid grid-cols-1 gap-4">
              {repairs.filter(r => {
                if (activeTab === 'repairs') return !['completed', 'returned', 'cancelled'].includes(r.status);
                return ['completed', 'returned', 'cancelled'].includes(r.status);
              }).length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-[2rem] py-20 text-center flex flex-col items-center">
                  <Package className="w-16 h-16 text-gray-100 mb-4" />
                  <p className="text-gray-400 font-medium">
                    {activeTab === 'repairs' ? 'Hiện tại bạn chưa có đơn nào đang xử lý.' : 'Bạn chưa có lịch sử sửa chữa nào.'}
                  </p>
                </div>
              ) : (
                repairs.filter(r => {
                  if (activeTab === 'repairs') return !['completed', 'returned', 'cancelled'].includes(r.status);
                  return ['completed', 'returned', 'cancelled'].includes(r.status);
                }).map((rp) => {
                  const status = STATUS_MAP[rp.status] || { label: rp.status, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={rp.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
                      <div className="flex flex-col md:flex-row gap-6">
                      {/* Device Images */}
                      <div className="flex flex-col gap-3 shrink-0">
                        {/* Image Before */}
                        <div className="w-full md:w-40 h-32 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden relative group/img">
                          {rp.device_image_before || rp.device_image ? (
                            <img 
                              src={(rp.device_image_before || rp.device_image).startsWith('http') ? (rp.device_image_before || rp.device_image) : `${API_BASE_URL}${rp.device_image_before || rp.device_image}`} 
                              alt="Trước khi sửa" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                              <Camera className="w-6 h-6 mb-1" />
                              <span className="text-[8px] font-bold uppercase tracking-widest">Ảnh Trước</span>
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleUploadImage(rp.id, e.target.files[0], 'before')} 
                            />
                            <Camera className="w-5 h-5 text-white" />
                          </label>
                        </div>

                        {/* Image After (Visible from in_progress) */}
                        {['in_progress', 'testing', 'completed', 'returned'].includes(rp.status) && (
                          <div className="w-full md:w-40 h-32 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 overflow-hidden relative group/img-after">
                            {rp.device_image_after ? (
                              <img 
                                src={rp.device_image_after.startsWith('http') ? rp.device_image_after : `${API_BASE_URL}${rp.device_image_after}`} 
                                alt="Sau khi sửa" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-emerald-300">
                                <CheckCircle2 className="w-6 h-6 mb-1" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">Ảnh Sau</span>
                              </div>
                            )}
                            <label className="absolute inset-0 bg-emerald-600/40 opacity-0 group-hover/img-after:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => handleUploadImage(rp.id, e.target.files[0], 'after')} 
                              />
                              <Camera className="w-5 h-5 text-white" />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">#{rp.receipt_code}</span>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{rp.device_name}</h3>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSelectedRepair(rp)}
                              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-all border border-gray-100"
                              title="Xem chi tiết"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {status.next && (
                              <button 
                                onClick={() => handleNextStep(rp.id, rp.status)}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                              >
                                Tiếp: {status.next} <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Khách hàng</p>
                              <p className="text-xs font-bold text-gray-700 truncate">{rp.customer?.name}</p>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                              <CalendarDays className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Ngày nhận</p>
                              <p className="text-xs font-bold text-gray-700">{formatDate(rp.received_date)}</p>
                            </div>
                          </div>
                        </div>

                        {rp.issue && (
                          <div className="text-xs text-gray-500 bg-blue-50/30 p-3 rounded-xl border border-blue-50/50 flex gap-2">
                            <Info className="w-4 h-4 text-blue-400 shrink-0" />
                            <p className="italic">"{rp.issue}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {bookings.map((bk) => (
                  <div key={bk.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{bk.service}</h4>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase">{bk.status}</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                        <CalendarClock className="w-4 h-4 text-emerald-500" />
                        {formatDate(bk.booking_date)} • {bk.booking_time}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <User className="w-4 h-4 text-gray-300" />
                        {bk.name} ({bk.phone})
                      </div>
                    </div>

                    <button className="w-full py-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                      Xem chi tiết <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
               ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          {/* TRA CỨU KHÁCH HÀNG & BẢO HÀNH */}
          <div className="bg-white rounded-[2.5rem] p-6 text-gray-900 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Search className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-gray-900">Tra Cứu Bảo Hành</h2>
            </div>

            <div className="relative mb-6">
              <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Nhập SĐT khách hàng (ít nhất 6 số)..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 text-gray-900 font-medium"
              />
              {customerSearchLoading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />}
            </div>

            <div className="space-y-3 max-h-[300px] overflow-auto pr-1 custom-scrollbar">
              {customerQuery.trim().length < 6 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-xs font-bold uppercase tracking-wider">Nhập ít nhất 6 số</p>
                </div>
              ) : customerSearchResults.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-xs font-bold uppercase tracking-wider">Không tìm thấy kết quả</p>
                </div>
              ) : (
                customerSearchResults.map((rp) => {
                  // Determine warranty status
                  let warrantyLabel = 'Không bảo hành';
                  let isWarrantyActive = false;
                  if (rp.warranty_expiry) {
                    const expiry = new Date(rp.warranty_expiry);
                    const now = new Date();
                    isWarrantyActive = expiry > now;
                    warrantyLabel = isWarrantyActive 
                      ? `Còn BH: ${new Date(rp.warranty_expiry).toLocaleDateString('vi-VN')}`
                      : `Hết BH: ${new Date(rp.warranty_expiry).toLocaleDateString('vi-VN')}`;
                  } else if (rp.status === 'completed' && rp.warranty_period > 0) {
                    warrantyLabel = `${rp.warranty_period} tháng`;
                  } else if (rp.status !== 'completed' && rp.status !== 'returned') {
                    warrantyLabel = 'Chờ hoàn thành';
                  }

                  const statusMap = {
                    received: { label: 'Đã nhận máy', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                    diagnosing: { label: 'Đang chẩn đoán', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                    quoted: { label: 'Đã báo giá', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                    in_progress: { label: 'Đang sửa chữa', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
                    testing: { label: 'Đang kiểm tra', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
                    completed: { label: 'Đã xong', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                    returned: { label: 'Đã bàn giao', color: 'bg-green-50 text-green-600 border-green-100' },
                    cancelled: { label: 'Đã hủy', color: 'bg-red-50 text-red-600 border-red-100' },
                  };
                  const st = statusMap[rp.status] || { label: rp.status, color: 'bg-gray-50 text-gray-600 border-gray-100' };

                  return (
                    <div key={rp.id} className="bg-gray-50/50 hover:bg-blue-50/30 border border-gray-100 hover:border-blue-100/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100/50 px-1.5 py-0.5 rounded">#{rp.receipt_code}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tight ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-800 truncate" title={rp.device_name}>{rp.device_name}</p>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">Khách: <span className="text-gray-700 font-bold">{rp.customer?.name}</span></p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                            isWarrantyActive 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : rp.status === 'completed' || rp.status === 'returned'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>
                            {warrantyLabel}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedRepair(rp)}
                        className="p-2 bg-white hover:bg-blue-600 text-gray-400 hover:text-white rounded-xl border border-gray-100 hover:border-blue-500 shadow-sm transition-all shrink-0 active:scale-95"
                        title="Xem chi tiết đơn này"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SIDEBAR: INVENTORY LOOKUP */}
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl">
                <Package className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Tra Kho Linh Kiện</h2>
            </div>

            <div className="relative mb-6">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={invQuery}
                onChange={(e) => setInvQuery(e.target.value)}
                placeholder="Tìm màn hình, pin, cáp..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              />
              {invLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />}
            </div>

            <div className="space-y-3 max-h-[400px] overflow-auto pr-1 custom-scrollbar">
              {inventory.length === 0 ? (
                <div className="text-center py-8 opacity-40">
                  <p className="text-xs font-bold uppercase tracking-widest">Không có kết quả</p>
                </div>
              ) : (
                inventory.map((item) => (
                  <div key={item.id} className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-3 flex items-center gap-3 transition-all group overflow-hidden">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image_url ? (
                        <img 
                          src={item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.className = 'hidden';
                            e.target.parentElement.innerHTML = '<svg class="w-5 h-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>';
                          }}
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors" title={item.name}>{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Kho: <span className={item.stock_quantity > 0 ? 'text-emerald-400' : 'text-red-400'}>{item.stock_quantity}</span></span>
                        <span className="text-[10px] font-bold text-blue-400">{item.price.toLocaleString()}đ</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Mẹo nhỏ:</p>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                Sử dụng thanh tra cứu để báo giá nhanh cho khách hàng mà không cần rời trạm làm việc.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* REPAIR DETAIL MODAL */}
      {selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Chi Tiết Đơn Sửa Chữa</h2>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Mã: #{selectedRepair.receipt_code}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRepair(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left side: Basic Info & Photos */}
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ảnh hiện trạng (Trước)</p>
                      <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
                        {(selectedRepair.device_image_before || selectedRepair.device_image) ? (
                          <img 
                            src={(selectedRepair.device_image_before || selectedRepair.device_image).startsWith('http') ? (selectedRepair.device_image_before || selectedRepair.device_image) : `${API_BASE_URL}${selectedRepair.device_image_before || selectedRepair.device_image}`} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200"><Camera className="w-8 h-8" /></div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ảnh hoàn thành (Sau)</p>
                      <div className="aspect-square rounded-2xl bg-emerald-50/30 border border-emerald-100/50 overflow-hidden">
                        {selectedRepair.device_image_after ? (
                          <img 
                            src={selectedRepair.device_image_after.startsWith('http') ? selectedRepair.device_image_after : `${API_BASE_URL}${selectedRepair.device_image_after}`} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-100"><CheckCircle2 className="w-8 h-8" /></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kết quả kiểm tra & Báo giá</h3>
                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Chẩn đoán từ KTV</p>
                        <button 
                          onClick={() => {
                            setActionFormData({ 
                              diagnosis: selectedRepair.diagnosis || '', 
                              estimated_cost: selectedRepair.estimated_cost || '' 
                            });
                            setActionModal({ show: true, repair: selectedRepair, type: 'quote' });
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-relaxed">
                        {selectedRepair.diagnosis || 'Chưa có chẩn đoán chi tiết.'}
                      </p>
                      <div className="mt-4 pt-4 border-t border-blue-100/30 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Chi phí dự kiến:</span>
                        <span className="text-lg font-black text-blue-600">
                          {selectedRepair.estimated_cost ? `${selectedRepair.estimated_cost.toLocaleString()}đ` : 'Chưa báo giá'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Thông tin thiết bị ban đầu</h3>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-lg font-black text-gray-900">{selectedRepair.device_name}</p>
                      <p className="text-sm text-gray-500 mt-1 italic">Mô tả: "{selectedRepair.issue}"</p>
                      
                      {/* Huy hiệu bảo hành dịch vụ của KTV */}
                      <div className="mt-3.5 flex flex-wrap gap-2 pt-3 border-t border-gray-200/50">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                          selectedRepair.warranty_period > 0
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100 shadow-xs'
                            : 'text-gray-500 bg-gray-50 border-gray-200'
                        }`}>
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          Bảo hành dịch vụ: {selectedRepair.warranty_period > 0 ? `${selectedRepair.warranty_period} tháng` : 'Không bảo hành'}
                        </span>
                        {selectedRepair.warranty_expiry && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl shadow-xs">
                            <Clock className="w-4 h-4 shrink-0" />
                            Hết hạn: {new Date(selectedRepair.warranty_expiry).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><User className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Khách hàng</p>
                        <p className="text-sm font-bold text-gray-900">{selectedRepair.customer?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm"><Phone className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Số điện thoại</p>
                        <p className="text-sm font-bold text-gray-900">{selectedRepair.customer?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm"><DollarSign className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Chi phí dự kiến</p>
                        <p className="text-sm font-bold text-gray-900">
                          {selectedRepair.estimated_cost ? `${selectedRepair.estimated_cost.toLocaleString()}đ` : 'Chưa có'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Timeline */}
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Tiến độ thực hiện</h3>
                  <div className="relative pl-6 border-l-2 border-dashed border-gray-100 space-y-8">
                    {/* Status Log / Timeline */}
                    {[
                      { s: 'received', label: 'Tiếp nhận máy', date: selectedRepair.received_date },
                      { s: 'diagnosing', label: 'Chẩn đoán lỗi' },
                      { s: 'quoted', label: 'Đã báo giá' },
                      { s: 'in_progress', label: 'Đang sửa chữa' },
                      { s: 'testing', label: 'Kiểm tra kỹ thuật' },
                      { s: 'completed', label: 'Hoàn thành', date: selectedRepair.completed_date },
                    ].map((step, idx) => {
                      const FLOW = ['received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed'];
                      const currentIdx = FLOW.indexOf(selectedRepair.status);
                      const stepIdx = FLOW.indexOf(step.s);
                      const isPast = stepIdx < currentIdx;
                      const isCurrent = stepIdx === currentIdx;
                      
                      return (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${isPast ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-gray-200'}`}></div>
                          <div>
                            <p className={`text-sm font-bold ${isCurrent ? 'text-blue-600' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                            {(isPast || isCurrent) && (
                              <p className="text-[10px] font-medium text-gray-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 
                                {step.s === 'completed' ? formatDateTime(step.date) : (step.date || (isPast ? 'Đã xong' : 'Đang thực hiện...'))}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 bg-gray-50 flex justify-end border-t border-gray-100">
              <button 
                onClick={() => setSelectedRepair(null)}
                className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL (Diagnosis/Quote/Complete) */}
      {actionModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">
                {actionModal.type === 'quote' ? 'Cập Nhật Báo Giá' : 'Xác Nhận Hoàn Thành'}
              </h2>
              <button onClick={() => setActionModal({ show: false, repair: null, type: '' })} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {actionModal.type === 'quote' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chẩn đoán bệnh</label>
                    <textarea 
                      value={actionFormData.diagnosis}
                      onChange={(e) => setActionFormData({...actionFormData, diagnosis: e.target.value})}
                      placeholder="Mô tả chi tiết lỗi đã chẩn đoán..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chi phí dự kiến (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number"
                        value={actionFormData.estimated_cost}
                        onChange={(e) => setActionFormData({...actionFormData, estimated_cost: e.target.value})}
                        placeholder="0"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                      />
                    </div>
                  </div>
                </>
              )}

              {actionModal.type === 'complete' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chi phí thực tế (VNĐ)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number"
                      value={actionFormData.final_cost}
                      onChange={(e) => setActionFormData({...actionFormData, final_cost: e.target.value})}
                      placeholder="0"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-emerald-600"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">* Mặc định lấy từ giá dự kiến nếu không thay đổi.</p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                  Lưu ý: Sau khi xác nhận, hệ thống sẽ cập nhật dữ liệu và {actionModal.type === 'quote' ? 'chuyển sang bước Đã báo giá.' : 'hoàn thành đơn hàng này.'}
                </p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setActionModal({ show: false, repair: null, type: '' })}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmAction}
                disabled={saving}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                  </>
                ) : 'Xác nhận & Chuyển bước'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER / SHORTCUTS */}
      <div className="flex items-center justify-center gap-8 pt-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
         <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4" /> Đồng bộ Real-time
         </div>
         <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" /> Hiệu suất cao
         </div>
      </div>
    </div>
  );
};

export default TechnicianDashboardPage;
