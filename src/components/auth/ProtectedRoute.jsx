import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole }) => {
    const router = useRouter();
    const { isAuthenticated, user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (!isLoading && requiredRole && user?.role !== requiredRole) {
            router.push('/unauthorized');
        }
    }, [isAuthenticated, isLoading, user, requiredRole, router]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (!isAuthenticated) return null;
    if (requiredRole && user?.role !== requiredRole) return null;

    return children;
};

export default ProtectedRoute;