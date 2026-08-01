import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../../services/paymentService';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

export const Refunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentService.getRefunds({ page: 1, limit: 50 });
      setRefunds(data.data.refunds);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Refunds</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track the status of your refund requests.
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : refunds.length === 0 ? (
          <EmptyState
            title="No refunds yet"
            description="When you request a refund, it will appear here."
            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Refund ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Payment</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Reason</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {refunds.map((refund) => (
                  <tr key={refund._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">{refund.refundId}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {refund.payment?.paymentId || '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {formatCurrency(refund.amount, refund.payment?.currency)}
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-gray-600 dark:text-gray-300">
                      {refund.reason}
                    </td>
                    <td className="px-6 py-4"><Badge status={refund.status} /></td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDateTime(refund.createdAt)}</td>
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