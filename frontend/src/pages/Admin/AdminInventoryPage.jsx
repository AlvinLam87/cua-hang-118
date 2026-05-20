import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Truck, History, LayoutDashboard, Search, Plus, 
  ArrowUpRight, ArrowDownLeft, AlertTriangle, Loader2, 
  User, Phone, MapPin, Edit, Trash2, Save, X, Calendar, DollarSign,
  TrendingUp, Boxes, Filter, MoreVertical, ExternalLink, ShieldCheck,
  RefreshCw, Image as ImageIcon, Wallet, Layers, Star, Gift, Palette
} from 'lucide-react';
import AdminToast from '../../components/admin/AdminToast.jsx';
import AdminPagination from '../../components/admin/AdminPagination.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import { normalizeProductImages } from '../../utils/media.js';
import { API_V1_URL } from '../../utils/api.js';

const AdminInventoryPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  // States for Stock-In
  const [stockInForm, setStockInForm] = useState({
    product_id: '',
    quantity: '',
    price: '',
    type: 'WEB',
    reason: 'Nhập hàng bổ sung',
    notes: ''
  });
  const [submittingStock, setSubmittingStock] = useState(false);


  
  // States for NEW PRODUCT FORM
  const [showProductForm, setShowProductForm] = useState(false);
  const defaultProductForm = {
    name: '', category_id: '', description: '', price: '', original_price: '',
    image_url: '', stock_quantity: 0, in_stock: true, is_hot: false,
    rating: 5, promotions: [], specifications: [], variants: [],
    initial_quantity: '', initial_import_price: ''
  };
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, mRes] = await Promise.all([
        fetch(`${API_V1_URL}/admin/products`, { headers }),
        fetch(`${API_V1_URL}/categories`),
        fetch(`${API_V1_URL}/admin/inventory/movements`, { headers })
      ]);
      
      if (!pRes.ok || !cRes.ok || !mRes.ok) {
        throw new Error('Không thể tải một số dữ liệu từ máy chủ.');
      }

      const [pData, cData, mData] = await Promise.all([
        pRes.json(), cRes.json(), mRes.json()
      ]);
      
      if (pData.success) setProducts(pData.data);
      if (cData.success) setCategories(cData.data);
      if (mData.success) setMovements(mData.data);
    } catch (err) {
      console.error(err);
      showMessage('error', 'Lỗi tải dữ liệu kho.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showMessage = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    const totalItems = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
    const lowStock = products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5);
    const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0);
    
    // Tính vốn tồn kho: Lấy giá nhập cuối cùng của mỗi SP * Số lượng tồn
    const totalInValue = products.reduce((acc, p) => {
      const lastIn = movements.find(m => m.product_id === p.id && m.type === 'IN');
      const costPrice = lastIn ? lastIn.price : (p.price * 0.7); // Fallback nếu chưa từng nhập
      return acc + ((p.stock_quantity || 0) * costPrice);
    }, 0);
      
    return { totalItems, lowStock, outOfStock, totalInValue };
  }, [products, movements]);

  // Handle Stock-In
  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!stockInForm.product_id || !stockInForm.quantity) {
      return showMessage('error', 'Vui lòng chọn sản phẩm và số lượng.');
    }
    setSubmittingStock(true);
    try {
      const res = await fetch(`${API_V1_URL}/admin/inventory/stock-in`, {
        method: 'POST',
        headers,
        body: JSON.stringify(stockInForm)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Đã nhập kho thành công.');
        setStockInForm({ product_id: '', quantity: '', price: '', type: 'WEB', reason: 'Nhập hàng bổ sung', notes: '' });
        fetchData();
        setActiveTab('dashboard');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSubmittingStock(false);
    }
  };



  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category_id || !productForm.price) {
      return showMessage('error', 'Vui lòng điền đủ Tên, Danh mục và Giá.');
    }
    setSubmittingProduct(true);
    try {
      const payload = {
        ...productForm,
        promotions: JSON.stringify((productForm.promotions || []).filter(p => p.trim())),
        specifications: JSON.stringify((productForm.specifications || []).filter(s => s.label?.trim())),
        variants: JSON.stringify((productForm.variants || []).filter(v => v.label?.trim())),
      };
      const res = await fetch(`${API_V1_URL}/admin/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (productForm.initial_quantity > 0) {
           await fetch(`${API_V1_URL}/admin/inventory/stock-in`, {
             method: 'POST',
             headers,
             body: JSON.stringify({
               product_id: data.data.id,
               quantity: productForm.initial_quantity,
               price: productForm.initial_import_price || (productForm.price * 0.7),
               reason: 'Khởi tạo sản phẩm ban đầu'
             })
           });
        }
        showMessage('success', 'Đã khởi tạo sản phẩm mới.');
        setShowProductForm(false);
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const openProductModal = () => {
    setProductForm(defaultProductForm);
    setShowProductForm(true);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
    try {
      const res = await fetch(`${API_V1_URL}/admin/upload-multiple`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const current = (productForm.image_url || '').split(',').map(s => s.trim()).filter(Boolean);
        const merged = [...new Set([...current, ...(data.data.image_urls || [])])];
        setProductForm(prev => ({ ...prev, image_url: merged.join(', ') }));
        showMessage('success', `Đã tải lên ${data.data.image_urls.length} ảnh.`);
      }
    } catch (err) {
      showMessage('error', 'Lỗi tải ảnh.');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-40 bg-[#f8fafc] min-h-screen"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in duration-700">
      <AdminToast feedback={feedback} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* MODAL BENTO TEST */}
      {showProductForm && (
        <div className="fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center p-4 lg:p-8 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-5xl shadow-2xl my-auto animate-in zoom-in duration-300 relative overflow-hidden">
            {/* Header with gradient line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-600 via-indigo-500 to-emerald-500"></div>
            
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl px-12 py-10 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">KHỞI TẠO SẢN PHẨM</h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className="h-px w-8 bg-slate-200"></span>
                  <p className="text-slate-400 text-[11px] uppercase font-black tracking-[0.3em]">Advanced Catalog Entry System</p>
                </div>
              </div>
              <button onClick={() => setShowProductForm(false)} className="w-14 h-14 hover:bg-slate-100 rounded-full transition-all flex items-center justify-center group">
                <X className="w-8 h-8 text-slate-300 group-hover:text-slate-900 transition-colors" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="px-12 pb-12">
              <div className="grid grid-cols-12 gap-8">
                
                {/* LEFT COLUMN: Basic Info (7 columns) */}
                <div className="col-span-12 lg:col-span-7 space-y-8">
                  <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên gọi sản phẩm *</label>
                      <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-xl text-slate-800 placeholder:text-slate-300 transition-all shadow-sm" placeholder="VD: Camera IP Hikvision 4MP Full Color" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Phân loại danh mục *</label>
                        <div className="relative">
                          <select 
                            required 
                            value={productForm.category_id} 
                            onChange={e => setProductForm({...productForm, category_id: e.target.value})} 
                            className="w-full px-8 py-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-800 appearance-none shadow-sm cursor-pointer"
                          >
                            <option value="">Chọn danh mục...</option>
                            {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <Layers className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá bán niêm yết (VNĐ) *</label>
                        <div className="relative">
                          <input required type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-blue-600 shadow-sm text-lg" placeholder="0" />
                          <DollarSign className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá gốc chưa giảm (Gạch giá)</label>
                        <input type="number" value={productForm.original_price} onChange={e => setProductForm({...productForm, original_price: e.target.value})} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-400 shadow-sm" placeholder="Không bắt buộc" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả ngắn gọn</label>
                         <input type="text" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium text-slate-600 shadow-sm" placeholder="VD: Bảo hành 24 tháng, chính hãng..." />
                      </div>
                    </div>
                  </div>

                  {/* Images & Media Section */}
                  <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Thư viện hình ảnh</label>
                      <span className="text-[10px] font-bold text-slate-400 italic">Ảnh đầu tiên sẽ là ảnh đại diện</span>
                    </div>
                    <div className="grid grid-cols-6 gap-4">
                      {(productForm.image_url || '').split(',').map((url, i) => url.trim() && (
                        <div key={i} className="relative aspect-square rounded-[20px] border-2 border-white overflow-hidden group shadow-md ring-1 ring-slate-100">
                          <img src={url.trim()} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => {
                              const urls = productForm.image_url.split(',').map(s => s.trim()).filter((_, idx) => idx !== i);
                              setProductForm({...productForm, image_url: urls.join(', ')});
                            }} className="p-2 bg-rose-500 text-white rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          {i === 0 && <div className="absolute top-2 left-2 bg-blue-600 text-[8px] font-black text-white px-2 py-1 rounded-md uppercase">Main</div>}
                        </div>
                      ))}
                      <label className="aspect-square rounded-[20px] border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center cursor-pointer group">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-blue-600 tracking-tighter">Thêm ảnh</span>
                        <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Stock & Status (5 columns) */}
                <div className="col-span-12 lg:col-span-5 space-y-8">
                  {/* Stock Initialization Card */}
                  <div className="bg-linear-to-br from-slate-900 to-indigo-950 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                        <Package className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg leading-none">QUẢN LÝ KHO</h4>
                        <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-1.5">Initial Stock Entry</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Số lượng nhập ban đầu *</label>
                        <input required type="number" value={productForm.initial_quantity} onChange={e => setProductForm({...productForm, initial_quantity: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/30 outline-none font-black text-2xl text-white transition-all" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Giá nhập thực tế (VNĐ)</label>
                        <div className="relative">
                          <input type="number" value={productForm.initial_import_price} onChange={e => setProductForm({...productForm, initial_import_price: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/30 outline-none font-bold text-emerald-400 transition-all" placeholder="Mặc định = 70% giá bán" />
                          <DollarSign className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Highlights */}
                  <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái & Đánh giá</label>
                    
                    <div className="flex flex-col gap-4">
                      <label htmlFor="is_hot_inv" className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] cursor-pointer hover:border-amber-400 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <TrendingUp className="w-5 h-5 text-amber-500 group-hover:text-white" />
                          </div>
                          <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Sản phẩm HOT</span>
                        </div>
                        <input type="checkbox" id="is_hot_inv" checked={productForm.is_hot} onChange={e => setProductForm({...productForm, is_hot: e.target.checked})} className="w-6 h-6 rounded-lg border-slate-300 text-amber-500 focus:ring-amber-200" />
                      </label>

                      <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] hover:border-blue-400 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Star className="w-5 h-5 text-blue-500 group-hover:text-white" />
                          </div>
                          <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Đánh giá sao</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          <input type="number" min="1" max="5" value={productForm.rating} onChange={e => setProductForm({...productForm, rating: e.target.value})} className="w-8 bg-transparent text-center font-black text-blue-600 outline-none" />
                          <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM SECTION: Advanced Tabs Style */}
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Specifications Card */}
                  <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Thông số kỹ thuật</label>
                      </div>
                      <button type="button" onClick={() => setProductForm({...productForm, specifications: [...(productForm.specifications || []), { label: '', value: '' }]})} className="w-8 h-8 bg-white text-blue-600 rounded-xl shadow-sm flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {(productForm.specifications || []).map((s, idx) => (
                        <div key={idx} className="flex gap-2 group animate-in slide-in-from-right-4 duration-300">
                          <input placeholder="VD: CPU" value={s.label} onChange={e => {
                            const newS = [...productForm.specifications];
                            newS[idx].label = e.target.value;
                            setProductForm({...productForm, specifications: newS});
                          }} className="w-1/3 bg-white px-4 py-3 rounded-xl text-[10px] border border-slate-200 outline-none font-bold shadow-xs" />
                          <input placeholder="Giá trị" value={s.value} onChange={e => {
                            const newS = [...productForm.specifications];
                            newS[idx].value = e.target.value;
                            setProductForm({...productForm, specifications: newS});
                          }} className="flex-1 bg-white px-4 py-3 rounded-xl text-[10px] border border-slate-200 outline-none shadow-xs" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Promotions Card */}
                  <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-emerald-400" />
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Khuyến mãi & Quà</label>
                      </div>
                      <button type="button" onClick={() => setProductForm({...productForm, promotions: [...(productForm.promotions || []), '']})} className="w-8 h-8 bg-white text-emerald-600 rounded-xl shadow-sm flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {(productForm.promotions || []).map((p, idx) => (
                        <div key={idx} className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
                          <input placeholder="VD: Tặng túi chống sốc" value={p} onChange={e => {
                            const newP = [...productForm.promotions];
                            newP[idx] = e.target.value;
                            setProductForm({...productForm, promotions: newP});
                          }} className="flex-1 bg-white px-4 py-3 rounded-xl text-[10px] border border-slate-200 outline-none shadow-xs font-medium" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variants Card */}
                  <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-indigo-400" />
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Phiên bản & Màu</label>
                      </div>
                      <button type="button" onClick={() => setProductForm({...productForm, variants: [...(productForm.variants || []), { label: '', options: [{ name: '', price_adj: 0 }] }]})} className="w-8 h-8 bg-white text-indigo-600 rounded-xl shadow-sm flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {(productForm.variants || []).map((v, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group/v animate-in slide-in-from-right-4 duration-300">
                          <button type="button" onClick={() => {
                            const newV = [...productForm.variants];
                            newV.splice(idx, 1);
                            setProductForm({...productForm, variants: newV});
                          }} className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 text-rose-500 rounded-full flex items-center justify-center shadow-sm hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover/v:opacity-100 z-10"><X className="w-3 h-3" /></button>
                          <input placeholder="Nhóm (VD: Màu sắc)" value={v.label} onChange={e => {
                            const newV = [...productForm.variants];
                            newV[idx].label = e.target.value;
                            setProductForm({...productForm, variants: newV});
                          }} className="w-full text-[10px] font-black uppercase tracking-wider mb-3 outline-none text-slate-800 border-b border-slate-100 pb-2" />
                          <div className="space-y-2">
                            {v.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex gap-2">
                                <input placeholder="Option" value={opt.name} onChange={e => {
                                  const newV = [...productForm.variants];
                                  newV[idx].options[oIdx].name = e.target.value;
                                  setProductForm({...productForm, variants: newV});
                                }} className="flex-1 bg-slate-50 px-3 py-2 rounded-lg text-[9px] outline-none font-bold" />
                                <input type="number" placeholder="+/- VNĐ" value={opt.price_adj} onChange={e => {
                                  const newV = [...productForm.variants];
                                  newV[idx].options[oIdx].price_adj = parseInt(e.target.value) || 0;
                                  setProductForm({...productForm, variants: newV});
                                }} className="w-20 bg-slate-50 px-3 py-2 rounded-lg text-[9px] outline-none font-black text-blue-600" />
                              </div>
                            ))}
                            <button type="button" onClick={() => {
                              const newV = [...productForm.variants];
                              newV[idx].options.push({ name: '', price_adj: 0 });
                              setProductForm({...productForm, variants: newV});
                            }} className="text-[9px] font-black text-blue-500 hover:underline mt-2">+ Thêm Option</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-16 flex gap-6">
                <button type="button" onClick={() => setShowProductForm(false)} className="flex-1 py-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[28px] font-black text-lg transition-all tracking-tight">HỦY BỎ</button>
                <button type="submit" disabled={submittingProduct} className="flex-[3] py-6 bg-slate-900 hover:bg-black text-white rounded-[28px] font-black text-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-4 group">
                  {submittingProduct ? (
                    <Loader2 className="animate-spin w-8 h-8" />
                  ) : (
                    <>
                      <Save className="w-7 h-7 group-hover:scale-110 transition-transform" />
                      <span>XÁC NHẬN KHỞI TẠO & NHẬP KHO</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200/60 sticky top-0 z-40 px-4 lg:px-8 py-5">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                <Boxes className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">QUẢN LÝ KHO</h1>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1.5">Inventory & Supply Chain Control</p>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
            {[
              { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
              { id: 'stock-in', label: 'Nhập kho', icon: ArrowDownLeft },
              { id: 'history', label: 'Lịch sử', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
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
      </div>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Tổng tồn kho', value: stats.totalItems, color: 'from-blue-600 to-indigo-600', icon: Package, sub: 'Đơn vị sản phẩm' },
                { label: 'Giá vốn tồn', value: stats.totalInValue.toLocaleString() + 'đ', color: 'from-emerald-600 to-teal-600', icon: DollarSign, sub: 'Giá trị ước tính' },
                { label: 'Sắp hết hàng', value: stats.lowStock.length, color: 'from-amber-500 to-orange-500', icon: AlertTriangle, sub: 'Cần nhập thêm' },
                { label: 'Hết hàng', value: stats.outOfStock.length, color: 'from-rose-600 to-pink-600', icon: X, sub: 'Ngưng kinh doanh' },
              ].map((s, i) => (
                <div key={i} className="relative overflow-hidden bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 group hover:shadow-xl transition-all duration-500">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${s.color} opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700`} />
                  <div className={`w-12 h-12 bg-linear-to-br ${s.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{s.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{s.value}</h3>
                  <p className="text-slate-400 text-[10px] font-bold mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" /> {s.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT: CRITICAL INVENTORY */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <AlertTriangle className="text-amber-500 w-6 h-6" /> Cảnh báo tồn kho
                      </h4>
                      <p className="text-slate-400 text-sm mt-1">Danh sách sản phẩm dưới ngưỡng an toàn.</p>
                    </div>
                    <button onClick={() => setActiveTab('stock-in')} className="text-blue-600 text-xs font-black hover:underline">Nhập hàng ngay</button>
                  </div>

                  <div className="space-y-4">
                    {[...stats.outOfStock, ...stats.lowStock].slice(0, 6).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-[24px] border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm group-hover:rotate-3 transition-transform">
                            <ProductImage imageSources={normalizeProductImages(p.image_url)} alt={p.name} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm leading-tight line-clamp-1">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.category?.name || 'Linh kiện'}</span>
                               <button 
                                 onClick={() => {
                                   setStockInForm(prev => ({ ...prev, product_id: p.id }));
                                   setActiveTab('stock-in');
                                 }}
                                 className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1"
                               >
                                 <Plus className="w-3 h-3" /> NHẬP HÀNG
                               </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            p.stock_quantity === 0 
                              ? 'bg-rose-100 text-rose-600 border border-rose-200' 
                              : 'bg-amber-100 text-amber-600 border border-amber-200'
                          }`}>
                            Tồn: {p.stock_quantity}
                          </div>
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden ml-auto">
                            <div 
                              className={`h-full rounded-full ${p.stock_quantity === 0 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                              style={{ width: `${Math.min(100, (p.stock_quantity || 0) * 10)}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(stats.outOfStock.length + stats.lowStock.length) === 0 && (
                      <div className="py-16 text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShieldCheck className="text-emerald-500 w-10 h-10" />
                        </div>
                        <p className="text-slate-400 font-bold">Kho hàng đang ở trạng thái an toàn.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: RECENT MOVEMENTS */}
              <div className="space-y-6">
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 h-full">
                  <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <History className="text-indigo-500 w-6 h-6" /> Hoạt động mới
                  </h4>
                  <div className="space-y-6 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100" />
                    
                    {movements.slice(0, 6).map((m, idx) => (
                      <div key={m.id} className="relative flex items-start gap-4 pl-12">
                        <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${
                          m.type === 'IN' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-slate-800">
                              {m.type === 'IN' ? 'Nhập kho' : 'Xuất kho'}
                            </p>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(m.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                            <span className="font-bold text-slate-900">{m.type === 'IN' ? '+' : '-'}{m.quantity}</span> {m.product?.name}
                          </p>
                          {m.supplier && (
                            <p className="text-[10px] text-blue-600 font-black mt-1 flex items-center gap-1 uppercase">
                              <Truck className="w-3 h-3" /> {m.supplier.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {movements.length === 0 && (
                      <p className="text-center py-20 text-slate-400 font-bold">Chưa có lịch sử.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STOCK-IN TAB */}
        {activeTab === 'stock-in' && (
          <div className="max-w-5xl mx-auto py-8">
            <div className="bg-white rounded-[40px] shadow-[0_40px_80px_-20px_rgba(30,41,59,0.15)] border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-5">
                {/* Left Form Sidebar */}
                <div className="lg:col-span-2 bg-linear-to-br from-slate-900 to-indigo-950 p-10 text-white">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-xl border border-white/20">
                    <ArrowDownLeft className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight leading-tight">PHIẾU NHẬP KHO</h3>
                  <p className="text-slate-400 text-sm mt-4 leading-relaxed">Ghi nhận chính xác lượng linh kiện nhập về để hệ thống tự động tính toán tồn kho và giá vốn.</p>
                  
                  <button 
                    type="button"
                    onClick={openProductModal}
                    className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <Plus className="w-5 h-5" /> TẠO SẢN PHẨM MỚI
                  </button>
                  
                  <div className="mt-12 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">1</div>
                      <p className="text-sm font-bold text-slate-300">Chọn sản phẩm nhập</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">2</div>
                      <p className="text-sm font-bold text-slate-300">Nhập số lượng & giá</p>
                    </div>

                  </div>

                  <div className="mt-20 p-6 bg-white/5 rounded-[32px] border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mẹo quản lý</p>
                    <p className="text-xs text-slate-400 mt-2 italic">Hãy lưu lại giá nhập để quản trị viên có thể theo dõi được lợi nhuận gộp chính xác trên từng sản phẩm.</p>
                  </div>
                </div>

                {/* Main Form */}
                <form onSubmit={handleStockIn} className="lg:col-span-3 p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Sản phẩm cần nhập kho</label>
                      <div className="relative">
                        <Package className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <select 
                          required
                          value={stockInForm.product_id}
                          onChange={e => setStockInForm({...stockInForm, product_id: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none font-bold text-slate-800 shadow-sm"
                        >
                          <option value="">Tìm sản phẩm...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>[#{p.id}] {p.name} (Tồn Web: {p.stock_quantity} | Kho: {p.warehouse_quantity})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Phân phối hàng nhập *</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setStockInForm({...stockInForm, type: 'WEB'})}
                          className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black text-sm uppercase ${
                            stockInForm.type === 'WEB'
                              ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md scale-102'
                              : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Boxes className="w-5 h-5 text-blue-500" />
                          <span>🌐 Đăng bán Web ngay</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockInForm({...stockInForm, type: 'WAREHOUSE'})}
                          className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black text-sm uppercase ${
                            stockInForm.type === 'WAREHOUSE'
                              ? 'border-indigo-950 bg-indigo-50 text-indigo-950 shadow-md scale-102'
                              : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Package className="w-5 h-5 text-indigo-500" />
                          <span>📦 Lưu kho vật lý</span>
                        </button>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 mt-2 italic">
                        {stockInForm.type === 'WEB' 
                          ? '👉 Hàng nhập sẽ được cộng thẳng vào số lượng Đang bán Web để bán trực tiếp online.'
                          : '👉 Hàng nhập sẽ lưu tại Kho vật lý nội bộ trước, chưa hiển thị để bán lẻ trên Web.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Số lượng nhập</label>
                      <div className="relative">
                        <Plus className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="number" required min="1"
                          value={stockInForm.quantity}
                          onChange={e => setStockInForm({...stockInForm, quantity: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800 shadow-sm"
                          placeholder="VD: 100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Giá nhập (VNĐ)</label>
                      <div className="relative">
                        <DollarSign className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="number"
                          value={stockInForm.price}
                          onChange={e => setStockInForm({...stockInForm, price: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800 shadow-sm"
                          placeholder="Giá nhập/món"
                        />
                      </div>
                    </div>



                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Ghi chú phiếu nhập</label>
                      <textarea 
                        rows="3"
                        value={stockInForm.notes}
                        onChange={e => setStockInForm({...stockInForm, notes: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 shadow-sm"
                        placeholder="VD: Nhập thêm linh kiện cho đợt thi công camera tại TP Cà Mau..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      disabled={submittingStock}
                      className="w-full py-5 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                      {submittingStock ? <Loader2 className="animate-spin" /> : <Save className="w-6 h-6" />} Xác nhận phiếu nhập
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Lịch sử biến động</h3>
                <p className="text-slate-400 text-xs mt-1">Danh sách tất cả các hoạt động nhập/xuất kho.</p>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-white border border-gray-200 rounded-xl text-slate-600 hover:bg-gray-50"><Filter className="w-4 h-4" /></button>
                <button className="p-3 bg-white border border-gray-200 rounded-xl text-slate-600 hover:bg-gray-50"><ExternalLink className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 font-black uppercase text-[10px] tracking-[2px] border-b border-gray-50 bg-white">
                    <th className="px-8 py-5 text-left">Ngày tháng</th>
                    <th className="px-8 py-5 text-left">Sản phẩm</th>
                    <th className="px-8 py-5 text-center">Hoạt động</th>
                    <th className="px-8 py-5 text-center">Số lượng</th>
                    <th className="px-8 py-5 text-right">Thành tiền</th>
                    <th className="px-8 py-5 text-left">Ghi chú / Đối tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap text-slate-500 font-bold">
                        {new Date(m.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl p-1.5 bg-white border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                            <ProductImage imageSources={normalizeProductImages(m.product?.image_url)} alt="p" />
                          </div>
                          <div>
                            <span className="font-black text-slate-800">{m.product?.name}</span>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">ID: #{m.product?.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider border ${
                          m.type === 'IN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          m.type === 'OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {m.type === 'IN' ? 'Nhập' : m.type === 'OUT' ? 'Xuất' : 'Điều chỉnh'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-slate-800 text-base">
                        {m.type === 'IN' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-900">
                        {m.price ? m.price.toLocaleString() + 'đ' : '-'}
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-slate-600 font-bold">{m.reason}</div>
                        {m.supplier && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-black uppercase mt-1">
                            <Truck className="w-3 h-3" /> {m.supplier.name}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr><td colSpan="6" className="py-32 text-center text-slate-400 font-bold">Chưa có lịch sử biến động kho.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-gray-50 flex justify-end">
              <AdminPagination page={1} totalPages={1} onChange={() => {}} />
            </div>
        </div>
      )}


    </div>
  </div>
  );
};

export default AdminInventoryPage;
