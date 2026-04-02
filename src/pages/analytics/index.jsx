// frontend/src/pages/analytics/index.jsx
// COMPLETE – all analytics buttons wired to real backend APIs

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    ChartBarIcon, ArrowPathIcon, BellAlertIcon,
    CheckCircleIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import apiService   from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const fmt  = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
const tabs = ['Overview', 'Inventory', 'Alerts', 'ABC Analysis'];

export default function AnalyticsPage() {
    const [activeTab, setActiveTab]     = useState('Overview');
    const [period, setPeriod]           = useState('month');
    const [loading, setLoading]         = useState(true);
    const [charts, setCharts]           = useState(null);
    const [trends, setTrends]           = useState([]);
    const [velocity, setVelocity]       = useState([]);
    const [abcData, setAbcData]         = useState([]);
    const [alerts, setAlerts]           = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [chartsRes, trendsRes, alertsRes, topRes] = await Promise.allSettled([
                apiService.analytics.getDashboardCharts(),
                apiService.analytics.getSalesTrends(period),
                apiService.analytics.getReorderAlerts(),
                apiService.sales.getTopProducts({ period, limit: 8 }),
            ]);
            if (chartsRes.status === 'fulfilled')    setCharts(chartsRes.value.data?.data);
            if (trendsRes.status === 'fulfilled')    setTrends(trendsRes.value.data?.data || []);
            if (alertsRes.status === 'fulfilled')    setAlerts(alertsRes.value.data?.data || []);
            if (topRes.status === 'fulfilled')       setTopProducts(topRes.value.data?.data || []);
        } catch (_) {
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    }, [period]);

    const loadInventoryTab = useCallback(async () => {
        setLoading(true);
        try {
            const [velRes, abcRes] = await Promise.allSettled([
                apiService.analytics.getInventoryVelocity(),
                apiService.analytics.getABCAnalysis(),
            ]);
            if (velRes.status === 'fulfilled') setVelocity(velRes.value.data?.data || []);
            if (abcRes.status === 'fulfilled') setAbcData(abcRes.value.data?.data || []);
        } catch (_) {
            toast.error('Failed to load inventory analytics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'Overview' || activeTab === 'Alerts') load();
        if (activeTab === 'Inventory' || activeTab === 'ABC Analysis') loadInventoryTab();
    }, [activeTab, period]);

    // "Acknowledge" button in alerts table
    const handleAcknowledge = async (alertId) => {
        try {
            await apiService.analytics.acknowledgeAlert(alertId);
            toast.success('Alert acknowledged');
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, status: 'acknowledged' } : a
            ));
        } catch (err) {
            toast.error('Failed to acknowledge alert');
        }
    };

    const velClass = { fast: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', slow: 'bg-red-100 text-red-700' };
    const abcClass = { A: 'bg-green-100 text-green-800', B: 'bg-blue-100 text-blue-800', C: 'bg-gray-100 text-gray-700' };

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                        <p className="text-gray-500 mt-1">Business insights and reports</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Period filter buttons */}
                        {['week', 'month', 'year'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-sm rounded-lg capitalize font-medium transition-colors ${
                                    period === p
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {p === 'week' ? 'Last 7 Days' : p === 'month' ? 'Last 30 Days' : 'Last Year'}
                            </button>
                        ))}
                        <button
                            onClick={load}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                            title="Refresh"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex gap-6">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === tab
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size="large" />
                    </div>
                ) : (

                    /* ── Overview Tab ──────────────────────────────────── */
                    activeTab === 'Overview' && (
                        <div className="space-y-6">
                            {/* Revenue Trend */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                                    Revenue Trend
                                </h2>
                                {trends.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-8">No sales data for this period.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    {['Period', 'Orders', 'Revenue', 'Avg Order Value'].map(h => (
                                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {trends.map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                                                        <td className="px-4 py-3 text-gray-700">{row.orders}</td>
                                                        <td className="px-4 py-3 font-semibold text-indigo-600">{fmt(row.revenue)}</td>
                                                        <td className="px-4 py-3 text-gray-600">{fmt(row.avg_order_value)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Top Products */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Top Products by Revenue</h2>
                                {topProducts.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-8">No sales data for this period.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {topProducts.map((p, i) => {
                                            const maxRevenue = topProducts[0]?.revenue || 1;
                                            const pct = Math.round((p.revenue / maxRevenue) * 100);
                                            return (
                                                <div key={p.id} className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-gray-400 w-5">#{i+1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium text-gray-900 truncate">{p.name}</span>
                                                            <span className="text-indigo-600 font-semibold ml-2 whitespace-nowrap">{fmt(p.revenue)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-16 text-right">{p.quantity_sold} sold</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}

                {/* ── Inventory Tab ─────────────────────────────────────── */}
                {!loading && activeTab === 'Inventory' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b">
                            <h2 className="font-semibold text-gray-900">Inventory Velocity (Last 30 Days)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        {['Product', 'SKU', 'Stock', 'Units Sold', 'Revenue', 'Days of Stock', 'Velocity'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {velocity.map(row => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.sku}</td>
                                            <td className="px-4 py-3 text-gray-700">{row.current_stock}</td>
                                            <td className="px-4 py-3 text-gray-700">{row.units_sold_30d}</td>
                                            <td className="px-4 py-3 font-semibold text-indigo-600">{fmt(row.revenue_30d)}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.days_of_stock ?? '∞'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${velClass[row.velocity_class] || 'bg-gray-100 text-gray-500'}`}>
                                                    {row.velocity_class}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {velocity.length === 0 && (
                                <div className="text-center py-12 text-gray-400">No inventory data.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Alerts Tab ────────────────────────────────────────── */}
                {!loading && activeTab === 'Alerts' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b flex items-center gap-2">
                            <BellAlertIcon className="w-5 h-5 text-red-500" />
                            <h2 className="font-semibold text-gray-900">Reorder Alerts</h2>
                            <span className="ml-auto text-sm text-gray-500">{alerts.filter(a => a.status === 'pending').length} pending</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {alerts.length === 0 && (
                                <div className="text-center py-12 text-gray-400">No reorder alerts. All stock levels are healthy!</div>
                            )}
                            {alerts.map(alert => (
                                <div key={alert.id} className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {alert.status === 'pending'
                                            ? <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                            : <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        }
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{alert.product_name}</p>
                                            <p className="text-xs text-gray-500">
                                                SKU: {alert.sku} · Stock: {alert.current_stock} / Min: {alert.minimum_stock}
                                            </p>
                                            {alert.suggested_order_quantity && (
                                                <p className="text-xs text-indigo-600 mt-0.5">
                                                    Suggested reorder: {alert.suggested_order_quantity} units
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${alert.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {alert.status}
                                        </span>
                                        {/* "Acknowledge" button */}
                                        {alert.status === 'pending' && (
                                            <button
                                                onClick={() => handleAcknowledge(alert.id)}
                                                className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── ABC Analysis Tab ──────────────────────────────────── */}
                {!loading && activeTab === 'ABC Analysis' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b">
                            <h2 className="font-semibold text-gray-900">ABC Inventory Analysis</h2>
                            <p className="text-xs text-gray-500 mt-1">
                                A = top 70% revenue · B = 70–90% · C = bottom 10%
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        {['Product', 'SKU', 'Category', 'Revenue', 'Revenue %', 'Class'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {abcData.map(row => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.sku}</td>
                                            <td className="px-4 py-3 text-gray-600 capitalize">{row.category || '—'}</td>
                                            <td className="px-4 py-3 text-indigo-600 font-semibold">{fmt(row.revenue)}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.revenue_pct}%</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full font-bold ${abcClass[row.abc_class] || 'bg-gray-100 text-gray-600'}`}>
                                                    {row.abc_class}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {abcData.length === 0 && (
                                <div className="text-center py-12 text-gray-400">No data available. Make some sales first!</div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
