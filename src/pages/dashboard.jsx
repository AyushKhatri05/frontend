// frontend/src/pages/dashboard.jsx
// COMPLETE – stat cards, low-stock alerts, and quick-action buttons all use real API data

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
    CubeIcon, ShoppingCartIcon, ChartBarIcon,
    ExclamationTriangleIcon, ArrowTrendingUpIcon,
    BanknotesIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import useAuth      from '../hooks/useAuth';
import apiService   from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import Link from 'next/link';

const StatCard = ({ title, value, icon: Icon, color, sub, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                {loading
                    ? <div className="mt-2 h-7 w-24 bg-gray-200 animate-pulse rounded" />
                    : <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                }
                {sub && !loading && (
                    <p className="text-xs text-gray-500 mt-1">{sub}</p>
                )}
            </div>
            <div className={`${color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const router            = useRouter();
    const { user }          = useAuth();
    const [kpis, setKpis]   = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [kpiRes, stockRes] = await Promise.allSettled([
                apiService.analytics.getDashboardKPIs(),
                apiService.inventory.getLowStock(),
            ]);
            if (kpiRes.status === 'fulfilled' && kpiRes.value.data?.success) {
                setKpis(kpiRes.value.data.data);
            }
            if (stockRes.status === 'fulfilled' && stockRes.value.data?.success) {
                setLowStock(stockRes.value.data.data || []);
            }
        } catch (_) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {user?.username}!</h1>
                        <p className="text-indigo-100 mt-1">Here's your business at a glance.</p>
                    </div>
                    <button
                        onClick={loadDashboard}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <ArrowPathIcon className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Today's Revenue"
                        value={formatCurrency(kpis?.todayRevenue)}
                        icon={BanknotesIcon}
                        color="bg-green-500"
                        sub={`${kpis?.todaySales ?? '–'} transactions today`}
                        loading={loading}
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={formatCurrency(kpis?.monthlyRevenue)}
                        icon={ArrowTrendingUpIcon}
                        color="bg-blue-500"
                        sub={`${kpis?.monthlySales ?? '–'} sales this month`}
                        loading={loading}
                    />
                    <StatCard
                        title="Total Products"
                        value={kpis?.totalProducts ?? '–'}
                        icon={CubeIcon}
                        color="bg-purple-500"
                        sub="Active products in inventory"
                        loading={loading}
                    />
                    <StatCard
                        title="Low Stock Alerts"
                        value={kpis?.lowStockCount ?? '–'}
                        icon={ExclamationTriangleIcon}
                        color={kpis?.lowStockCount > 0 ? 'bg-red-500' : 'bg-gray-400'}
                        sub={kpis?.lowStockCount > 0 ? 'Items need restocking' : 'All items well-stocked'}
                        loading={loading}
                    />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => router.push('/inventory/products')}
                            className="p-4 border-2 border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 text-left transition-colors group"
                        >
                            <CubeIcon className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-gray-900">Add Product</p>
                            <p className="text-sm text-gray-500">Manage inventory catalogue</p>
                        </button>

                        <Link href="/sales/new" className="block">
                            <div className="p-4 border-2 border-dashed border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 text-left transition-colors group h-full">
                                <ShoppingCartIcon className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="font-medium text-gray-900">New Sale</p>
                                <p className="text-sm text-gray-500">Create a sale &amp; invoice</p>
                            </div>
                        </Link>

                        <button
                            onClick={() => router.push('/analytics')}
                            className="p-4 border-2 border-dashed border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 text-left transition-colors group"
                        >
                            <ChartBarIcon className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-gray-900">View Analytics</p>
                            <p className="text-sm text-gray-500">Reports &amp; trends</p>
                        </button>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                {lowStock.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                Low Stock Alerts ({lowStock.length})
                            </h2>
                            <button
                                onClick={() => router.push('/inventory')}
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                View All →
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {lowStock.slice(0, 5).map(item => (
                                <div key={item.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-red-600">{item.current_stock}</span>
                                        <span className="text-xs text-gray-400 ml-1">/ min {item.minimum_stock}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
