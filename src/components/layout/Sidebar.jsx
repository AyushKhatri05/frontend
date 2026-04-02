// frontend/src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    HomeIcon, CubeIcon, ShoppingCartIcon, ChartBarIcon,
    UsersIcon, Cog6ToothIcon,
    ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render sidebar until mounted on client
    if (!mounted) {
        return <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl z-50"></aside>;
    }

    const menuItems = [
        { title: 'Dashboard', icon: HomeIcon, path: '/dashboard', roles: ['admin', 'inventory_manager', 'sales_staff'] },
        { title: 'Inventory', icon: CubeIcon, path: '/inventory', roles: ['admin', 'inventory_manager'] },
        { title: 'Sales', icon: ShoppingCartIcon, path: '/sales', roles: ['admin', 'inventory_manager', 'sales_staff'] },
        { title: 'Analytics', icon: ChartBarIcon, path: '/analytics', roles: ['admin', 'inventory_manager'] },
        { title: 'Users', icon: UsersIcon, path: '/users', roles: ['admin'] },
        { title: 'Settings', icon: Cog6ToothIcon, path: '/settings', roles: ['admin', 'inventory_manager'] }
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="h-full flex flex-col">
                <div className="p-4 flex items-center justify-between border-b border-white/20">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-indigo-600 font-bold text-xl">E</span>
                        </div>
                        {!collapsed && <span className="font-bold text-xl">ERP Lite</span>}
                    </div>
                    <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-lg hover:bg-white/20">
                        <span className="text-sm">{collapsed ? '→' : '←'}</span>
                    </button>
                </div>

                <div className="p-4 border-b border-white/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-white font-semibold text-lg">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div>
                                <p className="font-medium truncate">{user?.username}</p>
                                <p className="text-xs text-white/70 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    {filteredMenu.map((item) => (
                        <Link href={item.path} key={item.path}>
                            <div className={`mx-2 px-4 py-3 rounded-lg flex items-center space-x-3 hover:bg-white/20 cursor-pointer transition-colors ${router.pathname === item.path ? 'bg-white text-indigo-600' : ''}`}>
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span className="text-sm">{item.title}</span>}
                            </div>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/20">
                    <button onClick={logout} className="w-full px-4 py-3 rounded-lg flex items-center space-x-3 hover:bg-white/20 transition-colors">
                        <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;