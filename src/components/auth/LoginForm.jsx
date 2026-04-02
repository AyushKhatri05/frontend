import { useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';

const LoginForm = () => {
    const router = useRouter();
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('admin@erplite.com');
    const [password, setPassword] = useState('Password@123');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login({ email, password });
            router.push('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-96 border border-white/20">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <span className="text-4xl font-bold text-indigo-600">E</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">ERP Lite</h1>
                </div>

                {error && <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-200 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                            placeholder="Email" required />
                    </div>
                    <div>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                            placeholder="Password" required />
                    </div>
                    <button type="submit" disabled={isLoading}
                        className="w-full bg-white text-indigo-600 py-3 px-4 rounded-lg font-medium hover:bg-indigo-50 transition disabled:opacity-50">
                        {isLoading ? 'Loading...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;