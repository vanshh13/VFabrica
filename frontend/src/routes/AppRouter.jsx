import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { BuyerDashboardPage } from '../pages/buyer/BuyerDashboardPage';
import { BuyerOrdersPage } from '../pages/buyer/BuyerOrdersPage';
import { SupplierDashboardPage } from '../pages/supplier/SupplierDashboardPage';
import { SupplierProductsPage } from '../pages/supplier/SupplierProductsPage';
import { SupplierOrdersPage } from '../pages/supplier/SupplierOrdersPage';
import { SupplierProfilePage } from '../pages/supplier/SupplierProfilePage';
import { SupplierWarehousePage } from '../pages/supplier/SupplierWarehousePage';
import { SupplierInventoryPage } from '../pages/supplier/SupplierInventoryPage';
import { HomePage } from '../pages/HomePage';
import { ProductDetailPage } from '../pages/buyer/ProductDetailPage';
import { BusinessListingPage } from '../pages/buyer/BusinessListingPage';
import { BuyerFavoritesPage } from '../pages/buyer/BuyerFavoritesPage';
import { AuthPage } from '../pages/auth/AuthPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRouter() {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = isAuthenticated && user && (user.role || '').toUpperCase() === 'ADMIN';

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/buyer" element={<BuyerDashboardPage />} />
      <Route path="/buyer/products" element={<BuyerDashboardPage initialTab="catalog" />} />
      <Route path="/buyer/orders" element={<BuyerOrdersPage />} />
      <Route path="/buyer/favorites" element={<BuyerFavoritesPage />} />
      <Route path="/buyer/suppliers" element={<BuyerDashboardPage initialTab="catalog" />} />
      <Route path="/buyer/profile" element={<BuyerDashboardPage initialTab="profile" />} />
      <Route path="/buyer/categories" element={<BuyerDashboardPage initialTab="catalog" />} />
      <Route path="/buyer/product/:id" element={<ProductDetailPage />} />
      <Route path="/buyer/supplier" element={<BusinessListingPage />} />
      <Route path="/buyer/supplier/:id" element={<BusinessListingPage />} />
      <Route path="/supplier" element={<SupplierDashboardPage />} />
      <Route path="/supplier/products" element={<SupplierProductsPage />} />
      <Route path="/supplier/orders" element={<SupplierOrdersPage />} />
      <Route path="/supplier/profile" element={<SupplierProfilePage />} />
      <Route path="/supplier/warehouse" element={<SupplierWarehousePage />} />
      <Route path="/supplier/inventory" element={<SupplierInventoryPage />} />
      <Route path="/supplier/onboarding" element={<SupplierProfilePage />} />
      <Route path="/admin" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/auth/login?message=Please log in to access the Admin Dashboard" replace />} />
      <Route path="/admin/dashboard" element={isAdmin ? <AdminDashboardPage /> : <Navigate to="/auth/login?message=Please log in to access the Admin Dashboard" replace />} />
      <Route path="/auth/login" element={<AuthPage mode="login" />} />
      <Route path="/auth/buyer/register" element={<AuthPage mode="register" role="buyer" />} />
      <Route path="/auth/supplier/register" element={<AuthPage mode="register" role="supplier" />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}