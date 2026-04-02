// frontend/src/components/auth/TwoFactorVerify.jsx
// COMPLETE – uses useAuth().verify2FA so token is stored in Zustand, not bypassed

import { useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const TwoFactorVerify = ({ onSuccess }) => {
    const router          = useRouter();
    const { verify2FA }   = useAuth();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    // ── "Verify & Sign In" button ─────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (code.length !== 6) { toast.error('Enter a valid 6-digit code'); return; }

        setLoading(true);
        try {
            // Uses useAuth().verify2FA – stores user + token in Zustand + localStorage
            await verify2FA(code);
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid 2FA code. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-96 border border-white/20">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600">2FA</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Two-Factor Auth</h1>
                    <p className="text-indigo-200 mt-2 text-sm">
                        Enter the 6-digit code from your authenticator app
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
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

                    {/* "Verify & Sign In" button */}
                    <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full bg-white text-indigo-600 py-3 px-4 rounded-lg font-semibold hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying…' : 'Verify & Sign In'}
                    </button>
                </form>

                <div className="mt-6 border-t border-white/20 pt-4">
                    <p className="text-xs text-center text-indigo-300">
                        Having trouble? Contact your administrator to reset 2FA.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorVerify;
