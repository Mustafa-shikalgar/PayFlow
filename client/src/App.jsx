import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public pages
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { NotFound } from './pages/NotFound';

// Customer pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { Checkout } from './pages/payment/Checkout';
import { PaymentSuccess } from './pages/payment/PaymentSuccess';
import { Transactions } from './pages/dashboard/Transactions';
import { Orders } from './pages/dashboard/Orders';
import { Refunds } from './pages/dashboard/Refunds';
import { Profile } from './pages/dashboard/Profile';
import { Settings } from './pages/dashboard/Settings';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminRefunds } from './pages/admin/AdminRefunds';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminLogs } from './pages/admin/AdminLogs';

export default function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected customer routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pay" element={<Checkout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Protected admin routes */}
      <Route
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/refunds" element={<AdminRefunds />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}