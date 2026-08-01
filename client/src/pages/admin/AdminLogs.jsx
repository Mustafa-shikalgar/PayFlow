import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [type, setType] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (type) params.type = type;
      const { data } = await adminService.getLogs(params);
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, type]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View webhook, admin, and system activity logs.</p>
      </div>

      <div className="flex gap-4">
        <select className="input-field sm:w-48" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="webhook">Webhook</option>
          <option value="admin">Admin</option>
          <option value="auth">Auth</option>
          <option value="payment">Payment</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={10} columns={4} />
        ) : logs.length === 0 ? (
          <EmptyState title="No logs found" description="Try adjusting your filters." icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">IP</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4"><Badge status={log.type === 'webhook' ? 'info' : log.type === 'admin' ? 'active' : 'neutral'}>{log.type}</Badge></td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">{log.action}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{log.user?.name || '—'}</td>
                    <td className="px-6 py-4"><Badge status={log.status} /></td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">{log.ip || '—'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && logs.length > 0 && <Pagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} pageSize={20} />}
      </div>
    </div>
  );
};