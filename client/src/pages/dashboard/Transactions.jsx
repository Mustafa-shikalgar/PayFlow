import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../../services/paymentService';
import { useDebounce } from '../../hooks/useDebounce';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { downloadBlob } from '../../utils/download';
import toast from 'react-hot-toast';

export const Transactions = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;

      const { data } = await paymentService.getHistory(params);
      setPayments(data.data.payments);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleDownloadInvoice = async (payment) => {
    try {
      const res = await paymentService.downloadInvoice(payment.invoice._id);
      downloadBlob(res.data, `${payment.paymentId}-invoice.pdf`);
      toast.success('Invoice downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invoice not available');
    }
  };

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }
    setRefundLoading(true);
    try {
      await paymentService.requestRefund({
        paymentId: refundModal.paymentId,
        reason: refundReason,
      });
      toast.success('Refund request submitted');
      setRefundModal(null);
      setRefundReason('');
      loadPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request refund');
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View your payment history, download invoices, and request refunds.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="input-field !pl-12"
            placeholder="Search by payment ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input-field sm:w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="captured">Captured</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Try adjusting your search or filters."
            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Payment ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Method</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">{payment.paymentId}</td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-gray-600 dark:text-gray-300">
                      {payment.description || '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-300">{payment.method}</td>
                    <td className="px-6 py-4"><Badge status={payment.status} /></td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDateTime(payment.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {payment.status === 'captured' && (
                          <button
                            onClick={() => setRefundModal({ paymentId: payment.paymentId, amount: payment.amount })}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                          >
                            Refund
                          </button>
                        )}
                        {payment.invoice?._id && (
                          <button
                            onClick={() => handleDownloadInvoice(payment)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
                          >
                            Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && payments.length > 0 && (
          <Pagination
            page={page}
            pages={pagination.pages}
            total={pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Refund modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request Refund</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Refund amount: {formatCurrency(refundModal.amount)}
            </p>
            <textarea
              className="input-field mt-4 min-h-[100px]"
              placeholder="Please explain why you're requesting a refund..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRefundModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={refundLoading}
                className="btn-primary flex-1"
              >
                {refundLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};