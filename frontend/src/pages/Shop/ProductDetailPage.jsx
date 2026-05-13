import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import ProductImage from '../../components/ProductImage.jsx';
import { normalizeProductImages } from '../../utils/media.js';
import { API_V1_URL } from '../../utils/api.js';
import {
  ArrowLeft, ShoppingCart, ShieldCheck, Truck,
  RotateCcw, Star, Cpu, HardDrive, Camera,
  Wifi, MonitorPlay, Printer, Wrench, Loader2, CheckCircle2,
  Send, MessageSquare, User, ChevronRight, Minus, Plus,
  Package, BadgeCheck, Gift, Zap, Heart, Tag, CircleDot,
  CircuitBoard, MemoryStick, Box, Wind
} from 'lucide-react';

const iconMap = {
  Cpu: <Cpu className="w-full h-full" />,
  HardDrive: <HardDrive className="w-full h-full" />,
  Camera: <Camera className="w-full h-full" />,
  Wifi: <Wifi className="w-full h-full" />,
  Monitor: <MonitorPlay className="w-full h-full" />,
  Printer: <Printer className="w-full h-full" />,
  VGA: <MonitorPlay className="w-full h-full" />,
  PSU: <Zap className="w-full h-full" />,
  Case: <Box className="w-full h-full" />,
  Cooling: <Wind className="w-full h-full" />,
  RAM: <MemoryStick className="w-full h-full" />,
  Mainboard: <CircuitBoard className="w-full h-full" />,
};

const formatPrice = (price) => Number(price).toLocaleString('vi-VN') + 'đ';

const StarRating = ({ value, onChange, size = 'w-5 h-5', interactive = false }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`${size} transition-all ${interactive ? 'cursor-pointer hover:scale-110' : ''} ${i <= value ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
        onClick={() => interactive && onChange?.(i)}
      />
    ))}
  </div>
);

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});

  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, avgRating: 0, distribution: [0, 0, 0, 0, 0] });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_V1_URL}/reviews/${id}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews);
        setReviewStats(data.data.stats);
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    }
  };

  const [relatedProducts, setRelatedProducts] = useState([]);

  const fetchRelatedProducts = async (catId) => {
    try {
      const res = await fetch(`${API_V1_URL}/products?category_id=${catId}&limit=6`);
      const data = await res.json();
      if (data.success) {
        setRelatedProducts(data.data.filter(p => p.id !== parseInt(id)));
      }
    } catch (err) {
      console.error('Lỗi tải sản phẩm liên quan:', err);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_V1_URL}/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
          if (data.data.category_id) fetchRelatedProducts(data.data.category_id);
          // Initialize selected variants
          try {
            const variants = JSON.parse(data.data.variants || '[]');
            const initial = {};
            variants.forEach(v => {
              if (v.options && v.options.length > 0) {
                initial[v.label] = v.options[0];
              }
            });
            setSelectedVariants(initial);
          } catch (e) {
            console.error('Lỗi parse variants:', e);
          }
        }
        else setError(data.message || 'Không tìm thấy sản phẩm.');
      } catch {
        setError('Lỗi kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    fetchReviews();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => { setActiveImageIndex(0); }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewMsg({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: parseInt(id), rating: reviewForm.rating, comment: reviewForm.comment }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewMsg({ type: 'success', text: 'Đánh giá thành công! Cảm ơn bạn.' });
        setReviewForm({ rating: 5, comment: '' });
        fetchReviews();
      } else {
        setReviewMsg({ type: 'error', text: data.message });
      }
    } catch {
      setReviewMsg({ type: 'error', text: 'Lỗi kết nối.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#f8f9ff]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-[#f8f9ff]">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-gray-500 text-sm mb-5">{error}</p>
        <Link to="/cua-hang" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 transition-colors">
          Về Trang Sản Phẩm
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: 'desc', label: 'Mô Tả' },
    { key: 'specs', label: 'Thông Số Kỹ Thuật' },
    { key: 'reviews', label: `Đánh Giá (${reviewStats.total})` },
  ];

  const imageSources = normalizeProductImages(product.image_url);
  const selectedImage = imageSources[activeImageIndex] || imageSources[0];

  // Calculate current price based on variants
  const variantPriceAdjustment = Object.values(selectedVariants).reduce((acc, curr) => acc + (Number(curr.price_adj) || 0), 0);
  const currentPrice = Number(product.price) + variantPriceAdjustment;
  const currentOriginalPrice = product.original_price ? Number(product.original_price) + variantPriceAdjustment : null;
  const hasDiscount = currentOriginalPrice && currentOriginalPrice > currentPrice;

  return (
    <div className="bg-[#f8f9ff] min-h-screen font-sans text-gray-900">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-1.5 text-sm text-gray-500">
          <button onClick={() => navigate(-1)} className="hover:text-blue-600 flex items-center gap-1 font-medium transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <Link to="/cua-hang" className="hover:text-blue-600 transition-colors">Sản Phẩm</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          {product.category && (
            <>
              <span className="hover:text-blue-600 transition-colors">{product.category.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            </>
          )}
          <span className="text-gray-900 font-semibold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Image Gallery (7 cols) ── */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-3">
          {/* Main Image */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-10 aspect-[4/3] flex items-center justify-center relative overflow-hidden shadow-sm group">
            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-md border ${
                product.in_stock 
                  ? 'bg-emerald-500 text-white border-emerald-400' 
                  : 'bg-gray-500 text-white border-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-white ${product.in_stock ? 'animate-pulse' : ''}`}></span>
                {product.in_stock ? 'Còn hàng' : 'Hết hàng'}
              </span>
              {product.is_hot && (
                <span className="bg-red-500 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Bán chạy
                </span>
              )}
              {hasDiscount && (
                <span className="bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
                  -{Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)}%
                </span>
              )}
            </div>

            <div className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out">
              <ProductImage
                imageSources={selectedImage ? [selectedImage] : []}
                alt={product.name}
                containerClassName="w-full h-full"
                imgClassName="w-full h-full object-contain mix-blend-multiply drop-shadow-lg"
                fallbackClassName="w-24 h-24 text-gray-200 mx-auto"
                fallbackContent={iconMap[product.category?.icon] || <Cpu className="w-full h-full" />}
                loading="eager"
              />
            </div>
          </div>

          {/* Thumbnails — only show if multiple images */}
          {imageSources.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {imageSources.map((image, idx) => (
                <button
                  key={`${image}-${idx}`}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`bg-white w-16 h-16 flex items-center justify-center p-1.5 rounded-xl border-2 transition-all overflow-hidden ${
                    activeImageIndex === idx ? 'border-blue-600 shadow-md shadow-blue-100 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <img src={image} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-contain" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          {/* ── Suggested Products (Fills the gap) ── */}
          {relatedProducts.length > 0 && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" /> SẢN PHẨM TƯƠNG TỰ
                </h3>
                <Link to="/cua-hang" className="text-[11px] font-bold text-blue-600 hover:underline">Xem tất cả</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {relatedProducts.slice(0, 6).map(p => (
                  <Link 
                    key={p.id} 
                    to={`/san-pham/${p.id}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-3 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
                  >
                    <div className="aspect-square mb-2 relative overflow-hidden rounded-xl bg-gray-50/50 flex items-center justify-center p-2">
                      <ProductImage 
                        imageSources={normalizeProductImages(p.image_url)} 
                        alt={p.name}
                        containerClassName="w-full h-full"
                        imgClassName="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors h-8">
                      {p.name}
                    </h4>
                    <div className="text-xs font-black text-red-600">
                      {formatPrice(p.price)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Product Details (5 cols) ── */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-4">

          {/* Card 1: Title & Price — FPT Shop style */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            {/* Product Name */}
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-snug mb-1">{product.name}</h1>
            
            {/* SKU & Rating row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-4">
              <span className="text-gray-400">SKU: <span className="font-mono text-gray-600">SP-{String(product.id).padStart(5, '0')}</span></span>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <StarRating value={Math.round(reviewStats.avgRating || 0)} size="w-3.5 h-3.5" />
                <span className="font-semibold text-amber-600">{reviewStats.avgRating || '0.0'}</span>
              </div>
              <span className="text-gray-300">|</span>
              <button onClick={() => setActiveTab('reviews')} className="text-blue-600 hover:underline font-medium">{reviewStats.total} đánh giá</button>
            </div>

            {/* Price block — red accent like FPT Shop */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4 mb-4">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl lg:text-4xl font-black text-red-600">{formatPrice(currentPrice)}</span>
                {hasDiscount && (
                  <span className="text-base text-gray-400 line-through mb-1">{formatPrice(currentOriginalPrice)}</span>
                )}
                {hasDiscount && (
                  <span className="mb-1 text-sm font-bold text-white bg-red-500 px-2.5 py-0.5 rounded-lg">
                    -{Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-sm">
              <CircleDot className={`w-3.5 h-3.5 ${product.in_stock ? 'text-emerald-500' : 'text-gray-400'}`} />
              <span className={`font-semibold ${product.in_stock ? 'text-emerald-600' : 'text-gray-500'}`}>
                {product.in_stock
                  ? `Còn hàng (${product.stock_quantity || 10} sản phẩm)`
                  : 'Tạm hết hàng — Liên hệ để đặt trước'}
              </span>
            </div>
          </div>

          {/* Card 2: Promotions — FPT Shop style */}
          <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 flex items-center gap-2">
              <Gift className="w-4 h-4 text-yellow-300" />
              <span className="text-white font-bold text-sm">ƯU ĐÃI KHI MUA SẢN PHẨM</span>
            </div>
            <div className="p-4 space-y-3">
              {/* Custom promotions from admin */}
              {(() => {
                let customPromos = [];
                try { customPromos = JSON.parse(product.promotions || '[]'); } catch {}
                const promoColors = [
                  { bg: 'bg-rose-50', text: 'text-rose-600' },
                  { bg: 'bg-amber-50', text: 'text-amber-600' },
                  { bg: 'bg-cyan-50', text: 'text-cyan-600' },
                  { bg: 'bg-lime-50', text: 'text-lime-600' },
                  { bg: 'bg-pink-50', text: 'text-pink-600' },
                ];
                return customPromos.length > 0 && customPromos.map((promo, idx) => (
                  <div key={`promo-${idx}`} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full ${promoColors[idx % promoColors.length].bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Gift className={`w-3.5 h-3.5 ${promoColors[idx % promoColors.length].text}`} />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{promo}</p>
                  </div>
                ));
              })()}

              {/* Default promotions — always shown */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-700">Bảo hành <strong className="text-gray-900">12 tháng chính hãng</strong> tại Cửa Hàng 118</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-700">Giao hàng <strong className="text-gray-900">miễn phí</strong> trong nội thành</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-sm text-gray-700">Đổi trả <strong className="text-gray-900">trong 7 ngày</strong> nếu lỗi từ nhà sản xuất</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-700">Hỗ trợ kỹ thuật <strong className="text-gray-900">miễn phí trọn đời</strong></p>
              </div>
            </div>
          </div>

          {/* Card 3: Variants & Actions — FPT Shop style */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            {/* Variants Selector */}
            {(() => {
              try {
                const variants = JSON.parse(product.variants || '[]');
                if (variants.length === 0) return null;
                return (
                  <div className="space-y-5 mb-6">
                    {variants.map((v, vIdx) => {
                      if (!v.options || v.options.length === 0) return null;
                      return (
                        <div key={vIdx}>
                          <p className="text-sm font-bold text-gray-700 mb-2.5">{v.label}</p>
                          <div className="flex flex-wrap gap-2">
                            {v.options.map((opt, oIdx) => {
                              const isSelected = selectedVariants[v.label]?.name === opt.name;
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => setSelectedVariants(prev => ({ ...prev, [v.label]: opt }))}
                                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-start ${
                                    isSelected 
                                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'
                                  }`}
                                >
                                  <span>{opt.name}</span>
                                  {opt.price_adj !== 0 && (
                                    <span className={`text-[10px] ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                                      {opt.price_adj > 0 ? '+' : ''}{opt.price_adj.toLocaleString('vi-VN')}đ
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              } catch { return null; }
            })()}

            {/* Quantity */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-gray-700">Số lượng</span>
              <div className="flex items-center">
                <div className="flex items-center border border-gray-300 rounded-lg h-10 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors active:bg-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly
                    className="w-14 h-full text-center font-bold text-gray-900 border-x border-gray-300 bg-gray-50 p-0 text-sm"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors active:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500 ml-4">Tạm tính: <strong className="text-red-600 text-base">{formatPrice(currentPrice * quantity)}</strong></span>
              </div>
            </div>

            {/* CTA Buttons — Big, bold, FPT Shop style */}
            <div className="flex gap-3">
              <button
                disabled={!product.in_stock}
                onClick={() => { addToCart(product, quantity); navigate('/gio-hang'); }}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 hover:shadow-red-600/30"
              >
                <span className="text-sm font-black uppercase tracking-wide">Mua ngay</span>
                <span className="text-[11px] opacity-80 font-medium">Giao tận nơi hoặc nhận tại cửa hàng</span>
              </button>
              <button
                disabled={!product.in_stock}
                onClick={() => addToCart(product, quantity)}
                className="w-[72px] bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 font-bold py-3.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[10px] font-bold">Thêm</span>
              </button>
            </div>

            {/* Contact link */}
            <Link
              to="/lien-he"
              className="mt-3 w-full bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 font-semibold py-2.5 rounded-xl transition-colors text-center text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Liên hệ nhận báo giá
            </Link>
          </div>

          {/* Trust strip */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2.5">
              <BadgeCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-xs text-gray-700 font-semibold">Chính hãng 100%</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs text-gray-700 font-semibold">Bảo hành uy tín</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-xs text-gray-700 font-semibold">Giao nhanh 2h</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2.5">
              <RotateCcw className="w-5 h-5 text-purple-600 shrink-0" />
              <span className="text-xs text-gray-700 font-semibold">Đổi trả dễ dàng</span>
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Tab Section (full width) ── */}
        <div className="col-span-1 lg:col-span-12 mt-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-2 mr-8 text-sm font-semibold transition-all relative whitespace-nowrap border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 lg:p-10">

              {/* Mô Tả */}
              {activeTab === 'desc' && (
                <div className="text-gray-600 leading-relaxed">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Thông tin sản phẩm</h3>
                  <p className="text-sm mb-4">
                    {product.description || `Khám phá ${product.name} — sản phẩm được lựa chọn kỹ lưỡng, kiểm tra chất lượng nghiêm ngặt trước khi đến tay bạn. Cửa Hàng 118 cam kết hàng chính hãng 100%, bảo hành minh bạch và rõ ràng.`}
                  </p>
                  <h4 className="text-base font-bold text-gray-900 mb-3 mt-6">Tính năng nổi bật</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                    <li>Hàng chính hãng, nhập khẩu nguyên kiện</li>
                    <li>Kiểm tra chất lượng 100% trước khi xuất kho</li>
                    <li>Bảo hành tại cửa hàng, không cần gửi đi xa</li>
                    <li>Hỗ trợ kỹ thuật tại chỗ và online 24/7</li>
                    <li>Đóng gói cẩn thận, chống va đập khi vận chuyển</li>
                  </ul>
                </div>
              )}

              {/* Thông Số */}
              {activeTab === 'specs' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-5">Thông số kỹ thuật</h3>
                  {(() => {
                    let customSpecs = [];
                    try { customSpecs = JSON.parse(product.specifications || '[]'); } catch {}
                    const specs = customSpecs.filter(s => s.label?.trim());
                    if (specs.length === 0) {
                      return (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                          <Cpu className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm font-medium">Chưa có thông số kỹ thuật cho sản phẩm này.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {specs.map((row, i) => (
                          <div key={`${row.label}-${i}`} className={`grid grid-cols-2 sm:grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <div className="px-5 py-3 font-semibold text-gray-600 border-r border-gray-200">{row.label}</div>
                            <div className="px-5 py-3 text-gray-900 sm:col-span-2">{row.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Đánh Giá */}
              {activeTab === 'reviews' && (
                <div>
                  {/* Stats */}
                  <div className="flex flex-col sm:flex-row gap-5 mb-8">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex flex-col items-center justify-center sm:w-44 shrink-0 text-center">
                      <p className="text-5xl font-bold text-amber-600 mb-2">{reviewStats.avgRating || '0.0'}</p>
                      <StarRating value={Math.round(reviewStats.avgRating)} size="w-5 h-5" />
                      <p className="text-xs font-semibold text-amber-700/60 mt-2">{reviewStats.total} đánh giá</p>
                    </div>
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviewStats.distribution[star - 1] || 0;
                        const pct = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500 font-semibold w-8 flex items-center gap-1">{star} <Star className="w-3 h-3 text-amber-400 fill-current" /></span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-gray-400 w-5 text-right font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Write Review */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" /> Viết đánh giá
                    </h3>
                    {currentUser ? (
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-semibold text-gray-600">Chất lượng:</label>
                          <StarRating value={reviewForm.rating} onChange={v => setReviewForm({ ...reviewForm, rating: v })} size="w-6 h-6" interactive />
                        </div>
                        <textarea
                          value={reviewForm.comment}
                          onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          rows={3}
                          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all"
                        />
                        {reviewMsg.text && (
                          <div className={`p-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${reviewMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            <CheckCircle2 className="w-4 h-4" /> {reviewMsg.text}
                          </div>
                        )}
                        <button type="submit" disabled={submittingReview} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                          {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Gửi đánh giá
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-gray-500 text-sm mb-3">Bạn cần đăng nhập để viết đánh giá.</p>
                        <Link to="/dang-nhap" className="px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-lg text-sm inline-flex items-center gap-2 hover:bg-black transition-colors">
                          Đăng nhập
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm font-medium">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(r => (
                        <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                              {r.user?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-gray-900 text-sm">{r.user?.full_name || 'Khách hàng'}</span>
                                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <StarRating value={r.rating} size="w-4 h-4" />
                              {r.comment && <p className="text-gray-600 text-sm leading-relaxed mt-2">{r.comment}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
