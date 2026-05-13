import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, Wrench } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-gray-50/50">
      <div className="text-center max-w-lg">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[180px] md:text-[220px] font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
              <Wrench className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Ôi không! Trang này không tồn tại
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          Đường link bạn vừa truy cập có vẻ đã bị hỏng hoặc trang đã được di chuyển. Đừng lo, hãy quay về trang chính nhé!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Về Trang Chủ
          </Link>
          <Link 
            to="/cua-hang" 
            className="px-8 py-4 border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 font-bold rounded-2xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" /> Xem Sản Phẩm
          </Link>
        </div>

        {/* Fun fact */}
        <div className="mt-12 p-4 bg-blue-50 rounded-2xl border border-blue-100 inline-block">
          <p className="text-sm text-blue-700 font-medium">
            💡 Mẹo: Nếu bạn đang tìm một sản phẩm cụ thể, hãy thử truy cập <Link to="/cua-hang" className="underline font-bold">Cửa Hàng</Link> của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
