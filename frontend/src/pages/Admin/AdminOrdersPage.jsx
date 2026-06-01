import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { patchRepairInList } from '../../hooks/useAdminRealtime.js';
import { 
  Loader2, Pencil, X, Save, Activity, UserRound, Stethoscope, Wallet, Search,
  Info, Camera, CheckCircle2, Clock, CalendarDays, Phone, DollarSign, TrendingUp, ChevronRight, ShieldCheck, Send
} from 'lucide-react';
import { resolveMediaUrl } from '../../utils/media.js';
import { formatDate, formatDateTime } from '../../utils/format.js';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';
import { io } from 'socket.io-client';
import { API_V1_URL } from '../../utils/api.js';

const statusOptions = [
  { value: 'received', label: 'Đã tiếp nhận', color: 'bg-blue-100 text-blue-700' },
  { value: 'diagnosing', label: 'Đang chẩn đoán', color: 'bg-orange-100 text-orange-700' },
  { value: 'quoted', label: 'Đã báo giá', color: 'bg-purple-100 text-purple-700' },
  { value: 'in_progress', label: 'Đang sửa chữa', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'testing', label: 'Đang kiểm tra', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'completed', label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  { value: 'returned', label: 'Đã bàn giao', color: 'bg-green-200 text-green-800' },
  { value: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ status: '', technician_name: '', estimated_cost: '', final_cost: '', diagnosis: '', warranty_period: 0, warranty_terms: '' });
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const parseSafeDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const cleanStr = typeof dateStr === 'string' ? dateStr.trim() : String(dateStr);
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 23, 59, 59);
    }
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const [warrantySearchLoading, setWarrantySearchLoading] = useState(false);
  const [warrantySearchResults, setWarrantySearchResults] = useState([]);

  const phoneDigits = useMemo(() => query.replace(/\D/g, ''), [query]);
  // Chỉ tra cứu BH khi nhập SĐT (chuỗi chủ yếu là số), tránh nhầm với mã RCV-118xxx
  const isWarrantyPhoneSearch = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || phoneDigits.length < 6) return false;
    const nonSpace = trimmed.replace(/\s/g, '');
    return /^[\d\s\-+().]+$/.test(nonSpace);
  }, [query, phoneDigits]);

  const searchWarrantyByPhone = useCallback(async (phone) => {
    if (!phone || phone.length < 6) {
      setWarrantySearchResults([]);
      return;
    }
    setWarrantySearchLoading(true);
    try {
      const res = await fetch(`${API_V1_URL}/technician/search?phone=${encodeURIComponent(phone)}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const result = await res.json();
      if (result.success) {
        setWarrantySearchResults(result.data);
      } else {
        setWarrantySearchResults([]);
      }
    } catch (err) {
      console.error(err);
      setWarrantySearchResults([]);
    } finally {
      setWarrantySearchLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isWarrantyPhoneSearch) {
      setWarrantySearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      searchWarrantyByPhone(phoneDigits);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [phoneDigits, isWarrantyPhoneSearch, searchWarrantyByPhone]);

  const handleCreateWarrantyOrder = async (parentOrder) => {
    if (!window.confirm(`Bạn có chắc chắn muốn tạo đơn tiếp nhận bảo hành mới liên kết với đơn gốc #${parentOrder.receipt_code}?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_V1_URL}/technician/repairs/warranty`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          parent_id: parentOrder.id,
          technician_name: parentOrder.technician_name || undefined,
        })
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', result.message || 'Đã gửi đơn bảo hành cho KTV.');
        setQuery('');
        setWarrantySearchResults([]);
        fetchData();
      } else {
        showMessage('error', result.message);
      }
    } catch (err) {
      console.error(err);
      showMessage('error', 'Đã xảy ra lỗi khi tạo đơn bảo hành.');
    }
  };

  const fetchData = async () => {
    try {
      const ts = Date.now();
      const [oRes, tRes] = await Promise.all([
        fetch(`${API_V1_URL}/admin/orders?t=${ts}`, { headers }),
        fetch(`${API_V1_URL}/admin/technicians?t=${ts}`, { headers })
      ]);
      const [oData, tData] = await Promise.all([oRes.json(), tRes.json()]);
      
      if (oData.success) setOrders(oData.data);
      if (tData.success) setTechnicians(tData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => { 
    fetchData();

    let refreshTimer = null;
    const scheduleFetch = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        fetchDataRef.current();
      }, 250);
    };

    const handleGlobalUpdate = (event) => {
      const payload = event?.detail;
      if (payload && (payload.type === 'repair_order' || payload.repair_id != null || payload.status)) {
        patchRepairInList(setOrders, payload);
      }
      scheduleFetch();
    };

    window.addEventListener('admin-data-update', handleGlobalUpdate);

    const pollTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchDataRef.current();
    }, 3000);

    return () => {
      window.removeEventListener('admin-data-update', handleGlobalUpdate);
      window.clearInterval(pollTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  // Sync selectedDetail when orders data changes
  useEffect(() => {
    if (selectedDetail) {
      const updated = orders.find(o => o.id === selectedDetail.id);
      if (updated) setSelectedDetail(updated);
    }
  }, [orders]);

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt mở popup để in phiếu bảo hành!');
      return;
    }

    const startWarranty = order.completed_date ? formatDate(order.completed_date) : formatDate(new Date());
    const expiryWarranty = order.warranty_expiry ? formatDate(order.warranty_expiry) : 'Không bảo hành';

    const htmlContent = `
      <html>
      <head>
        <title>In Phiếu Bảo Hành #${order.receipt_code}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 76mm;
            margin: 0 auto;
            padding: 5mm 2mm;
            font-size: 11px;
            color: #000;
            line-height: 1.4;
          }
          .text-center { text-align: center; }
          .header { margin-bottom: 5mm; border-bottom: 1px dashed #000; padding-bottom: 3mm; }
          .store-name { font-size: 16px; font-weight: bold; }
          .store-slogan { font-size: 9px; font-style: italic; margin-top: 1mm; }
          .title { font-size: 13px; font-weight: bold; margin: 4mm 0; }
          .mono-code { font-weight: bold; font-size: 12px; }
          .info-table { width: 100%; border-collapse: collapse; margin-top: 3mm; }
          .info-table td { padding: 1.5mm 0; vertical-align: top; }
          .info-table td:first-child { width: 35%; font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 4mm 0; }
          .terms { font-size: 9px; text-align: justify; }
          .signatures { display: flex; justify-content: space-between; margin-top: 8mm; text-align: center; }
          .signature-box { width: 45%; }
          .signature-space { height: 12mm; }
          .footer { font-size: 8px; margin-top: 6mm; border-top: 1px dashed #000; padding-top: 3mm; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="text-center header">
          <div class="store-name">CỬA HÀNG 118</div>
          <div class="store-slogan">Chuyên Nghiệp - Tận Tâm - Uy Tín</div>
          <div style="font-size: 9px; margin-top: 1mm;">Đ/C: Tỉnh Bạc Liêu</div>
          <div style="font-size: 9px;">Hotline: 0704.818.118</div>
        </div>

        <div class="text-center">
          <div class="title">PHIẾU BẢO HÀNH ĐIỆN TỬ</div>
          <div class="mono-code">[ ${order.receipt_code} ]</div>
        </div>

        <table class="info-table">
          <tr>
            <td>Khách hàng:</td>
            <td>${order.customer?.name || 'Khách lẻ'}</td>
          </tr>
          <tr>
            <td>Điện thoại:</td>
            <td>${order.customer?.phone || '—'}</td>
          </tr>
          <tr>
            <td>Thiết bị:</td>
            <td>${order.device_name}</td>
          </tr>
          <tr>
            <td>Nội dung:</td>
            <td>${order.issue || 'Sửa chữa thiết bị'}</td>
          </tr>
          <tr>
            <td>KTV xử lý:</td>
            <td>${order.technician_name || 'Cửa hàng 118'}</td>
          </tr>
          <tr>
            <td>Thành tiền:</td>
            <td>${order.final_cost ? order.final_cost.toLocaleString('vi-VN') + 'đ' : '—'}</td>
          </tr>
          <tr>
            <td>Bảo hành:</td>
            <td><strong>${order.warranty_period ? order.warranty_period + ' tháng' : 'Không bảo hành'}</strong></td>
          </tr>
          <tr>
            <td>Bắt đầu:</td>
            <td>${startWarranty}</td>
          </tr>
          <tr>
            <td>Hết hạn:</td>
            <td><strong>${expiryWarranty}</strong></td>
          </tr>
        </table>

        <div class="divider"></div>

        <div class="terms">
          <strong>ĐIỀU KHOẢN BẢO HÀNH:</strong><br/>
          ${order.warranty_terms || 'Bảo hành linh kiện thay thế trong thời hạn quy định. Không bảo hành rơi vỡ, cấn móp, ngập nước, cháy nổ, hoặc rách tem bảo hành.'}
        </div>

        <div class="signatures">
          <div class="signature-box">
            <strong>Khách Hàng</strong>
            <div class="signature-space"></div>
            <i>(Ký, ghi rõ họ tên)</i>
          </div>
          <div class="signature-box">
            <strong>Kỹ Thuật Viên</strong>
            <div class="signature-space"></div>
            <i>${order.technician_name || 'Cửa Hàng 118'}</i>
          </div>
        </div>

        <div class="text-center footer">
          Cảm ơn quý khách đã tin tưởng Cửa Hàng 118!<br/>
          Quét QR trên thẻ hoặc vào trang web để tra cứu online.
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        <\/script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const openEdit = (o) => {
    setEditing(o.id);
    setForm({ 
      status: o.status, 
      technician_name: o.technician_name || '', 
      estimated_cost: o.estimated_cost || '', 
      final_cost: o.final_cost || '', 
      diagnosis: o.diagnosis || '',
      warranty_period: o.warranty_period || 0,
      warranty_terms: o.warranty_terms || 'Bảo hành linh kiện thay thế trong thời hạn bảo hành. Không bảo hành trong trường hợp: Thiết bị có dấu hiệu rơi vỡ, cấn móp, ngập nước, cháy nổ hoặc tem bảo hành của cửa hàng bị rách/tác động.'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...form, 
        estimated_cost: form.estimated_cost !== '' ? Number(form.estimated_cost) : 0, 
        final_cost: form.final_cost !== '' ? Number(form.final_cost) : 0 
      };
      console.log('🚀 [AdminOrders] Updating order:', editing, payload);

      const res = await fetch(`${API_V1_URL}/admin/orders/${editing}`, { 
        method: 'PUT', 
        headers, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Không thể cập nhật đơn sửa chữa.');
      
      setEditing(null);
      showMessage('success', 'Cập nhật đơn sửa chữa thành công.');
      fetchData();
    } catch (error) {
      console.error('❌ [AdminOrders] Update failed:', error);
      showMessage('error', error.message);
    }
  };

  const getStatusStyle = (status) => statusOptions.find(s => s.value === status) || {};
  const filteredOrders = useMemo(() => orders.filter((o) => {
    const keyword = query.trim().toLowerCase();
    const matchKeyword = !keyword || o.receipt_code?.toLowerCase().includes(keyword) || o.customer?.name?.toLowerCase().includes(keyword) || o.customer?.phone?.includes(keyword) || o.device_name?.toLowerCase().includes(keyword);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchKeyword && matchStatus;
  }), [orders, query, statusFilter]);

  const displayOrders = useMemo(() => {
    if (isWarrantyPhoneSearch) {
      return warrantySearchResults.filter((o) => statusFilter === 'all' || o.status === statusFilter);
    }
    return filteredOrders;
  }, [isWarrantyPhoneSearch, warrantySearchResults, filteredOrders, statusFilter]);

  const computeCanReceiveWarranty = (o) => {
    if (o.can_receive_warranty === true) return true;
    if (o.device_name?.startsWith('[Bảo Hành]')) return false;
    if (!['completed', 'returned'].includes(o.status)) return false;

    const expiryRaw = o.warranty_expiry_effective || o.warranty_expiry;
    if (expiryRaw) {
      const exp = parseSafeDate(expiryRaw);
      return Boolean(exp && exp > new Date());
    }

    const period = Number(o.warranty_period) || 0;
    if (period <= 0 || !o.completed_date) return false;
    const base = parseSafeDate(o.completed_date);
    if (!base) return false;
    const exp = new Date(base);
    exp.setMonth(exp.getMonth() + period);
    return exp > new Date();
  };

  const getWarrantyLabel = (rp) => {
    const effectiveExpiry = rp.warranty_expiry_effective || rp.warranty_expiry;
    if (effectiveExpiry) {
      const expiry = parseSafeDate(effectiveExpiry);
      const stillActive = expiry && expiry > new Date();
      return stillActive ? `Còn BH: ${formatDate(effectiveExpiry)}` : `Hết BH: ${formatDate(effectiveExpiry)}`;
    }
    if (rp.status === 'completed' && rp.warranty_period > 0) return `${rp.warranty_period} tháng`;
    if (!['completed', 'returned'].includes(rp.status)) return 'Chờ hoàn thành';
    return 'Không bảo hành';
  };
  const summary = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => !['completed', 'returned', 'cancelled'].includes(o.status)).length;
    const done = orders.filter((o) => ['completed', 'returned'].includes(o.status)).length;
    return { total, active, done };
  }, [orders]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(displayOrders.length / pageSize));
  const pagedOrders = useMemo(
    () => displayOrders.slice((page - 1) * pageSize, page * pageSize),
    [displayOrders, page]
  );

  useEffect(() => {
    setPage(1);
  }, [orders.length, query, statusFilter, warrantySearchResults.length]);

  if (loading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div>
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản Lý Đơn Sửa Chữa</h1>
        <p className="text-gray-500 text-sm">{orders.length} đơn</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3">
          <p className="text-xs text-blue-700 font-semibold">Tổng đơn</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-linear-to-r from-amber-50 to-yellow-50 px-4 py-3">
          <p className="text-xs text-amber-700 font-semibold">Đang xử lý</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{summary.active}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3">
          <p className="text-xs text-emerald-700 font-semibold">Đã hoàn tất</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{summary.done}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo mã biên nhận, khách hàng, thiết bị hoặc SĐT (≥6 số) để tra cứu bảo hành..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
              {warrantySearchLoading && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {isWarrantyPhoneSearch ? (
              <>
                Đang tra cứu bảo hành theo SĐT — <span className="font-bold text-gray-700">{displayOrders.length}</span> đơn
                {displayOrders.length === 0 && !warrantySearchLoading && ' (không tìm thấy)'}
              </>
            ) : (
              <>
                Kết quả lọc: <span className="font-bold text-gray-700">{displayOrders.length}</span> đơn
                <span className="text-gray-400 ml-1">· Nhập ≥6 chữ số SĐT để tra cứu bảo hành</span>
              </>
            )}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-auto max-h-[68vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10"><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã biên nhận</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Thiết bị</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Lỗi</th>
                {isWarrantyPhoneSearch && <th className="text-center px-4 py-3 font-semibold text-gray-600">Bảo hành</th>}
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Chi phí</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">KTV</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Thao tác</th>
              </tr></thead>
              <tbody>
                {pagedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={isWarrantyPhoneSearch ? 9 : 8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      {warrantySearchLoading ? 'Đang tra cứu...' : isWarrantyPhoneSearch ? 'Không tìm thấy đơn nào với SĐT này.' : 'Không có đơn phù hợp.'}
                    </td>
                  </tr>
                ) : pagedOrders.map((o) => {
                  const st = getStatusStyle(o.status);
                  const canReceiveWarranty = computeCanReceiveWarranty(o);
                  const warrantyLabel = getWarrantyLabel(o);
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{o.receipt_code}</td>
                      <td className="px-4 py-3"><div className="font-semibold text-gray-800">{o.customer?.name || '—'}</div><div className="text-xs text-gray-400">{o.customer?.phone}</div></td>
                      <td className="px-4 py-3 text-gray-700">{o.device_name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{o.issue}</td>
                      {isWarrantyPhoneSearch && (
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ${
                            canReceiveWarranty
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : ['completed', 'returned'].includes(o.status)
                                ? 'bg-red-50 text-red-600 border-red-100'
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            {warrantyLabel}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-bold">
                        {o.device_name?.startsWith('[Bảo Hành]') ? (
                          <span className="text-emerald-600 font-bold">Miễn phí (Bảo hành)</span>
                        ) : o.final_cost ? (
                          <span className="text-emerald-600" title="Chi phí thực tế">{o.final_cost.toLocaleString()}đ</span>
                        ) : o.estimated_cost ? (
                          <span className="text-blue-600" title="Chi phí dự kiến">{o.estimated_cost.toLocaleString()}đ</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${st.color || ''}`}>{st.label || o.status}</span></td>
                      <td className="px-4 py-3 text-gray-600">{o.technician_name || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button type="button" onClick={() => setSelectedDetail(o)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center" title="Xem chi tiết"><Info className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => openEdit(o)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" /></button>
                          {canReceiveWarranty && (
                            <button
                              type="button"
                              onClick={() => handleCreateWarrantyOrder(o)}
                              className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center"
                              title={`Gửi đơn bảo hành cho KTV${o.technician_name ? ` (${o.technician_name})` : ''}`}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-slate-900/55 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-3xl p-0 w-full max-w-3xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] border border-blue-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="w-full p-5 border-b border-gray-100 bg-linear-to-r from-blue-50/60 via-white to-indigo-50/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    Cập Nhật Đơn #{[...orders, ...warrantySearchResults].find((x) => x.id === editing)?.receipt_code || editing}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Điều chỉnh tiến độ, KTV phụ trách và chi phí đơn sửa chữa.</p>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
                <div className="relative">
                  <Activity className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">KTV phụ trách</label>
                <div className="relative">
                  <UserRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={form.technician_name}
                    onChange={(e) => setForm({ ...form, technician_name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="">-- Chọn kỹ thuật viên --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.full_name}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Chẩn đoán</label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} rows="2" className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Chi phí dự kiến</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Chi phí thực tế</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="number" value={form.final_cost} onChange={(e) => setForm({ ...form, final_cost: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {['completed', 'returned'].includes(form.status) && (
                <>
                  <div className="md:col-span-2 border-t border-dashed border-gray-200 pt-3.5 mt-2">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Thông tin Bảo hành điện tử</span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Thời hạn bảo hành</label>
                    <select
                      value={form.warranty_period}
                      onChange={(e) => setForm({ ...form, warranty_period: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={0}>Không bảo hành</option>
                      <option value={1}>1 tháng</option>
                      <option value={3}>3 tháng</option>
                      <option value={6}>6 tháng</option>
                      <option value={12}>12 tháng</option>
                      <option value={24}>24 tháng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Điều khoản bảo hành</label>
                    <textarea
                      value={form.warranty_terms}
                      onChange={(e) => setForm({ ...form, warranty_terms: e.target.value })}
                      rows="2"
                      className="w-full px-3.5 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-xs"
                      placeholder="Nhập điều khoản bảo hành..."
                    />
                  </div>
                </>
              )}

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 md:col-span-2 shadow-lg shadow-blue-600/20 mt-2">
                <Save className="w-4 h-4" /> Cập Nhật
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REPAIR DETAIL MODAL (Shared Style) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Chi Tiết Đơn Sửa Chữa</h2>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Mã: #{selectedDetail.receipt_code}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ảnh Trước</p>
                      <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
                        {(selectedDetail.device_image_before || selectedDetail.device_image) ? (
                          <img src={resolveMediaUrl(selectedDetail.device_image_before || selectedDetail.device_image)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200"><Camera className="w-8 h-8" /></div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ảnh Sau</p>
                      <div className="aspect-square rounded-2xl bg-emerald-50/30 border border-emerald-100/50 overflow-hidden">
                        {selectedDetail.device_image_after ? (
                          <img src={resolveMediaUrl(selectedDetail.device_image_after)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-100"><CheckCircle2 className="w-8 h-8" /></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kết quả từ KTV: {selectedDetail.technician_name || '—'}</h3>
                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                      <p className="text-sm font-bold text-gray-900 leading-relaxed">{selectedDetail.diagnosis || 'Chưa có chẩn đoán chi tiết.'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><UserRound className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Khách hàng</p>
                        <p className="text-sm font-bold text-gray-900">{selectedDetail.customer?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm"><Phone className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Liên hệ</p>
                        <p className="text-sm font-bold text-gray-900">{selectedDetail.customer?.phone}</p>
                      </div>
                    </div>
                    {selectedDetail.device_name?.startsWith('[Bảo Hành]') ? (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shadow-sm shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">Loại đơn hàng</p>
                          <p className="text-sm font-bold text-emerald-600">Đơn Nhận Bảo Hành (Miễn phí)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm"><DollarSign className="w-5 h-5" /></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Báo giá dự kiến</p>
                          <p className="text-sm font-bold text-gray-900">{selectedDetail.estimated_cost?.toLocaleString()}đ</p>
                        </div>
                      </div>
                    )}

                    {['completed', 'returned'].includes(selectedDetail.status) && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-2xl">
                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shadow-sm shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Bảo hành điện tử</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">
                            {selectedDetail.device_name?.startsWith('[Bảo Hành]')
                              ? 'Thời hạn: Tiếp nhận bảo hành (Miễn phí)'
                              : `Thời hạn: ${selectedDetail.warranty_period ? `${selectedDetail.warranty_period} tháng` : 'Không bảo hành'}`}
                          </p>
                          {selectedDetail.warranty_expiry && (
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              Hết hạn: {formatDate(selectedDetail.warranty_expiry)}
                            </p>
                          )}
                          {selectedDetail.warranty_terms && (
                            <p className="text-[10px] text-gray-500 leading-relaxed mt-2 border-t border-blue-100/50 pt-1.5 font-medium italic">
                              {selectedDetail.warranty_terms}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Tiến độ thực hiện</h3>
                  <div className="relative pl-6 border-l-2 border-dashed border-gray-100 space-y-8 text-left">
                    {(selectedDetail.device_name?.startsWith('[Bảo Hành]')
                      ? [
                          { s: 'received', label: 'Tiếp nhận bảo hành', date: selectedDetail.received_date },
                          { s: 'diagnosing', label: 'Kiểm tra lỗi' },
                          { s: 'in_progress', label: 'Đang xử lý bảo hành' },
                          { s: 'testing', label: 'Kiểm tra kỹ thuật' },
                          { s: 'completed', label: 'Bàn giao thiết bị', date: selectedDetail.completed_date },
                        ]
                      : [
                          { s: 'received', label: 'Tiếp nhận máy', date: selectedDetail.received_date },
                          { s: 'diagnosing', label: 'Chẩn đoán lỗi' },
                          { s: 'quoted', label: 'Đã báo giá' },
                          { s: 'in_progress', label: 'Đang sửa chữa' },
                          { s: 'testing', label: 'Kiểm tra kỹ thuật' },
                          { s: 'completed', label: 'Hoàn thành', date: selectedDetail.completed_date },
                        ]
                    ).map((step, idx) => {
                      const FLOW = selectedDetail.device_name?.startsWith('[Bảo Hành]')
                        ? ['received', 'diagnosing', 'in_progress', 'testing', 'completed']
                        : ['received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed'];
                      const currentIdx = FLOW.indexOf(selectedDetail.status);
                      const stepIdx = FLOW.indexOf(step.s);
                      const isPast = stepIdx < currentIdx;
                      const isCurrent = stepIdx === currentIdx;
                      return (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${isPast ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-gray-200'}`}></div>
                          <div>
                            <p className={`text-sm font-bold ${isCurrent ? 'text-blue-600' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
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
            <div className="p-6 bg-gray-50 flex flex-wrap justify-end gap-3 border-t border-gray-100">
              {computeCanReceiveWarranty(selectedDetail) && (
                <button
                  type="button"
                  onClick={() => handleCreateWarrantyOrder(selectedDetail)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Gửi đơn bảo hành cho KTV
                </button>
              )}
              {['completed', 'returned'].includes(selectedDetail.status) && (
                <button
                  type="button"
                  onClick={() => handlePrint(selectedDetail)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
                >
                  In Phiếu Bảo Hành
                </button>
              )}
              <button type="button" onClick={() => setSelectedDetail(null)} className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
