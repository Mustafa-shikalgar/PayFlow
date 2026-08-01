import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your preferences and account settings.
        </p>
      </div>

      {/* Appearance */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Toggle between light and dark theme.</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              darkMode ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Receipts</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive email receipts for payments.</p>
            </div>
            <span className="badge badge-success">Enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Refund Updates</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about refund status changes.</p>
            </div>
            <span className="badge badge-success">Enabled</span>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Account</h2>
        <div className="mt-4 space-y-3">
          <button
            onClick={handleLogout}
            className="btn-secondary w-full !text-red-600 dark:!text-red-400"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};