// frontend/src/hooks/useSales.js
// COMPLETE – all Sales page buttons wired

import { useState, useCallback } from 'react';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

const useSales = () => {
    const [loading, setLoading]       = useState(false);
    const [sales, setSales]           = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
    const [dailyStats, setDailyStats] = useState(null);

    // ── Sales table load ──────────────────────────────────────────────────
    const fetchSales = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const res = await apiService.sales.getAll(params);
            if (res.data?.success) {
                setSales(res.data.data || []);
                setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
            }
            return res.data;
        } catch (err) {
            const msg = err.code === 'ERR_NETWORK'
                ? 'Cannot connect to server.'
                : (err.response?.data?.message || 'Failed to fetch sales');
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Single sale detail ────────────────────────────────────────────────
    const fetchSale = useCallback(async (id) => {
        setLoading(true);
        try {
            const res = await apiService.sales.getById(id);
            return res.data?.data;
        } catch (err) {
            toast.error('Failed to fetch sale details');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── "Checkout" button in /sales/new ──────────────────────────────────
    const createSale = useCallback(async (saleData) => {
        setLoading(true);
        try {
            const res = await apiService.sales.create(saleData);
            if (res.data?.success) {
                toast.success(`Sale created! Invoice: ${res.data.data.invoice_number}`);
                return res.data.data;
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create sale';
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Search bar ────────────────────────────────────────────────────────
    const searchSales = useCallback(async (q) => {
        try {
            const res = await apiService.sales.search(q);
            return res.data?.data || [];
        } catch (err) {
            toast.error('Search failed');
            return [];
        }
    }, []);

    // ── "View Invoice" / "Generate Invoice" button ─────────────────────
    const getInvoice = useCallback(async (id) => {
        setLoading(true);
        try {
            const res = await apiService.sales.getInvoice(id);
            return res.data?.data;
        } catch (err) {
            toast.error('Failed to load invoice');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── "Refund" button ───────────────────────────────────────────────────
    const refundSale = useCallback(async (id, reason = '') => {
        setLoading(true);
        try {
            const res = await apiService.sales.refund(id, reason);
            if (res.data?.success) {
                toast.success('Sale refunded and stock restored');
                // Optimistically update status in local list
                setSales(prev => prev.map(s =>
                    s.id === id ? { ...s, payment_status: 'refunded' } : s
                ));
                return true;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to refund sale');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Daily stats (Sales Dashboard stat cards) ──────────────────────────
    const fetchDailyStats = useCallback(async (date) => {
        try {
            const res = await apiService.sales.getDailyReport(date);
            if (res.data?.success) {
                setDailyStats(res.data.data);
                return res.data.data;
            }
        } catch (_) {
            return null;
        }
    }, []);

    // ── Top products (Analytics page) ─────────────────────────────────────
    const fetchTopProducts = useCallback(async (params = {}) => {
        try {
            const res = await apiService.sales.getTopProducts(params);
            return res.data?.data || [];
        } catch (err) {
            toast.error('Failed to fetch top products');
            return [];
        }
    }, []);

    return {
        loading,
        sales,
        pagination,
        dailyStats,
        fetchSales,
        fetchSale,
        createSale,
        searchSales,
        getInvoice,
        refundSale,
        fetchDailyStats,
        fetchTopProducts,
    };
};

export default useSales;
