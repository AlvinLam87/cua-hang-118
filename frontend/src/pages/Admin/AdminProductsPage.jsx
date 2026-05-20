import React, { useMemo, useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Loader2, X, Save, Search, Package, Image as ImageIcon, RefreshCw, Boxes, Wallet, Layers, Star, Gift, Palette, History, ArrowDownLeft, TrendingUp, AlertTriangle, DollarSign, Truck, ExternalLink, Filter, Upload, Check, LayoutGrid, CornerDownRight
} from 'lucide-react';
import ProductImage from '../../components/ProductImage.jsx';
import { normalizeProductImages } from '../../utils/media.js';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';
import { API_V1_URL } from '../../utils/api.js';

const defaultForm = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  category_id: '',
  stock_quantity: '0',
  warehouse_quantity: '0',
  image_url: '',
  icon: 'Cpu',
  is_hot: false,
  in_stock: true,
  rating: 5,
  promotions: [],
  specifications: [],
  variants: [],
};
const WarehousePickerItem = ({ product, isSelected, onToggle, onPublish, normalizeProductImages }) => {
  const [listQty, setListQty] = useState(product.warehouse_quantity);

  return (
    <div 
      className={`p-5 rounded-3xl border-2 transition-all flex flex-col gap-4 ${
        isSelected ? 'border-emerald-500 bg-emerald-50 shadow-xl shadow-emerald-100' : 'border-slate-100 hover:border-emerald-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-4 cursor-pointer" onClick={onToggle}>
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${
          isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'
        }`}>
          {isSelected && <Check className="w-4 h-4" />}
        </div>
        <div className="w-14 h-14 rounded-2xl border border-gray-100 bg-white p-1 overflow-hidden shrink-0 shadow-sm">
          {product.image_url ? (
            <ProductImage imageSources={normalizeProductImages(product.image_url)} alt={product.name} containerClassName="w-full h-full" imgClassName="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><Package className="w-6 h-6" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-slate-800 truncate text-lg">{product.name}</div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">SẴN CÓ TRONG KHO: {product.warehouse_quantity} ĐƠN VỊ</div>
        </div>
      </div>
      
      {isSelected && (
        <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
          <label className="text-xs font-black text-emerald-800 uppercase tracking-wider">Số lượng muốn đăng bán:</label>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              min="1" 
              max={product.warehouse_quantity} 
              value={listQty} 
              onChange={(e) => {
                const val = Math.min(product.warehouse_quantity, Math.max(1, Number(e.target.value)));
                setListQty(val);
              }}
              className="w-20 px-3 py-2 bg-white border-2 border-emerald-200 rounded-xl text-center font-black text-emerald-700 outline-none focus:border-emerald-500"
            />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPublish(product.id, listQty);
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-200"
            >
              XÁC NHẬN ĐĂNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSelected, setPickerSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [form, setForm] = useState(defaultForm);
  const [activeTab, setActiveTab] = useState('products');
  const [movements, setMovements] = useState([]);
  const [showStockIn, setShowStockIn] = useState(false);
  const [pickerCategory, setPickerCategory] = useState('all');
  const [pickerSearch, setPickerSearch] = useState('');
  const [stockInForm, setStockInForm] = useState({
    product_id: '',
    product_name: '',
    category_id: '',
    quantity: '',
    price: '',
    type: 'WEB',
    reason: 'Nhập thẳng bán Web',
    notes: ''
  });
  const [submittingStock, setSubmittingStock] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const formImages = useMemo(() => normalizeProductImages(form.image_url), [form.image_url]);
  const summary = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.in_stock).length;
    const outStock = products.filter((p) => !p.in_stock).length;
    const hot = products.filter((p) => p.is_hot).length;
    const totalItems = products.reduce((acc, p) => acc + (p.stock_quantity || 0) + (p.warehouse_quantity || 0), 0);
    const totalInValue = products.reduce((acc, p) => {
      const lastIn = movements.find(m => m.product_id === p.id && m.type === 'IN');
      const costPrice = lastIn ? lastIn.price : (p.price * 0.7);
      return acc + (((p.stock_quantity || 0) + (p.warehouse_quantity || 0)) * costPrice);
    }, 0);
    return { total, inStock, outStock, hot, totalItems, totalInValue };
  }, [products, movements]);

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  const categoriesSorted = useMemo(() => {
    const root = categories.filter(c => !c.parent_id);
    const result = [];
    root.forEach(parent => {
      result.push({ ...parent, level: 0 });
      const children = categories.filter(c => c.parent_id === parent.id);
      children.forEach(child => {
        result.push({ ...child, level: 1 });
      });
    });
    return result;
  }, [categories]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, mRes] = await Promise.all([
        fetch(`${API_V1_URL}/admin/products`, { headers }),
        fetch(`${API_V1_URL}/categories`),
        fetch(`${API_V1_URL}/admin/inventory/movements`, { headers })
      ]);

      if (!pRes.ok || !cRes.ok || !mRes.ok) {
        throw new Error('Không thể tải dữ liệu từ máy chủ.');
      }

      const [pData, cData, mData] = await Promise.all([
        pRes.json(), cRes.json(), mRes.json()
      ]);

      if (pData.success) setProducts(pData.data);
      if (cData.success) setCategories(cData.data);
      if (mData.success) setMovements(mData.data);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...defaultForm, category_id: categories[0]?.id || '' });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price ?? '',
      original_price: p.original_price ?? '',
      category_id: p.category_id || '',
      stock_quantity: p.stock_quantity ?? 0,
      warehouse_quantity: p.warehouse_quantity ?? 0,
      image_url: p.image_url || '',
      icon: p.icon || 'Cpu',
      is_hot: Boolean(p.is_hot),
      in_stock: Boolean(p.in_stock),
      rating: p.rating ?? 5,
      promotions: (() => { try { return JSON.parse(p.promotions || '[]'); } catch { return []; } })(),
      specifications: (() => { try { return JSON.parse(p.specifications || '[]'); } catch { return []; } })(),
      variants: (() => { try { return JSON.parse(p.variants || '[]'); } catch { return []; } })(),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showMessage('error', 'Tên sản phẩm không được để trống.');
    if (!form.price || Number(form.price) < 0) return showMessage('error', 'Giá sản phẩm không hợp lệ.');
    if (!form.category_id) return showMessage('error', 'Vui lòng chọn danh mục.');

    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      image_url: form.image_url?.trim() || null,
      price: Number(form.price || 0),
      original_price: form.original_price === '' ? null : Number(form.original_price),
      // Khi cập nhật sản phẩm, KHÔNG được phép ghi đè số lượng tồn kho qua form này
      // Các trường này sẽ được bảo lưu giá trị cũ từ backend
      rating: Number(form.rating || 5),
      in_stock: Number(form.stock_quantity) > 0,
      promotions: JSON.stringify((form.promotions || []).filter(p => p.trim())),
      specifications: JSON.stringify((form.specifications || []).filter(s => s.label?.trim())),
      variants: JSON.stringify(form.variants || []),
    };

    // Nếu là tạo mới, chúng ta vẫn cho phép khởi tạo giá trị ban đầu? 
    // Nhưng theo yêu cầu mới, tạo mới cũng nên qua phiếu nhập kho.
    // Tuy nhiên để tương thích, nếu có nhập ở default form (mặc dù đã ẩn input) ta vẫn gửi.
    if (!editing) {
      payload.stock_quantity = Number(form.stock_quantity || 0);
      payload.warehouse_quantity = Number(form.warehouse_quantity || 0);
      payload.is_active = payload.stock_quantity > 0;
    } else {
      // Xóa để không ghi đè lung tung
      delete payload.stock_quantity;
      delete payload.warehouse_quantity;
    }

    const url = editing ? `${API_V1_URL}/admin/products/${editing}` : `${API_V1_URL}/admin/products`;
    const method = editing ? 'PUT' : 'POST';

    setSubmitting(true);
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Không thể lưu sản phẩm.');
      setShowForm(false);
      showMessage('success', editing ? 'Cập nhật sản phẩm thành công.' : 'Tạo sản phẩm mới thành công.');
      fetchData();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    if ((!stockInForm.product_id && !stockInForm.product_name) || !stockInForm.quantity) {
      return showMessage('error', 'Vui lòng điền đủ thông tin món hàng và số lượng.');
    }
    setSubmittingStock(true);
    const body = {
      ...stockInForm,
      quantity: Number(stockInForm.quantity),
      price: stockInForm.price ? Number(stockInForm.price) : null
    };

    try {
      const res = await fetch(`${API_V1_URL}/admin/inventory/stock-in`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Đã nhập kho thành công.');
        setStockInForm({ 
          product_id: '', product_name: '', category_id: '', 
          quantity: '', price: '', type: 'WEB', 
          reason: 'Nhập thẳng bán Web', notes: '' 
        });
        setShowStockIn(false);
        fetchData();
        setActiveTab('inventory');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSubmittingStock(false);
    }
  };

  const handleToggleActive = async (product, status) => {
    try {
      const payload = { ...product, is_active: status };
      
      // Nếu gỡ khỏi web, chuyển toàn bộ stock_quantity về warehouse_quantity
      if (!status) {
        payload.warehouse_quantity = (Number(product.warehouse_quantity) || 0) + (Number(product.stock_quantity) || 0);
        payload.stock_quantity = 0;
        payload.in_stock = false;
      }

      const res = await fetch(`${API_V1_URL}/admin/products/${product.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', status ? `Đã đăng "${product.name}" lên Web.` : `Đã gỡ "${product.name}" và chuyển về kho.`);
        fetchData();
      } else throw new Error(data.message);
    } catch (err) { showMessage('error', err.message); }
  };

  const handlePublishFromWarehouse = async (productId, quantity) => {
    if (!quantity || quantity <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_V1_URL}/admin/inventory/transfer-to-shop`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: productId, quantity: Number(quantity) })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', data.message);
        fetchData();
        return true;
      } else throw new Error(data.message);
    } catch (err) { 
      showMessage('error', err.message);
      return false;
    } finally { setSubmitting(false); }
  };

  const handleBulkPublish = async () => {
    if (pickerSelected.length === 0) return;
    // Đối với Bulk Publish, chúng ta mặc định chuyển TOÀN BỘ warehouse_quantity lên web
    setSubmitting(true);
    try {
      await Promise.all(pickerSelected.map(id => {
        const p = products.find(item => item.id === id);
        return fetch(`${API_V1_URL}/admin/inventory/transfer-to-shop`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ product_id: id, quantity: p.warehouse_quantity })
        });
      }));
      showMessage('success', `Đã đăng ${pickerSelected.length} mặt hàng lên Web thành công.`);
      setShowPicker(false);
      setPickerSelected([]);
      fetchData();
    } catch (err) { showMessage('error', 'Có lỗi xảy ra khi đăng hàng loạt.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_V1_URL}/admin/products/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Không thể xóa sản phẩm.');
      showMessage('success', 'Đã xóa sản phẩm.');
      fetchData();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleProductImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const body = new FormData();
    files.forEach((file) => body.append('images', file));
    setUploadingImages(true);

    try {
      const res = await fetch(`${API_V1_URL}/admin/products/upload-images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload ảnh thất bại.');

      setForm((prev) => {
        const current = normalizeProductImages(prev.image_url);
        const merged = [...new Set([...current, ...(data.data.image_urls || [])])];
        return { ...prev, image_url: merged.join(', ') };
      });
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (activeTab === 'products') return p.is_active;
        if (activeTab === 'inventory') return p.warehouse_quantity > 0 || !p.is_active;
        return true;
      })
      .filter((p) => {
        const keyword = query.trim().toLowerCase();
        const matchesQuery = !keyword || 
          String(p.id).includes(keyword) ||
          p.name?.toLowerCase().includes(keyword) ||
          p.category?.name?.toLowerCase().includes(keyword);
        
        const matchesCategory = categoryFilter === 'all' || String(p.category_id) === categoryFilter;
        
        return matchesQuery && matchesCategory;
      });
  }, [products, query, categoryFilter, activeTab]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, categoryFilter, products.length]);

  if (loading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">HỆ THỐNG SẢN PHẨM & KHO</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý danh mục, nhập kho và lịch sử biến động tập trung.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          {[
            { id: 'products', label: 'Sản phẩm', icon: Package },
            { id: 'inventory', label: 'Kho hàng', icon: Boxes },
            { id: 'history', label: 'Lịch sử', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-md scale-105' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-[28px] border border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Boxes className="w-5 h-5" /></div>
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Tổng tồn kho</p>
          </div>
          <p className="text-3xl font-black text-blue-900">{summary.totalItems}</p>
        </div>

        <div className="rounded-[28px] border border-amber-100 bg-linear-to-br from-amber-50 to-yellow-50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg"><AlertTriangle className="w-5 h-5" /></div>
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Sắp hết hàng</p>
          </div>
          <p className="text-3xl font-black text-amber-900">{products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length}</p>
        </div>
        <div className="rounded-[28px] border border-rose-100 bg-linear-to-br from-rose-50 to-orange-50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Package className="w-5 h-5" /></div>
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Đang bán Web</p>
          </div>
          <p className="text-3xl font-black text-rose-900">{products.filter(p => p.is_active).length}</p>
        </div>
      </div>



      {showForm && (
        <div className="fixed inset-0 bg-slate-900/55 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl p-0 w-full max-w-5xl max-h-[90vh] overflow-auto shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] border border-blue-50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="w-full p-5 border-b border-gray-100 bg-linear-to-r from-blue-50/60 via-white to-indigo-50/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{editing ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
                    <p className="text-xs text-gray-500 mt-1">Cập nhật thông tin sản phẩm, giá bán và media theo chuẩn catalog.</p>
                  </div>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2 transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên sản phẩm *</label>
                <div className="relative">
                  <Boxes className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    required 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                  <div className="relative">
                    <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giá gốc (VNĐ)</label>
                  <div className="relative">
                    <Wallet className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="number" min="0" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tồn kho vật lý</p>
                    <p className="text-xl font-black text-slate-900">{form.warehouse_quantity || 0} <span className="text-xs text-slate-400 font-bold">đơn vị</span></p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang bán Web</p>
                    <p className="text-xl font-black text-blue-600">{form.stock_quantity || 0} <span className="text-xs text-slate-400 font-bold">đơn vị</span></p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
                  <div className="relative">
                    <Layers className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    {categoriesSorted.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.level > 0 ? `\u00A0\u00A0\u00A0-- ${c.name}` : c.name}
                      </option>
                    ))}
                  </select></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Đánh giá mặc định (0-5)</label>
                  <div className="relative">
                    <Star className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hình ảnh sản phẩm</label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 cursor-pointer transition-colors">
                    {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {uploadingImages ? 'Đang tải ảnh...' : 'Tải ảnh từ máy tính'}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleProductImageUpload} disabled={uploadingImages} />
                  </label>
                  {formImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image_url: '' }))}
                      className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 transition-colors"
                    >
                      Xóa toàn bộ ảnh
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  {formImages.length > 0 ? (
                    <div className="grid grid-cols-5 gap-2">
                      {formImages.slice(0, 5).map((src, idx) => (
                        <div key={`${src}-${idx}`} className="aspect-square rounded-xl border border-gray-200 bg-gray-50 p-1.5">
                          <img src={src} alt={`preview-${idx}`} className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Chưa có ảnh preview
                    </div>
                  )}
                </div>
              </div>

              {/* Promotions editor */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-600" /> Ưu đãi riêng sản phẩm
                </label>
                <div className="space-y-2">
                  {(form.promotions || []).map((promo, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={promo}
                        onChange={(e) => {
                          const updated = [...form.promotions];
                          updated[idx] = e.target.value;
                          setForm({ ...form, promotions: updated });
                        }}
                        placeholder={`Ưu đãi ${idx + 1}, VD: Tặng kèm chuột không dây`}
                        className="flex-1 px-3 py-2 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.promotions.filter((_, i) => i !== idx);
                          setForm({ ...form, promotions: updated });
                        }}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, promotions: [...(form.promotions || []), ''] })}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm ưu đãi
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Để trống nếu chỉ hiện ưu đãi mặc định (bảo hành, giao hàng, đổi trả...)</p>
              </div>

              {/* Specifications editor */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" /> Thông số kỹ thuật
                </label>
                <div className="space-y-2">
                  {(form.specifications || []).map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.label || ''}
                        onChange={(e) => {
                          const updated = [...form.specifications];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setForm({ ...form, specifications: updated });
                        }}
                        placeholder="Tên thông số, VD: Dung lượng"
                        className="w-2/5 px-3 py-2 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <input
                        type="text"
                        value={spec.value || ''}
                        onChange={(e) => {
                          const updated = [...form.specifications];
                          updated[idx] = { ...updated[idx], value: e.target.value };
                          setForm({ ...form, specifications: updated });
                        }}
                        placeholder="Giá trị, VD: 250GB NVMe"
                        className="flex-1 px-3 py-2 border border-gray-200 bg-gray-50/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.specifications.filter((_, i) => i !== idx);
                          setForm({ ...form, specifications: updated });
                        }}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, specifications: [...(form.specifications || []), { label: '', value: '' }] })}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm thông số
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">VD: Dung lượng → 250GB | Chuẩn kết nối → NVMe PCIe Gen 4</p>
              </div>

              {/* Variants editor */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-rose-600" /> Các phiên bản & Giá chênh lệch
                </label>
                <div className="space-y-4">
                  {(form.variants || []).map((vGroup, gIdx) => (
                    <div key={gIdx} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={vGroup.label || ''}
                          onChange={(e) => {
                            const updated = [...form.variants];
                            updated[gIdx] = { ...updated[gIdx], label: e.target.value };
                            setForm({ ...form, variants: updated });
                          }}
                          placeholder="Tên nhóm, VD: Dung lượng"
                          className="flex-1 px-3 py-2 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.variants.filter((_, i) => i !== gIdx);
                            setForm({ ...form, variants: updated });
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(vGroup.options || []).map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                            <input
                              type="text"
                              value={opt.name || ''}
                              onChange={(e) => {
                                const updated = [...form.variants];
                                updated[gIdx].options[oIdx].name = e.target.value;
                                setForm({ ...form, variants: updated });
                              }}
                              placeholder="Tên bản, VD: 256GB"
                              className="flex-1 text-xs outline-none"
                            />
                            <div className="flex items-center gap-1 border-l pl-2 border-gray-100">
                              <span className={`text-[10px] ${opt.price_adj < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {opt.price_adj >= 0 ? '+' : ''}
                              </span>
                              <input
                                type="number"
                                value={opt.price_adj || 0}
                                onChange={(e) => {
                                  const updated = [...form.variants];
                                  updated[gIdx].options[oIdx].price_adj = Number(e.target.value);
                                  setForm({ ...form, variants: updated });
                                }}
                                className="w-16 text-xs outline-none font-bold text-blue-600"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...form.variants];
                                updated[gIdx].options = updated[gIdx].options.filter((_, i) => i !== oIdx);
                                setForm({ ...form, variants: updated });
                              }}
                              className="text-gray-300 hover:text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...form.variants];
                            updated[gIdx].options = [...(updated[gIdx].options || []), { name: '', price_adj: 0 }];
                            setForm({ ...form, variants: updated });
                          }}
                          className="px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-white transition-all"
                        >
                          + Thêm lựa chọn
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, variants: [...(form.variants || []), { label: '', options: [{ name: '', price_adj: 0 }] }] })}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm nhóm phiên bản (Màu sắc, Dung lượng...)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_hot} onChange={(e) => setForm({ ...form, is_hot: e.target.checked })} className="rounded" /> HOT</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} className="rounded" /> Còn hàng</label>
              </div>

              <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 hover:bg-black disabled:opacity-60 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all md:col-span-2 shadow-xl shadow-slate-200 mt-4">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {editing ? 'LƯU THAY ĐỔI' : 'TẠO SẢN PHẨM MỚI'}
              </button>
            </form>
          </div>
        </div>
      )}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-linear-to-br from-slate-50 to-white">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Kiểm soát kho hàng</h3>
              <p className="text-slate-400 text-sm mt-1">Theo dõi số lượng tồn kho và quản lý danh mục linh kiện.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setStockInForm(prev => ({ ...prev, category_id: categories[0]?.id || '' }));
                  setShowStockIn(true);
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Nhập kho nhanh
              </button>
              <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-black border border-amber-100">
                Cần nhập: {products.filter(p => p.stock_quantity <= 5).length}
              </div>
              <button onClick={fetchData} className="p-3 bg-white border border-gray-200 rounded-xl text-slate-600 hover:bg-gray-50 transition-all shadow-sm"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-50 bg-slate-50/30">
                  <th className="px-8 py-5 text-left">Hàng hóa / Linh kiện</th>
                  <th className="px-8 py-5 text-center">Tồn kho vật lý</th>
                  <th className="px-8 py-5 text-center">Trên Web</th>
                  <th className="px-8 py-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.filter(p => p.warehouse_quantity > 0 || !p.is_active).sort((a,b) => a.warehouse_quantity - b.warehouse_quantity).map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl border border-gray-100 bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                          {p.image_url ? (
                            <ProductImage imageSources={normalizeProductImages(p.image_url)} alt={p.name} containerClassName="w-full h-full" imgClassName="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><Package className="w-6 h-6" /></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-black">ID: #{p.id} • {p.category?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="text-xl font-black text-slate-900">{p.warehouse_quantity}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">đơn vị khả dụng</div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="text-sm font-bold text-blue-600">{p.stock_quantity || 0}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">đang niêm yết</div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2.5 bg-white border border-gray-100 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditing(null);
                            setForm({
                              ...defaultForm,
                              name: p.name,
                              category_id: p.category_id,
                              warehouse_quantity: p.warehouse_quantity,
                              stock_quantity: 0,
                              price: p.price || 0,
                              image_url: p.image_url || ''
                            });
                            setEditing(p.id); // Sửa chính item này để bổ sung thông tin lên web
                            setShowForm(true);
                          }} 
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100 transition-all active:scale-95"
                        >
                          ĐĂNG WEB
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black text-slate-900">Lịch sử biến động</h3>
              <p className="text-slate-400 text-xs mt-1">Danh sách tất cả các hoạt động nhập/xuất kho.</p>
            </div>
            <button onClick={fetchData} className="p-3 bg-white border border-gray-200 rounded-xl text-slate-600 hover:bg-gray-50 transition-all"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-50 bg-white">
                  <th className="px-8 py-5 text-left">Ngày tháng</th>
                  <th className="px-8 py-5 text-left">Sản phẩm</th>
                  <th className="px-8 py-5 text-center">Hoạt động</th>
                  <th className="px-8 py-5 text-center">Số lượng</th>
                  <th className="px-8 py-5 text-right">Giá trị</th>
                  <th className="px-8 py-5 text-left">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5 text-slate-500 font-medium">{new Date(m.created_at).toLocaleString('vi-VN')}</td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-800">{m.product?.name}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: #{m.product_id}</div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        m.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {m.type === 'IN' ? 'NHẬP KHO' : 'XUẤT KHO'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-black text-slate-900">{m.type === 'IN' ? '+' : '-'}{m.quantity}</td>
                    <td className="px-8 py-5 text-right font-bold text-slate-900">{m.price ? m.price.toLocaleString() + 'đ' : '—'}</td>
                    <td className="px-8 py-5 text-slate-400 text-xs italic">{m.reason || m.notes || '—'}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-slate-400 font-bold">Chưa có dữ liệu biến động kho.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 mb-5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo ID, tên sản phẩm hoặc danh mục..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-semibold text-sm min-w-[200px]"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categoriesSorted.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.level > 0 ? `\u00A0\u00A0\u00A0-- ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
              >
                <Upload className="w-4 h-4" /> Đăng hàng từ Kho
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-auto max-h-[68vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50/95 backdrop-blur border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Sản phẩm</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Danh mục</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Giá</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Tồn kho</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Trạng thái</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((p) => {
                  const images = normalizeProductImages(p.image_url);
                  const hasDiscount = Number(p.original_price) > Number(p.price);
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-[280px]">
                          <div className="w-14 h-14 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
                            <ProductImage
                              imageSources={images}
                              alt={p.name}
                              containerClassName="w-full h-full"
                              imgClassName="w-full h-full object-contain"
                              fallbackClassName="w-full h-full grid place-items-center text-gray-300"
                              fallbackContent={<Package className="w-5 h-5" />}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              <span className="text-gray-500 font-bold">#{p.id}</span>
                              <span>{p.name}</span>
                              {p.is_hot && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">HOT</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{images.length > 0 ? `${images.length} ảnh` : 'Chưa có ảnh'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                          {p.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-blue-700">{p.price?.toLocaleString('vi-VN')}đ</div>
                        {hasDiscount && <div className="text-xs text-gray-400 line-through">{p.original_price?.toLocaleString('vi-VN')}đ</div>}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700">{p.stock_quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap shadow-sm border ${
                          p.in_stock 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.in_stock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                          {p.in_stock ? 'Còn hàng' : 'Hết hàng'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleToggleActive(p, false)} className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center transition-colors shadow-sm" title="Gỡ khỏi Web"><X className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-sm"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteTarget(p.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
              <div className="mt-3 px-5 py-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-50">
                <span>Kết quả lọc: <span className="font-bold text-gray-700">{filteredProducts.length}</span> sản phẩm</span>
                <span>Hiển thị theo trang: {pageSize} mục</span>
              </div>
              <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa sản phẩm"
        message="Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
      />

      {showPicker && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-emerald-50">
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 p-8 text-white shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20"><Upload className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">CHỌN HÀNG TỪ KHO</h3>
                    <p className="text-emerald-50/70 text-xs mt-1">Chọn món và số lượng để đưa lên Web bán hàng.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Tìm món hàng..." 
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/20 min-w-[240px]"
                    />
                  </div>
                  <button onClick={() => { setShowPicker(false); setPickerSelected([]); setPickerSearch(''); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Danh mục */}
              <div className="w-64 bg-slate-50 border-r border-gray-100 overflow-auto p-4 shrink-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Lọc theo loại hàng</p>
                <div className="space-y-1">
                  <button 
                    onClick={() => setPickerCategory('all')}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      pickerCategory === 'all' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-105' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Tất cả hàng kho
                  </button>
                  {categories.map(c => {
                    const count = products.filter(p => p.category_id === c.id && p.warehouse_quantity > 0).length;
                    if (count === 0) return null;
                    return (
                      <button 
                        key={c.id}
                        onClick={() => setPickerCategory(c.id)}
                        className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between ${
                          pickerCategory === c.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-105' : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${pickerCategory === c.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-auto p-8 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {products
                    .filter(p => p.warehouse_quantity > 0 && (pickerCategory === 'all' || p.category_id === pickerCategory))
                    .filter(p => !pickerSearch || p.name.toLowerCase().includes(pickerSearch.toLowerCase()))
                    .map(p => (
                      <WarehousePickerItem
                        key={p.id}
                        product={p}
                        isSelected={pickerSelected.includes(p.id)}
                        onToggle={() => setPickerSelected(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                        onPublish={(id, qty) => {
                          handlePublishFromWarehouse(id, qty).then(success => {
                            if (success) setPickerSelected(prev => prev.filter(pid => pid !== id));
                          });
                        }}
                        normalizeProductImages={normalizeProductImages}
                      />
                    ))}
                  {products.filter(p => p.warehouse_quantity > 0 && (pickerCategory === 'all' || p.category_id === pickerCategory)).length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Boxes className="w-10 h-10" /></div>
                      <p className="text-slate-400 font-bold">Không có mặt hàng nào phù hợp.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-gray-100 shrink-0 flex justify-end gap-4">
              <button onClick={() => { setShowPicker(false); setPickerSelected([]); }} className="px-8 py-3.5 text-slate-500 font-black text-sm hover:bg-slate-100 rounded-2xl transition-all">HỦY BỎ</button>
              <button 
                disabled={pickerSelected.length === 0 || submitting}
                onClick={handleBulkPublish}
                className="px-10 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all flex items-center gap-3 active:scale-95"
              >
                {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />} ĐĂNG LÊN WEB ({pickerSelected.length})
              </button>
            </div>
          </div>
        </div>
      )}



      {showStockIn && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-all duration-300" onClick={() => setShowStockIn(false)}>
          <div className="bg-white rounded-[32px] p-0 w-full max-w-lg overflow-hidden shadow-[0_25px_60px_-15px_rgba(15,23,42,0.2)] border border-slate-100/80 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-50 bg-linear-to-br from-slate-50/50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-linear-to-tr from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200 border border-slate-700/10">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">PHIẾU NHẬP KHO</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Nhập hàng nhanh vào hệ thống</p>
                  </div>
                </div>
                <button onClick={() => setShowStockIn(false)} className="p-2.5 hover:bg-slate-100 hover:text-slate-900 rounded-2xl transition-all duration-200 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleStockIn} className="p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên món hàng / Linh kiện *</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="text"
                    required
                    list="product-suggestions"
                    placeholder="Nhập tên món hàng..."
                    value={stockInForm.product_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const existing = products.find(p => p.name.toLowerCase() === name.toLowerCase());
                      setStockInForm({ 
                        ...stockInForm, 
                        product_name: name,
                        product_id: existing ? existing.id : '',
                        category_id: existing ? existing.category_id : (stockInForm.category_id || categories[0]?.id)
                      });
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100/60 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all duration-200 font-bold text-slate-800 placeholder:text-slate-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                  />
                  <datalist id="product-suggestions">
                    {products.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Phân phối hàng nhập *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setStockInForm({...stockInForm, type: 'WEB', reason: 'Nhập thẳng bán Web'})}
                    className={`flex items-center justify-center gap-2.5 py-4 px-3 rounded-2xl border-2 transition-all duration-200 font-bold text-sm tracking-wide uppercase cursor-pointer ${
                      stockInForm.type === 'WEB'
                        ? 'border-blue-600 bg-linear-to-b from-blue-50/50 to-blue-50 text-blue-600 shadow-[0_4px_12px_rgba(59,130,246,0.12)] scale-[1.01]'
                        : 'border-slate-100/80 bg-slate-50/60 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <Boxes className={`w-5 h-5 ${stockInForm.type === 'WEB' ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span>Đăng bán Web</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockInForm({...stockInForm, type: 'WAREHOUSE', reason: 'Nhập hàng vào kho'})}
                    className={`flex items-center justify-center gap-2.5 py-4 px-3 rounded-2xl border-2 transition-all duration-200 font-bold text-sm tracking-wide uppercase cursor-pointer ${
                      stockInForm.type === 'WAREHOUSE'
                        ? 'border-slate-900 bg-linear-to-b from-slate-50 to-slate-100/50 text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.08)] scale-[1.01]'
                        : 'border-slate-100/80 bg-slate-50/60 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <Package className={`w-5 h-5 ${stockInForm.type === 'WAREHOUSE' ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <span>Lưu kho vật lý</span>
                  </button>
                </div>
                <div className={`mt-3.5 p-4 rounded-2xl border flex gap-3 items-start transition-all duration-300 ${
                  stockInForm.type === 'WEB' 
                    ? 'bg-linear-to-r from-blue-50/50 to-blue-50/10 border-blue-100/40 text-blue-800' 
                    : 'bg-linear-to-r from-slate-50/50 to-slate-50/10 border-slate-100/60 text-slate-600'
                }`}>
                  <CornerDownRight className={`w-4 h-4 shrink-0 ${stockInForm.type === 'WEB' ? 'text-blue-500' : 'text-slate-400'} mt-0.5`} />
                  <p className="text-[11px] font-semibold leading-relaxed">
                    {stockInForm.type === 'WEB' 
                      ? 'Hàng nhập sẽ được cộng thẳng vào số lượng Đang bán Web để bán trực tiếp online.'
                      : 'Hàng nhập sẽ lưu tại Kho vật lý nội bộ trước, chưa hiển thị để bán lẻ trên Web.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Danh mục *</label>
                  <select
                    required
                    value={stockInForm.category_id}
                    onChange={(e) => setStockInForm({ ...stockInForm, category_id: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100/60 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all duration-200 font-bold text-slate-800 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] appearance-none"
                  >
                    {categoriesSorted.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.level > 0 ? `\u00A0\u00A0\u00A0-- ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Số lượng *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100/60 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all duration-200 font-bold text-slate-800 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingStock}
                className="w-full py-4.5 bg-slate-900 hover:bg-black active:scale-[0.99] text-white rounded-2xl font-bold text-sm tracking-wider uppercase shadow-xl shadow-slate-900/10 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {submittingStock ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                XÁC NHẬN NHẬP KHO
              </button>
            </form>
          </div>
        </div>
      )}

      <AdminToast
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />
    </div>
  );
};

export default AdminProductsPage;
