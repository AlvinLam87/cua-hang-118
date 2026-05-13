import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
const MainLayout = lazy(() => import('./layouts/MainLayout.jsx'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const TechnicianLayout = lazy(() => import('./layouts/TechnicianLayout.jsx'));
const HomePage = lazy(() => import('./pages/Home/HomePage.jsx'));
const ServicesPage = lazy(() => import('./pages/Services/ServicesPage.jsx'));
const CameraSolutionsPage = lazy(() => import('./pages/Services/CameraSolutionsPage.jsx'));
const ShopPage = lazy(() => import('./pages/Shop/ShopPage.jsx'));
const ProductDetailPage = lazy(() => import('./pages/Shop/ProductDetailPage.jsx'));
const TrackingPage = lazy(() => import('./pages/Tracking/TrackingPage.jsx'));
const ContactPage = lazy(() => import('./pages/Contact/ContactPage.jsx'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage.jsx'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage.jsx'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage.jsx'));
const OrderSuccessPage = lazy(() => import('./pages/Checkout/OrderSuccessPage.jsx'));
const DashboardPage = lazy(() => import('./pages/Admin/DashboardPage.jsx'));
const AdminProductsPage = lazy(() => import('./pages/Admin/AdminProductsPage.jsx'));
const AdminServicesPage = lazy(() => import('./pages/Admin/AdminServicesPage.jsx'));
const AdminOrdersPage = lazy(() => import('./pages/Admin/AdminOrdersPage.jsx'));
const AdminProductOrdersPage = lazy(() => import('./pages/Admin/AdminProductOrdersPage.jsx'));
const AdminBookingsPage = lazy(() => import('./pages/Admin/AdminBookingsPage.jsx'));
const AdminCustomersPage = lazy(() => import('./pages/Admin/AdminCustomersPage.jsx'));
const AdminTechniciansPage = lazy(() => import('./pages/Admin/AdminTechniciansPage.jsx'));
const AdminVouchersPage = lazy(() => import('./pages/Admin/AdminVouchersPage.jsx'));
const AdminInventoryPage = lazy(() => import('./pages/Admin/AdminInventoryPage.jsx'));
const TechnicianDashboardPage = lazy(() => import('./pages/Technician/TechnicianDashboardPage.jsx'));
const AdminReviewsPage = lazy(() => import('./pages/Admin/AdminReviewsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage.jsx'));
const AboutPage = lazy(() => import('./pages/About/AboutPage.jsx'));
const OrderHistoryPage = lazy(() => import('./pages/Orders/OrderHistoryPage.jsx'));
const BookingHistoryPage = lazy(() => import('./pages/Bookings/BookingHistoryPage.jsx'));
const PointsExchangePage = lazy(() => import('./pages/Profile/PointsExchangePage.jsx'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen grid place-items-center text-gray-500 font-semibold">Đang tải trang...</div>}>
      <Routes>
        {/* Public pages */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/ho-so" element={<ProfilePage />} />
          <Route path="/doi-diem" element={<PointsExchangePage />} />
          <Route path="/san-pham/:id" element={<ProductDetailPage />} />
          <Route path="/dich-vu" element={<ServicesPage />} />
          <Route path="/giai-phap-camera" element={<CameraSolutionsPage />} />
          <Route path="/cua-hang" element={<ShopPage />} />
          <Route path="/gio-hang" element={<CheckoutPage />} />
          <Route path="/thanh-toan" element={<CheckoutPage />} />
          <Route path="/dat-hang-thanh-cong" element={<OrderSuccessPage />} />
          <Route path="/tra-cuu" element={<TrackingPage />} />
          <Route path="/lien-he" element={<ContactPage />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/lich-su-don-hang" element={<OrderHistoryPage />} />
          <Route path="/lich-su-dat-lich" element={<BookingHistoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin pages */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="san-pham" element={<AdminProductsPage />} />
          <Route path="kho" element={<AdminProductsPage />} />
          <Route path="don-hang" element={<AdminProductOrdersPage />} />
          <Route path="dich-vu" element={<AdminServicesPage />} />
          <Route path="don-sua-chua" element={<AdminOrdersPage />} />
          <Route path="dat-lich" element={<AdminBookingsPage />} />
          <Route path="khach-hang" element={<AdminCustomersPage />} />
          <Route path="ky-thuat-vien" element={<AdminTechniciansPage />} />
          <Route path="danh-gia" element={<AdminReviewsPage />} />
          <Route path="vouchers" element={<AdminVouchersPage />} />
        </Route>

        {/* Technician pages */}
        <Route path="/ky-thuat-vien" element={<TechnicianLayout />}>
          <Route index element={<TechnicianDashboardPage />} />
        </Route>
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
