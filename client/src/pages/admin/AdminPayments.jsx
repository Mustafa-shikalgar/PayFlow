import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useDebounce } from '../../hooks/useDebounce';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      const { data } = await adminService.getPayments(params);
      setPayments(data.data.payments);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Payments</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View and manage all platform payments.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" className="input-field !pl-12" placeholder="Search payments..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field sm:w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="captured">Captured</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially Refunded</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : payments.length === 0 ? (
          <EmptyState title="No payments found" description="Try adjusting your search or filters." icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Payment ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Method</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">{payment.paymentId}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{payment.user?.name || '—'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount, payment.currency)}</td>
                    <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-300">{payment.method}</td>
                    <td className="px-6 py-4"><Badge status={payment.status} /></td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDateTime(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && payments.length > 0 && <Pagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />}
      </div>
    </div>
  );
};