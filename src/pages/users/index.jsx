// frontend/src/pages/users/index.jsx
// COMPLETE – all User Management buttons wired to real backend APIs

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    UserIcon, EnvelopeIcon, ShieldCheckIcon,
    PencilIcon, TrashIcon, ArrowPathIcon,
    CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import useAuth     from '../../hooks/useAuth';
import apiService  from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Role badge colours ────────────────────────────────────────────────────────
const roleBadge = {
    admin:             'bg-purple-100 text-purple-800',
    inventory_manager: 'bg-blue-100 text-blue-800',
    sales_staff:       'bg-green-100 text-green-800',
};
const formatRole = (r) => r?.replace(/_/g, ' ') ?? '—';

// ── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

// ── Edit User Modal ───────────────────────────────────────────────────────────
const EditUserModal = ({ user, onClose, onSave }) => {
    const [form, setForm] = useState({
        username: user.username,
        email:    user.email,
        role:     user.role,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(user.id, form);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Edit User</h2>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="admin">Admin</option>
                            <option value="inventory_manager">Inventory Manager</option>
                            <option value="sales_staff">Sales Staff</option>
                        </select>
                    </div>
                </div>
                <div className="px-6 py-4 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const { user: me, isAdmin } = useAuth();
    const [users, setUsers]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [auditLogs, setAuditLogs]   = useState([]);
    const [activeTab, setActiveTab]   = useState('users'); // 'users' | 'audit'
    const [page, setPage]             = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.users.getAll({ page, limit: 20, search });
            if (res.data?.success) {
                setUsers(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    const loadAuditLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.users.getAuditLogs({ page: 1, limit: 50 });
            if (res.data?.success) setAuditLogs(res.data.data);
        } catch (_) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
        else loadAuditLogs();
    }, [activeTab, page, search]);

    // ── "Save" in Edit User modal ─────────────────────────────────────────
    const handleUpdateUser = async (id, data) => {
        try {
            await apiService.users.updateUser(id, data);
            toast.success('User updated successfully');
            loadUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user');
            throw err;
        }
    };

    // ── "Enable/Disable" toggle ───────────────────────────────────────────
    const handleToggleStatus = async (user) => {
        const action = user.is_active ? 'Disable' : 'Enable';
        if (!confirm(`${action} user "${user.username}"?`)) return;
        try {
            const res = await apiService.users.toggleStatus(user.id);
            if (res.data?.success) {
                toast.success(res.data.message);
                setUsers(prev => prev.map(u =>
                    u.id === user.id ? { ...u, is_active: !u.is_active } : u
                ));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to toggle user status');
        }
    };

    // ── "Delete User" button ──────────────────────────────────────────────
    const handleDeleteUser = async (user) => {
        if (!confirm(`Deactivate user "${user.username}"? They will no longer be able to log in.`)) return;
        try {
            await apiService.users.deleteUser(user.id);
            toast.success('User deactivated');
            loadUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const stats = {
        total:    users.length,
        active:   users.filter(u => u.is_active).length,
        with2fa:  users.filter(u => u.two_factor_enabled).length,
        admins:   users.filter(u => u.role === 'admin').length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-500 mt-1">Manage team members and permissions</p>
                    </div>
                    <button
                        onClick={activeTab === 'users' ? loadUsers : loadAuditLogs}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        title="Refresh"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Users"   value={stats.total}   icon={UserIcon}         color="bg-indigo-500" />
                    <StatCard title="Active Users"  value={stats.active}  icon={CheckCircleIcon}  color="bg-green-500"  />
                    <StatCard title="2FA Enabled"   value={stats.with2fa} icon={ShieldCheckIcon}  color="bg-blue-500"   />
                    <StatCard title="Admins"         value={stats.admins}  icon={EnvelopeIcon}     color="bg-purple-500" />
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex gap-6">
                        {['users', 'audit'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                                    activeTab === tab
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab === 'users' ? 'User List' : 'Audit Logs'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* User List Tab */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Search */}
                        <div className="p-4 border-b">
                            <div className="relative max-w-sm">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users…"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-16">
                                <LoadingSpinner size="large" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            {['User', 'Email', 'Role', '2FA', 'Status', 'Last Login', 'Actions'].map(h => (
                                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-indigo-700 font-semibold text-sm">
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="font-medium text-gray-900">{u.username}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${roleBadge[u.role] || 'bg-gray-100 text-gray-600'}`}>
                                                        {formatRole(u.role)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${u.two_factor_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {u.two_factor_enabled ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {u.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">
                                                    {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {/* Edit button */}
                                                        <button
                                                            onClick={() => setEditingUser(u)}
                                                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded"
                                                            title="Edit User"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        {/* Toggle status button */}
                                                        {u.id !== me?.id && (
                                                            <button
                                                                onClick={() => handleToggleStatus(u)}
                                                                className={`p-1 rounded ${u.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                                                                title={u.is_active ? 'Deactivate User' : 'Activate User'}
                                                            >
                                                                {u.is_active ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                        {/* Delete button */}
                                                        {u.id !== me?.id && (
                                                            <button
                                                                onClick={() => handleDeleteUser(u)}
                                                                className="text-red-500 hover:text-red-700 p-1 rounded"
                                                                title="Delete User"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {users.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">No users found.</div>
                                )}

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="px-6 py-4 border-t flex justify-between items-center text-sm text-gray-500">
                                        <span>{pagination.total} users</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="px-3 py-1 border rounded disabled:opacity-40"
                                            >← Prev</button>
                                            <span className="px-3 py-1">Page {page} / {pagination.pages}</span>
                                            <button
                                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                                disabled={page === pagination.pages}
                                                className="px-3 py-1 border rounded disabled:opacity-40"
                                            >Next →</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Audit Logs Tab */}
                {activeTab === 'audit' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b">
                            <h3 className="font-semibold text-gray-900">Audit Trail</h3>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-16"><LoadingSpinner /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            {['Time', 'User', 'Action', 'Entity', 'IP'].map(h => (
                                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {auditLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-gray-900">{log.username || '–'}</td>
                                                <td className="px-6 py-3">
                                                    <span className="px-2 py-1 text-xs bg-gray-100 rounded font-mono">{log.action}</span>
                                                </td>
                                                <td className="px-6 py-3 text-gray-600 capitalize">{log.entity_type}</td>
                                                <td className="px-6 py-3 text-gray-400 text-xs font-mono">{log.ip_address || '–'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {auditLogs.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">No audit logs found.</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUser}
                />
            )}
        </DashboardLayout>
    );
}
