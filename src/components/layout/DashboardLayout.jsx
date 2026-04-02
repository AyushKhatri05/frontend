// frontend/src/components/layout/DashboardLayout.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuth from '../../hooks/useAuth';

const DashboardLayout = ({ children }) => {
    const router = useRouter();
    const { isAuthenticated, isLoading, isHydrated } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router, mounted]);

    // Don't render anything on server side
    if (!mounted) {
        return <div className="min-h-screen bg-gray-50"></div>;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:ml-64"> {/* Use responsive margin */}
                <Navbar />
                <main className="p-6">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;