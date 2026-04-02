// frontend/src/pages/login.jsx
// COMPLETE – Login button, 2FA step, and Forgot Password all wired to real API

import { useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../hooks/useAuth';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

// ── Forgot Password modal ─────────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
    const [email, setEmail]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [sent, setSent]         = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiService.auth.forgotPassword(email);
            setSent(true);
        } catch (_) {
            // API always returns 200 to prevent enumeration; show success regardless
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Reset Password</h2>
                {sent ? (
                    <div className="text-center py-4">
                        <div className="text-4xl mb-3">📧</div>
                        <p className="text-sm text-gray-600">
                            If an account exists for <strong>{email}</strong>, password reset
                            instructions have been sent.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700"
                        >
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Enter your email address and we'll send you reset instructions.
                        </p>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// ── 2FA verification step ─────────────────────────────────────────────────────
const TwoFAStep = ({ onVerify, onBack }) => {
    const [code, setCode]     = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (code.length !== 6) { toast.error('Enter a 6-digit code'); return; }
        setLoading(true);
        try {
            await onVerify(code);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">2FA</span>
                </div>
                <h2 className="text-xl font-bold text-white">Two-Factor Auth</h2>
                <p className="text-indigo-200 mt-1 text-sm">Enter the code from your authenticator app</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="000000"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full bg-white text-indigo-600 py-3 rounded-lg font-medium hover:bg-indigo-50 transition disabled:opacity-50"
                >
                    {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
                <button
                    type="button"
                    onClick={onBack}
                    className="w-full text-indigo-200 hover:text-white text-sm"
                >
                    ← Back to login
                </button>
            </form>
        </div>
    );
};

// ── Main Login Page ───────────────────────────────────────────────────────────
export default function LoginPage() {
    const router = useRouter();
    const { login, verify2FA, twoFactorRequired } = useAuth();

    const [email, setEmail]         = useState('admin@erplite.com');
    const [password, setPassword]   = useState('Password123!');
    const [error, setError]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [showForgot, setShowForgot] = useState(false);

    // ── "Sign In" button ──────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login({ email, password });
            if (!result?.requiresTwoFactor) {
                router.push('/dashboard');
            }
            // If 2FA required, useAuth sets twoFactorRequired=true → renders TwoFAStep
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // ── "Verify & Sign In" in 2FA step ───────────────────────────────────
    const handleVerify2FA = async (code) => {
        try {
            await verify2FA(code);
            router.push('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid 2FA code');
            throw err;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-96 border border-white/20">

                {twoFactorRequired ? (
                    /* 2FA step */
                    <TwoFAStep
                        onVerify={handleVerify2FA}
                        onBack={() => useAuth.getState().setHydrated()} // just re-render
                    />
                ) : (
                    /* Normal login */
                    <>
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                <span className="text-4xl font-bold text-indigo-600">E</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white">ERP Lite</h1>
                            <p className="text-indigo-200 mt-2">Sign in to your account</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                                placeholder="Email address"
                                required
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                                placeholder="Password"
                                required
                            />

                            <div className="flex items-center justify-end">
                                {/* "Forgot password?" link – now wired */}
                                <button
                                    type="button"
                                    onClick={() => setShowForgot(true)}
                                    className="text-indigo-200 hover:text-white text-sm"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* "Sign In" button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-indigo-600 py-3 px-4 rounded-lg font-semibold hover:bg-indigo-50 transition disabled:opacity-50"
                            >
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-xs text-indigo-300 space-y-1">
                            <p className="font-medium">Demo credentials:</p>
                            <p className="font-mono">admin@erplite.com / Password123!</p>
                        </div>
                    </>
                )}
            </div>

            {/* Forgot Password Modal */}
            {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
        </div>
    );
}
