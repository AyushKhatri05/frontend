// frontend/src/pages/inventory/index.jsx
// COMPLETE – all stat cards wired to real API (no hardcoded values)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    CubeIcon, ArrowTrendingDownIcon,
    BanknotesIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import useInventory from '../../hooks/useInventory';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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
                {sub && !loading && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
            <div className={`${color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

export default function InventoryDashboard() {
    const router = useRouter();
    const {
        loading, products, pagination,
        fetchProducts, fetchLowStock, fetchStockValue,
        lowStock, stockValue,
    } = useInventory();

    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setStatsLoading(true);
        await Promise.allSettled([
            fetchProducts({ limit: 5 }),
            fetchLowStock(),
            fetchStockValue(),
        ]);
        setStatsLoading(false);
    };

    const fmt = (n) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
            .format(n || 0);

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white flex-1">
                        <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
                        <p className="text-blue-100 mt-1">Overview of your stock and product catalogue</p>
                    </div>
                    <button
                        onClick={loadAll}
                        className="ml-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        title="Refresh"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Stat Cards – all from real API */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Products"
                        value={stockValue?.total_products ?? products.length}
                        icon={CubeIcon}
                        color="bg-blue-500"
                        sub={`${stockValue?.total_units ?? '–'} total units in stock`}
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Low Stock Alerts"
                        value={lowStock.length}
                        icon={ArrowTrendingDownIcon}
                        color={lowStock.length > 0 ? 'bg-red-500' : 'bg-green-500'}
                        sub={lowStock.length > 0 ? 'Items need restocking' : 'All items well-stocked'}
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Stock Retail Value"
                        value={fmt(stockValue?.total_retail_value)}
                        icon={BanknotesIcon}
                        color="bg-purple-500"
                        sub={`Cost value: ${fmt(stockValue?.total_cost_value)}`}
                        loading={statsLoading}
                    />
                </div>

                {/* Quick Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/inventory/products">
                        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-indigo-200 p-5 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors">
                            <CubeIcon className="w-6 h-6 text-indigo-500 mb-2" />
                            <p className="font-semibold text-gray-900">Product Management</p>
                            <p className="text-sm text-gray-500">Add, edit, delete products and manage stock</p>
                        </div>
                    </Link>
                    <Link href="/analytics">
                        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-purple-200 p-5 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-colors">
                            <ArrowTrendingDownIcon className="w-6 h-6 text-purple-500 mb-2" />
                            <p className="font-semibold text-gray-900">Inventory Analytics</p>
                            <p className="text-sm text-gray-500">Velocity, ABC analysis, reorder alerts</p>
                        </div>
                    </Link>
                </div>

                {/* Recent Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="text-base font-semibold text-gray-900">Recent Products</h2>
                        <Link href="/inventory/products">
                            <span className="text-sm text-indigo-600 hover:underline cursor-pointer">View All →</span>
                        </Link>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {products.slice(0, 5).map(product => (
                                <div key={product.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            SKU: {product.sku} · {product.category || 'Uncategorised'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                            ${parseFloat(product.unit_price).toFixed(2)}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${product.current_stock <= product.minimum_stock ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                                            Stock: {product.current_stock}
                                            {product.current_stock <= product.minimum_stock && ' ⚠ Low'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div className="px-6 py-10 text-center text-gray-400 text-sm">
                                    No products yet.{' '}
                                    <Link href="/inventory/products">
                                        <span className="text-indigo-600 hover:underline cursor-pointer">Add your first product →</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Low Stock Alerts */}
                {lowStock.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-red-200">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-base font-semibold text-red-700">
                                ⚠ Low Stock Alerts ({lowStock.length})
                            </h2>
                            <Link href="/analytics">
                                <span className="text-sm text-indigo-600 hover:underline cursor-pointer">Manage →</span>
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {lowStock.slice(0, 5).map(item => (
                                <div key={item.id} className="px-6 py-3 flex justify-between items-center">
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
