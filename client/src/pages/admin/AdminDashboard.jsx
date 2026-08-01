import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { StatCard } from '../../components/ui/StatCard';
import { CardSkeleton } from '../../components/ui/Skeletons';
import { formatCurrency } from '../../utils/format';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getStats();
      setStats(data.data);
    } catch (err) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const dailyData = (stats?.dailyRevenue || []).map((d) => ({
    date: d._id.split('-').slice(1).join('/'),
    revenue: d.total / 100,
    count: d.count,
  }));

  const monthlyData = (stats?.monthlyRevenue || []).map((m) => ({
    month: m._id,
    revenue: m.total / 100,
    count: m.count,
  }));

  const methodData = (stats?.methodBreakdown || []).map((m) => ({
    name: m._id,
    value: m.total / 100,
    count: m.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of revenue, payments, and platform activity.
        </p>
      </div>

      {/* Revenue stats */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.revenue.total || 0)}
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="green"
          />
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(stats?.revenue.today || 0)}
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            color="primary"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(stats?.revenue.month || 0)}
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            color="blue"
          />
          <StatCard
            title="This Year"
            value={formatCurrency(stats?.revenue.year || 0)}
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            color="amber"
          />
        </div>
      )}

      {/* Count stats */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <StatCard title="Total Orders" value={stats?.counts.orders || 0} color="primary" icon={<span className="text-xl">📦</span>} />
          <StatCard title="Total Payments" value={stats?.counts.payments || 0} color="blue" icon={<span className="text-xl">💳</span>} />
          <StatCard title="Pending Refunds" value={stats?.counts.pendingRefunds || 0} color="amber" icon={<span className="text-xl">⏳</span>} />
          <StatCard title="Total Users" value={stats?.counts.users || 0} color="green" icon={<span className="text-xl">👥</span>} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily revenue */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">Daily Revenue (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f9fafb' }}
                formatter={(value) => [`₹${value}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly revenue */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">Monthly Revenue (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f9fafb' }}
                formatter={(value) => [`₹${value}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment methods */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Payment Methods Breakdown</h2>
        {methodData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={methodData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, count }) => `${name} (${count})`}
              >
                {methodData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f9fafb' }}
                formatter={(value) => [`₹${value}`, 'Revenue']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-20 text-center text-sm text-gray-400">No payment data available.</p>
        )}
      </div>
    </div>
  );
};