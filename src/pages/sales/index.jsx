// frontend/src/pages/sales/index.jsx
// COMPLETE – stat cards from API, real sales table, search, refund, view invoice buttons

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    ShoppingCartIcon, CurrencyDollarIcon, DocumentTextIcon,
    MagnifyingGlassIcon, ArrowPathIcon, EyeIcon,
    ArrowUturnLeftIcon, UserGroupIcon,
} from '@heroicons/react/24/outline';
import useSales from '../../hooks/useSales';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Link from 'next/link';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                {loading
                    ? <div className="mt-2 h-7 w-28 bg-gray-200 animate-pulse rounded" />
                    : <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                }
            </div>
            <div className={`${color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

const statusBadge = {
    completed: 'bg-green-100 text-green-700',
    refunded:  'bg-red-100 text-red-700',
    pending:   'bg-yellow-100 text-yellow-700',
};

export default function SalesDashboard() {
    const {
        loading, sales, pagination,
        fetchSales, refundSale, fetchDailyStats, dailyStats,
    } = useSales();

    const [search, setSearch]         = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage]             = useState(1);
    const [statsLoading, setStatsLoading] = useState(true);

    const loadSales = useCallback(async () => {
        await fetchSales({ page, limit: 15, search: searchTerm });
    }, [page, searchTerm]);

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        await fetchDailyStats();
        setStatsLoading(false);
    }, []);

    useEffect(() => { loadStats(); }, []);
    useEffect(() => { loadSales(); }, [page, searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchTerm(search);
        setPage(1);
    };

    const handleRefund = async (sale) => {
        const reason = prompt(`Reason for refunding invoice ${sale.invoice_number}:`);
        if (reason === null) return; // cancelled
        await refundSale(sale.id, reason);
    };

    const handleRefresh = () => {
        loadSales();
        loadStats();
        toast.success('Refreshed');
    };

    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
                        <p className="text-gray-500 mt-1">Track and manage your sales</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                            title="Refresh"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                        <Link href="/sales/new">
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium">
                                <ShoppingCartIcon className="w-4 h-4" />
                                New Sale
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stat Cards – wired to real daily report API */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Today's Sales"
                        value={dailyStats?.transactions ?? '–'}
                        icon={ShoppingCartIcon}
                        color="bg-blue-500"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Today's Revenue"
                        value={fmt(dailyStats?.revenue)}
                        icon={CurrencyDollarIcon}
                        color="bg-green-500"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Avg. Order Value"
                        value={fmt(dailyStats?.avg_order_value)}
                        icon={DocumentTextIcon}
                        color="bg-purple-500"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Unique Customers"
                        value={dailyStats?.unique_customers ?? '–'}
                        icon={UserGroupIcon}
                        color="bg-orange-500"
                        loading={statsLoading}
                    />
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* Search bar */}
                    <div className="p-4 border-b">
                        <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
                            <div className="relative flex-1">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search invoice, customer…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                            >
                                Search
                            </button>
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => { setSearch(''); setSearchTerm(''); setPage(1); }}
                                    className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                                >
                                    Clear
                                </button>
                            )}
                        </form>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <LoadingSpinner size="large" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        {['Invoice', 'Customer', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sales.map(sale => (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-4 font-mono text-xs font-medium text-indigo-600">
                                                {sale.invoice_number}
                                            </td>
                                            <td className="px-5 py-4 text-gray-800">
                                                {sale.customer_name || <span className="text-gray-400 italic">Walk-in</span>}
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-gray-900">
                                                {fmt(sale.total_amount)}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600 capitalize">
                                                {sale.payment_method?.replace('_', ' ')}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${statusBadge[sale.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {sale.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                                                {new Date(sale.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {/* "View Invoice" button */}
                                                    <Link href={`/sales/${sale.id}/invoice`}>
                                                        <button
                                                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded"
                                                            title="View Invoice"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                    {/* "Refund" button – only for completed sales */}
                                                    {sale.payment_status === 'completed' && (
                                                        <button
                                                            onClick={() => handleRefund(sale)}
                                                            className="text-red-500 hover:text-red-700 p-1 rounded"
                                                            title="Refund Sale"
                                                        >
                                                            <ArrowUturnLeftIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {sales.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    {searchTerm ? 'No sales match your search.' : 'No sales yet. Create your first sale!'}
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="px-6 py-4 border-t flex justify-between items-center text-sm text-gray-500">
                                    <span>{pagination.total} total sales</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
                                        >← Prev</button>
                                        <span className="px-3 py-1">Page {page} / {pagination.pages}</span>
                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                            disabled={page === pagination.pages}
                                            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
                                        >Next →</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
