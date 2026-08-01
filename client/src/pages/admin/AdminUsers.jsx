import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useDebounce } from '../../hooks/useDebounce';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (role) params.role = role;
      const { data } = await adminService.getUsers(params);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, role]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateUser(editModal._id, {
        name: editModal.name,
        phone: editModal.phone,
        role: editModal.role,
        isActive: editModal.isActive,
      });
      toast.success('User updated');
      setEditModal(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminService.deleteUser(userId);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage platform users and their roles.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" className="input-field !pl-12" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field sm:w-48" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your search or filters." icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} size="sm" />
                        <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4"><Badge status={user.role === 'admin' ? 'active' : 'info'}>{user.role}</Badge></td>
                    <td className="px-6 py-4"><Badge status={user.isActive ? 'active' : 'failed'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditModal({ ...user })} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10">Edit</button>
                        <button onClick={() => handleDelete(user._id)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && users.length > 0 && <Pagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />}
      </div>

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" className="input-field" value={editModal.name} onChange={(e) => setEditModal({ ...editModal, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input type="tel" className="input-field" value={editModal.phone || ''} onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select className="input-field" value={editModal.role} onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
                <button
                  onClick={() => setEditModal({ ...editModal, isActive: !editModal.isActive })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${editModal.isActive ? 'bg-primary-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${editModal.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner size="sm" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};