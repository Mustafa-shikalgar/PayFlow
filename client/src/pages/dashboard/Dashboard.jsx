import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { CardSkeleton, TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/format';

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ total: 0, count: 0, month: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch a larger set for accurate stats, display the 5 most recent
      const { data } = await paymentService.getHistory({ page: 1, limit: 100 });
      const items = data.data.payments;
      setPayments(items.slice(0, 5));

      const total = items.reduce((sum, p) => sum + p.amount, 0);
      const month = items
        .filter((p) => new Date(p.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({ total, count: data.data.pagination.total, month });
    } catch (err) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here's an overview of your payment activity.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatCard
            title="Total Payments"
            value={stats.count}
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            color="primary"
          />
          <StatCard
            title="Total Spent"
            value={formatCurrency(stats.total)}
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="green"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(stats.month)}
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            color="blue"
          />
        </div>
      )}

      {/* Recent payments */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
          <Link to="/transactions" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            View all →
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Make your first payment to see it here."
            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
            action={<Link to="/pay" className="btn-primary">Make a Payment</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Payment ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">{payment.paymentId}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{payment.description || '—'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount, payment.currency)}</td>
                    <td className="px-6 py-4"><Badge status={payment.status} /></td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDateTime(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};