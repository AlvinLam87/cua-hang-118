import React, { useState, useEffect } from 'react';
import { Star, Trash2, Search, MessageSquare, AlertCircle } from 'lucide-react';
import { API_V1_URL } from '../../utils/api.js';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      } else {
        alert(data.message || 'Lỗi khi tải danh sách đánh giá');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã xóa đánh giá');
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(data.message || 'Lỗi khi xóa đánh giá');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const search = searchTerm.toLowerCase();
    const productName = r.product?.name?.toLowerCase() || '';
    const userName = r.user?.full_name?.toLowerCase() || '';
    const comment = r.comment?.toLowerCase() || '';
    return productName.includes(search) || userName.includes(search) || comment.includes(search);
  });

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đánh giá</h1>
          <p className="text-gray-500 mt-1">Quản lý đánh giá của khách hàng về sản phẩm/dịch vụ.</p>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Tìm kiếm đánh giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Khách hàng</th>
                <th className="p-4 font-medium">Sản phẩm/Dịch vụ</th>
                <th className="p-4 font-medium">Đánh giá</th>
                <th className="p-4 font-medium">Nội dung</th>
                <th className="p-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{review.user?.full_name || 'Khách ẩn danh'}</div>
                      <div className="text-sm text-gray-500">{review.user?.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-800 line-clamp-2 max-w-[200px]">
                        {review.product?.name || 'Sản phẩm không xác định'}
                      </div>
                    </td>
                    <td className="p-4">
                      {renderStars(review.rating)}
                      <div className="text-xs text-gray-500 mt-1">{review.rating} / 5 sao</div>
                    </td>
                    <td className="p-4">
                      {review.comment ? (
                        <p className="text-sm text-gray-600 line-clamp-3 max-w-xs">{review.comment}</p>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Không có bình luận</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa đánh giá"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                      <p>Không tìm thấy đánh giá nào.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
