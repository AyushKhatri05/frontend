// frontend/src/pages/settings/index.jsx
// COMPLETE – every Settings button wired to real backend API

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    UserIcon, LockClosedIcon, ShieldCheckIcon,
    CheckCircleIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Reusable section card ─────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
            <Icon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// ── 2FA Setup Modal ───────────────────────────────────────────────────────────
const TwoFASetupModal = ({ qrCode, secret, onClose, onVerify }) => {
    const [code, setCode]     = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (code.length !== 6) return toast.error('Enter a 6-digit code');
        setLoading(true);
        try {
            await onVerify(code);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Set Up 2FA</h2>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                    </p>
                    {qrCode && (
                        <div className="flex justify-center">
                            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded border" />
                        </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Manual entry key:</p>
                        <p className="text-sm font-mono text-gray-800 break-all">{secret}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Enter the 6-digit code from your app to verify:
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="000000"
                        />
                    </div>
                </div>
                <div className="px-6 py-4 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={handleVerify}
                        disabled={loading || code.length !== 6}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Verifying…' : 'Verify & Enable'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Settings page ────────────────────────────────────────────────────────
export default function SettingsPage() {
    const {
        user, isLoading,
        updateProfile, changePassword,
        setup2FA, enable2FA, disable2FA,
    } = useAuth();

    // Profile form
    const [profile, setProfile]   = useState({ username: '', email: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [savingPw, setSavingPw]   = useState(false);

    // 2FA
    const [twoFAData, setTwoFAData]   = useState(null); // { qrCode, secret }
    const [showTwoFAModal, setShowTwoFAModal] = useState(false);
    const [disablePw, setDisablePw]   = useState('');
    const [disabling2FA, setDisabling2FA] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({ username: user.username || '', email: user.email || '' });
        }
    }, [user]);

    // ── "Update Profile" button ───────────────────────────────────────────
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await updateProfile(profile);
        } finally {
            setSavingProfile(false);
        }
    };

    // ── "Change Password" button ──────────────────────────────────────────
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm)
            return toast.error('New passwords do not match');
        if (passwords.new.length < 8)
            return toast.error('Password must be at least 8 characters');

        setSavingPw(true);
        try {
            await changePassword(passwords.current, passwords.new);
            setPasswords({ current: '', new: '', confirm: '' });
        } finally {
            setSavingPw(false);
        }
    };

    // ── "Enable 2FA" button ───────────────────────────────────────────────
    const handleSetup2FA = async () => {
        try {
            const data = await setup2FA(); // { qrCode, secret }
            setTwoFAData(data);
            setShowTwoFAModal(true);
        } catch (_) {}
    };

    // ── "Verify & Enable" button (inside modal) ───────────────────────────
    const handleEnable2FA = async (code) => {
        await enable2FA(code);
        setShowTwoFAModal(false);
        setTwoFAData(null);
    };

    // ── "Disable 2FA" button ──────────────────────────────────────────────
    const handleDisable2FA = async (e) => {
        e.preventDefault();
        if (!disablePw) return toast.error('Enter your current password to confirm');
        setDisabling2FA(true);
        try {
            await disable2FA(disablePw);
            setDisablePw('');
        } finally {
            setDisabling2FA(false);
        }
    };

    if (!user) {
        return <DashboardLayout><div className="flex justify-center py-16"><LoadingSpinner /></div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your account preferences</p>
                </div>

                {/* ── Profile ─────────────────────────────────────────────── */}
                <Section title="Profile Information" icon={UserIcon}>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                value={profile.username}
                                onChange={e => setProfile({ ...profile, username: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-gray-500 mb-3">
                                Role: <span className="font-medium capitalize">{user.role?.replace(/_/g,' ')}</span>
                                {' · '}
                                Member since: <span className="font-medium">{new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
                            </p>
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                            >
                                {savingProfile ? 'Saving…' : 'Update Profile'}
                            </button>
                        </div>
                    </form>
                </Section>

                {/* ── Change Password ──────────────────────────────────────── */}
                <Section title="Change Password" icon={LockClosedIcon}>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={passwords.current}
                                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={passwords.new}
                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="At least 8 characters"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwords.confirm}
                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Repeat new password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={savingPw}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                        >
                            {savingPw ? 'Changing…' : 'Change Password'}
                        </button>
                    </form>
                </Section>

                {/* ── Two-Factor Authentication ─────────────────────────────── */}
                <Section title="Two-Factor Authentication" icon={ShieldCheckIcon}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            {user.twoFactorEnabled || user.two_factor_enabled
                                ? <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                : <XMarkIcon className="w-5 h-5 text-gray-400" />
                            }
                            <p className="text-sm text-gray-700">
                                2FA is currently{' '}
                                <span className={`font-semibold ${(user.twoFactorEnabled || user.two_factor_enabled) ? 'text-green-600' : 'text-gray-500'}`}>
                                    {(user.twoFactorEnabled || user.two_factor_enabled) ? 'ENABLED' : 'DISABLED'}
                                </span>
                            </p>
                        </div>

                        {!(user.twoFactorEnabled || user.two_factor_enabled) ? (
                            /* "Enable 2FA" button */
                            <div>
                                <p className="text-sm text-gray-500 mb-3">
                                    Add an extra layer of security. You'll need an authenticator app like Google Authenticator or Authy.
                                </p>
                                <button
                                    onClick={handleSetup2FA}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                                >
                                    {isLoading ? 'Loading…' : 'Enable 2FA'}
                                </button>
                            </div>
                        ) : (
                            /* "Disable 2FA" form */
                            <form onSubmit={handleDisable2FA} className="space-y-3">
                                <p className="text-sm text-gray-500">
                                    Enter your password to disable two-factor authentication:
                                </p>
                                <input
                                    type="password"
                                    value={disablePw}
                                    onChange={e => setDisablePw(e.target.value)}
                                    placeholder="Current password"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={disabling2FA}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                                >
                                    {disabling2FA ? 'Disabling…' : 'Disable 2FA'}
                                </button>
                            </form>
                        )}
                    </div>
                </Section>

                {/* Account Info */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
                    <p>Logged in as <span className="font-medium text-gray-700">{user.email}</span></p>
                    <p className="mt-1">Role: <span className="font-medium text-gray-700 capitalize">{user.role?.replace(/_/g,' ')}</span></p>
                </div>
            </div>

            {/* 2FA Setup Modal */}
            {showTwoFAModal && twoFAData && (
                <TwoFASetupModal
                    qrCode={twoFAData.qrCode}
                    secret={twoFAData.secret}
                    onClose={() => { setShowTwoFAModal(false); setTwoFAData(null); }}
                    onVerify={handleEnable2FA}
                />
            )}
        </DashboardLayout>
    );
}
