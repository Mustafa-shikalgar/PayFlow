import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { formatCurrency, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [status, setStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [noteModal, setNoteModal] = useState(null);

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const { data } = await adminService.getRefunds(params);
      setRefunds(data.data.refunds);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const handleAction = async (refundId, action) => {
    setActionLoading(refundId);
    try {
      await adminService.approveRefund(refundId, {
        action,
        adminNote: noteModal?.note || '',
      });
      toast.success(`Refund ${action === 'approve' ? 'approved' : 'rejected'}`);
      setNoteModal(null);
      loadRefunds();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} refund`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Refund Requests</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review and process refund requests.</p>
      </div>

      <div className="flex gap-4">
        <select className="input-field sm:w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processed">Processed</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : refunds.length === 0 ? (
          <EmptyState title="No refunds found" description="Try adjusting your filters." icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Refund ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Reason</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {refunds.map((refund) => (
                  <tr key={refund._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">{refund.refundId}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{refund.user?.name || '—'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {formatCurrency(refund.amount, refund.payment?.currency)}
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-gray-600 dark:text-gray-300">{refund.reason}</td>
                    <td className="px-6 py-4"><Badge status={refund.status} /></td>
                    <td className="px-6 py-4">
                      {refund.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setNoteModal({ refundId: refund._id, action: 'approve', note: '' })}
                            disabled={actionLoading === refund._id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {actionLoading === refund._id ? <Spinner size="sm" /> : 'Approve'}
                          </button>
                          <button
                            onClick={() => setNoteModal({ refundId: refund._id, action: 'reject', note: '' })}
                            disabled={actionLoading === refund._id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{formatDateTime(refund.processedAt || refund.createdAt)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && refunds.length > 0 && <Pagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />}
      </div>

      {/* Note modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {noteModal.action === 'approve' ? 'Approve Refund' : 'Reject Refund'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {noteModal.action === 'approve'
                ? 'This will process the refund via Razorpay.'
                : 'This will reject the refund request.'}
            </p>
            <textarea
              className="input-field mt-4 min-h-[80px]"
              placeholder="Add an admin note (optional)..."
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
            />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setNoteModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => handleAction(noteModal.refundId, noteModal.action)}
                disabled={actionLoading === noteModal.refundId}
                className={`flex-1 ${noteModal.action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
              >
                {actionLoading === noteModal.refundId ? <Spinner size="sm" /> : noteModal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};