import React, { useMemo, useState, useEffect } from 'react';
import { 
  Search, Filter, ShoppingCart, ChevronDown,
  Cpu, HardDrive, Camera, Wifi, MonitorPlay, Printer, Wrench, Grid3X3, List, Boxes,
  CircuitBoard, MemoryStick, Zap, Box, Wind
} from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import ProductImage from '../../components/ProductImage.jsx';
import { normalizeProductImages } from '../../utils/media.js';
import { API_V1_URL } from '../../utils/api.js';

const iconMap = {
  Cpu: <Cpu className="w-5 h-5" />,
  HardDrive: <HardDrive className="w-5 h-5" />,
  Camera: <Camera className="w-5 h-5" />,
  Wifi: <Wifi className="w-5 h-5" />,
  Monitor: <MonitorPlay className="w-5 h-5" />,
  Printer: <Printer className="w-5 h-5" />,
  Wrench: <Wrench className="w-5 h-5" />,
  Laptop: <MonitorPlay className="w-5 h-5" />,
  PC: <Grid3X3 className="w-5 h-5" />,
  RAM: <MemoryStick className="w-5 h-5" />,
  Mainboard: <CircuitBoard className="w-5 h-5" />,
  VGA: <MonitorPlay className="w-5 h-5" />,
  PSU: <Zap className="w-5 h-5" />,
  Case: <Box className="w-5 h-5" />,
  Cooling: <Wind className="w-5 h-5" />,
};

const formatPrice = (price) => price.toLocaleString('vi-VN') + 'đ';
const normalizeText = (value) =>
  (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const rankImageSources = (sources, product) => {
  const productName = normalizeText(product?.name);
  const categoryName = normalizeText(product?.category?.name);
  const nameTokens = productName.split(/\s+/).filter((token) => token.length > 2);
  const categoryTokens = categoryName.split(/\s+/).filter((token) => token.length > 2);

  const scored = sources.map((source) => {
    const normalized = normalizeText(source);
    let score = 0;

    // Penalize generic/non-product assets.
    if (/placeholder|default|sample|avatar|logo|icon|no-image|dummy/.test(normalized)) score -= 30;
    if (/banner|background|cover/.test(normalized)) score -= 15;
    if (/\.(svg)$/.test(normalized)) score -= 8;

    // Reward matches with product/category keywords.
    nameTokens.forEach((token) => { if (normalized.includes(token)) score += 12; });
    categoryTokens.forEach((token) => { if (normalized.includes(token)) score += 6; });
    if (/\/products?\/|\/uploads?\//.test(normalized)) score += 4;

    return { source, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((item) => item.source);
};

const ShopPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [expandedCats, setExpandedCats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    setActiveSubCategory(null);
    setSearchQuery('');
    // Auto-expand if has children
    const cat = categories.find(c => c.id === catId);
    if (cat?.children?.length > 0) {
      setExpandedCats(prev => ({ ...prev, [catId]: true }));
    }
  };

  const toggleExpand = (e, catId) => {
    e.stopPropagation();
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSubCategoryClick = (e, subId) => {
    e.stopPropagation();
    setActiveSubCategory(subId);
    setSearchQuery('');
  };
  // Transform flat categories to hierarchical
  const nestedCategories = useMemo(() => {
    const root = categories.filter(c => !c.parent_id && c.name !== 'Sửa chữa tận nhà');
    return root.map(parent => ({
      ...parent,
      children: categories.filter(c => c.parent_id === parent.id)
    }));
  }, [categories]);

  const activeCategoryData = useMemo(() => 
    categories.find(c => c.id === activeCategory),
    [categories, activeCategory]
  );

  const activeSubCategoryData = useMemo(() => 
    categories.find(c => c.id === activeSubCategory),
    [categories, activeSubCategory]
  );

  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_V1_URL}/categories?type=product`),
          fetch(`${API_V1_URL}/products`)
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (catData.success) setCategories(catData.data);
        if (prodData.success) setProducts(prodData.data);
      } catch (err) {
        console.error('Lỗi tải dữ liệu cửa hàng:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const withSearchMeta = products
      .filter((p) => {
        if (activeSubCategory) return p.category_id === activeSubCategory;
        if (activeCategory) {
          // Show products of main category OR its children
          if (p.category_id === activeCategory) return true;
          const mainCat = categories.find(c => c.id === activeCategory);
          if (categories.some(child => child.parent_id === activeCategory && child.id === p.category_id)) return true;
          return false;
        }
        return true;
      })
      .map((p) => {
        const haystack = normalizeText(
          `${p.name} ${p.description || ''} ${p.category?.name || ''} ${p.icon || ''}`
        );
        const matchedTokens = queryTokens.filter((token) => haystack.includes(token));
        const allTokensMatched = queryTokens.length === 0 || matchedTokens.length === queryTokens.length;
        const directNameMatch = normalizedQuery && normalizeText(p.name).includes(normalizedQuery);
        const relevance = matchedTokens.length * 10 + (directNameMatch ? 12 : 0);
        return { product: p, allTokensMatched, relevance };
      })
      .filter((item) => item.allTokensMatched);

    return withSearchMeta
      .sort((a, b) => {
        if (queryTokens.length > 0 && a.relevance !== b.relevance) return b.relevance - a.relevance;
        if (sortBy === 'price-asc') return a.product.price - b.product.price;
        if (sortBy === 'price-desc') return b.product.price - a.product.price;
        return new Date(b.product.created_at) - new Date(a.product.created_at);
      })
      .map((item) => item.product);
  }, [products, activeCategory, activeSubCategory, searchQuery, sortBy, categories]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex justify-center items-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-24">
      {/* 1. Page Header */}
      <div className="relative overflow-hidden bg-[#0a0a0f]">
        {/* Subtle mesh gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_80%,rgba(59,130,246,0.1),transparent)]"></div>
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox%3D%220 0 200 200%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter id%3D%22n%22%3E%3CfeTurbulence type%3D%22fractalNoise%22 baseFrequency%3D%220.9%22 numOctaves%3D%224%22%2F%3E%3C%2Ffilter%3E%3Crect width%3D%22100%25%22 height%3D%22100%25%22 filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')]"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center flex flex-col items-center">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
            <span className="text-indigo-300 text-xs font-semibold uppercase tracking-[0.2em]">Linh kiện chính hãng</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05] mb-5">
            Sản Phẩm{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              Linh Kiện
            </span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mb-10 leading-relaxed">
            Nâng cấp thiết bị của bạn với linh kiện chính hãng — bảo hành minh bạch, giao hàng nhanh.
          </p>

          {/* Search bar */}
          <div className="w-full max-w-2xl relative mb-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
            <input
              type="text"
              placeholder="Tìm kiếm linh kiện, thương hiệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-5 py-4 bg-white/[0.07] hover:bg-white/[0.1] focus:bg-white/[0.12] border border-white/10 focus:border-indigo-500/50 rounded-2xl outline-none transition-all text-white placeholder-gray-500 font-medium text-base backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* 2. Left Sidebar Filters - NEW DESIGN */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white rounded-[32px] border border-gray-100 p-6 sticky top-24 shadow-sm shadow-gray-100/50">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="font-black text-gray-900 text-xl tracking-tight flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-blue-600" /> DANH MỤC
                </h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                  {categories.length} LOẠI
                </span>
              </div>
              
              <div className="space-y-6">
                {/* Special: All Products */}
                <button
                  onClick={() => { setActiveCategory(null); setActiveSubCategory(null); }}
                  className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                    activeCategory === null 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]' 
                      : 'text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    activeCategory === null ? 'bg-white/20' : 'bg-gray-100 text-gray-500 group-hover:bg-white'
                  }`}>
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-black text-sm uppercase tracking-tight">Tất cả sản phẩm</div>
                    <div className={`text-[10px] ${activeCategory === null ? 'text-blue-100' : 'text-gray-400'}`}>Xem toàn bộ catalog</div>
                  </div>
                </button>

                <div className="h-px bg-gray-100 mx-2"></div>

                <div className="space-y-1">
                  {nestedCategories.map(cat => {
                    const hasChildren = cat.children && cat.children.length > 0;
                    const isExpanded = expandedCats[cat.id];
                    const isActive = activeCategory === cat.id;

                    return (
                      <div key={cat.id} className="group/item">
                        <button
                          onClick={() => handleCategoryClick(cat.id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 ${
                            isActive && !activeSubCategory 
                              ? 'bg-slate-900 text-white shadow-lg' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isActive ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 group-hover/item:bg-white'
                          }`}>
                            {iconMap[cat.icon] || <Cpu className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-bold text-sm tracking-tight">{cat.name}</div>
                            {hasChildren && <div className={`text-[10px] ${isActive ? 'text-white/50' : 'text-gray-400'}`}>{cat.children.length} mục con</div>}
                          </div>
                          {hasChildren && (
                            <div 
                              onClick={(e) => toggleExpand(e, cat.id)}
                              className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-blue-100 text-blue-600 rotate-180' : 'hover:bg-gray-200'}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          )}
                        </button>

                        {hasChildren && isExpanded && (
                          <div className="mt-2 ml-14 space-y-1 animate-in slide-in-from-top-2 duration-300">
                            {cat.children.map(sub => (
                              <button
                                key={sub.id}
                                onClick={(e) => handleSubCategoryClick(e, sub.id)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
                                  activeSubCategory === sub.id 
                                    ? 'bg-blue-50 text-blue-700 font-black shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                              >
                                <span>{sub.name}</span>
                                {activeSubCategory === sub.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></div>}
                              </button>
                            ))}
                            <button
                              onClick={() => { setActiveCategory(cat.id); setActiveSubCategory(null); }}
                              className="w-full text-left px-4 py-2 text-[10px] text-gray-400 hover:text-blue-600 font-black uppercase tracking-widest transition-colors"
                            >
                              + Xem tất cả {cat.name}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Product Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6">
              <div className="text-sm text-gray-600">
                Tìm thấy <span className="font-bold text-gray-900">{filteredProducts.length}</span> sản phẩm
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Sắp xếp:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-20 text-center flex flex-col items-center">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy linh kiện nào</h3>
                <p className="text-gray-500 mb-6 text-sm">Vui lòng thử lại với từ khóa hoặc danh mục khác.</p>
                <button onClick={() => {setSearchQuery(''); setActiveCategory(null);}} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-6 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => {
                  const imageSources = rankImageSources(normalizeProductImages(product.image_url), product);
                  const hasDiscount = Number(product.original_price) > Number(product.price);
                  const discountPercent = hasDiscount
                    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
                    : 0;

                  return (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col" onClick={() => navigate(`/san-pham/${product.id}`)}>
                      <div className="relative aspect-square p-6 bg-white flex justify-center items-center overflow-hidden border-b border-gray-100">
                        <ProductImage
                          imageSources={imageSources}
                          alt={product.name}
                          containerClassName="w-full h-full"
                          imgClassName="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          fallbackClassName="text-gray-200 w-20 h-20"
                          fallbackContent={iconMap[product.category?.icon] || <Cpu className="w-full h-full" strokeWidth={1.5} />}
                        />
                        
                        {/* Tags */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                          {product.is_hot && (
                            <span className="bg-[#ff4d4f] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">Hot</span>
                          )}
                          {hasDiscount && (
                            <span className="bg-[#52c41a] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">-{discountPercent}%</span>
                          )}
                        </div>
                        {product.stock_quantity > 0 && product.stock_quantity < 5 && (
                          <div className="absolute bottom-2 left-2 bg-orange-100 text-orange-700 text-[10px] font-medium px-2 py-0.5 rounded-sm">
                            Còn {product.stock_quantity} SP
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[11px] font-medium text-blue-600 block">
                             {product.category?.name || 'Linh kiện'}
                           </span>
                           <div className="flex items-center gap-1 text-[#faad14] text-[11px] font-bold">
                              ★ {product.rating || '5.0'}
                           </div>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-snug mb-4 line-clamp-2" title={product.name}>
                          {product.name}
                        </h3>
                        
                        <div className="mt-auto flex items-end justify-between">
                          <div>
                             <div className="font-bold text-red-600 text-[16px]">
                               {formatPrice(product.price)}
                             </div>
                             {hasDiscount && (
                              <div className="text-[12px] text-gray-400 line-through mt-0.5">
                                {formatPrice(product.original_price)}
                              </div>
                             )}
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            disabled={!product.in_stock}
                            className={`p-2 rounded-lg transition-colors flex items-center justify-center border ${
                              product.in_stock 
                                ? 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200' 
                                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={product.in_stock ? "Thêm vào giỏ hàng" : "Hết hàng"}
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
