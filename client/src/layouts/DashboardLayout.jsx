import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';

const navItems = {
  customer: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
    { to: '/pay', label: 'Make Payment', icon: '💳' },
    { to: '/transactions', label: 'Transactions', icon: '📋' },
    { to: '/orders', label: 'Orders', icon: '📦' },
    { to: '/refunds', label: 'Refunds', icon: '↩️' },
    { to: '/profile', label: 'Profile', icon: '👤' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: '📊', end: true },
    { to: '/admin/payments', label: 'Payments', icon: '💳' },
    { to: '/admin/orders', label: 'Orders', icon: '📦' },
    { to: '/admin/refunds', label: 'Refunds', icon: '↩️' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/logs', label: 'Logs', icon: '📝' },
  ],
};

export const DashboardLayout = () => {
  const { user, isAdmin } = useAuth();
  const items = isAdmin ? navItems.admin : navItems.customer;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/60 dark:hover:text-white'
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}

            <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                  }`
                }
              >
                <span className="text-base">👤</span>
                {user?.name}
              </NavLink>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};