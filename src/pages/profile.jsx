// frontend/src/pages/profile.jsx
// COMPLETE – Update profile, disable 2FA, real recent activity from audit log API

import { useState, useEffect } from 'react';
import { ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/layout/DashboardLayout';
import useAuth from '../hooks/useAuth';
import apiService from '../utils/api';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

// ── Disable 2FA inline form ───────────────────────────────────────────────────
const Disable2FAForm = ({ onDisabled }) => {
    const { disable2FA } = useAuth();
    const [pw, setPw]         = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await disable2FA(pw);
            setPw('');
            if (onDisabled) onDisabled();
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2 items-center">
            <input
                type="password"
                placeholder="Confirm current password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                required
                className="flex-1 border border-red-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
            <button
                type="submit"
                disabled={loading || !pw}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
                {loading ? 'Disabling…' : 'Confirm Disable'}
            </button>
        </form>
    );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function Profile() {
    const { user, updateProfile } = useAuth();

    const [saving, setSaving]         = useState(false);
    const [formData, setFormData]     = useState({ email: '', username: '' });
    const [showDisable2FA, setShowDisable2FA] = useState(false);
    const [recentActivity, setActivity]      = useState([]);
    const [activityLoading, setActLoading]   = useState(true);

    // Mirror user into form whenever store updates
    useEffect(() => {
        if (user) {
            setFormData({ email: user.email || '', username: user.username || '' });
        }
    }, [user]);

    // Load real audit log activity for this user
    useEffect(() => {
        (async () => {
            setActLoading(true);
            try {
                const res = await apiService.users.getAuditLogs({ limit: 5 });
                if (res.data?.success) {
                    setActivity(res.data.data);
                }
            } catch (_) { /* silent – audit log is supplementary */ }
            finally { setActLoading(false); }
        })();
    }, []);

    // ── "Save Changes" button ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile(formData);
        } finally {
            setSaving(false);
        }
    };

    const twoFAEnabled = user?.twoFactorEnabled || user?.two_factor_enabled;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <p className="text-indigo-100 mt-1">Manage your account settings and preferences</p>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            {/* "Save Changes" button */}
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Security Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b flex items-center">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Security Status</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* 2FA Card */}
                            <div className={`p-4 rounded-lg ${twoFAEnabled ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <ShieldCheckIcon className={`w-5 h-5 mr-2 ${twoFAEnabled ? 'text-green-600' : 'text-yellow-600'}`} />
                                        <h3 className={`font-medium ${twoFAEnabled ? 'text-green-800' : 'text-yellow-800'}`}>
                                            Two-Factor Authentication
                                        </h3>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${twoFAEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {twoFAEnabled ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </div>

                                <p className={`text-sm mb-3 ${twoFAEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {twoFAEnabled
                                        ? 'Your account is protected with two-factor authentication.'
                                        : 'Add an extra layer of security to your account.'}
                                </p>

                                {twoFAEnabled ? (
                                    <div className="space-y-2">
                                        {/* "Disable 2FA" – now wired */}
                                        <button
                                            type="button"
                                            onClick={() => setShowDisable2FA(v => !v)}
                                            className="text-sm text-red-600 hover:text-red-800 block"
                                        >
                                            {showDisable2FA ? '↑ Cancel' : '→ Disable 2FA'}
                                        </button>
                                        {showDisable2FA && (
                                            <Disable2FAForm onDisabled={() => setShowDisable2FA(false)} />
                                        )}
                                    </div>
                                ) : (
                                    /* "Enable 2FA" – routes to Settings security tab */
                                    <a
                                        href="/settings"
                                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        → Enable Two-Factor Authentication
                                    </a>
                                )}
                            </div>

                            {/* Account Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-3">Account Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Role</span>
                                        <span className="font-medium capitalize">{user?.role?.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium">{user?.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Account Status</span>
                                        <span className="font-medium text-green-600">Active</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">2FA Status</span>
                                        <span className={`font-medium ${twoFAEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                            {twoFAEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity – real data from audit_logs API */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                    </div>
                    <div className="divide-y">
                        {activityLoading ? (
                            <div className="px-6 py-4 text-sm text-gray-400 animate-pulse">Loading activity…</div>
                        ) : recentActivity.length === 0 ? (
                            <div className="px-6 py-6 text-center text-sm text-gray-400">No recent activity found.</div>
                        ) : (
                            recentActivity.map(log => (
                                <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 font-mono">{log.action}</p>
                                            <p className="text-xs text-gray-500">
                                                {log.entity_type}
                                                {log.ip_address ? ` · IP: ${log.ip_address}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
