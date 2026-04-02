// frontend/src/hooks/useInventory.js
// COMPLETE – all Inventory page buttons wired to apiService

import { useState, useCallback } from 'react';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

const useInventory = () => {
    const [loading, setLoading]           = useState(false);
    const [products, setProducts]         = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [lowStock, setLowStock]         = useState([]);
    const [stockValue, setStockValue]     = useState(null);
    const [categories, setCategories]     = useState([]);
    const [pagination, setPagination]     = useState({ page: 1, limit: 10, total: 0, pages: 1 });

    // ── Products table load + pagination + search ─────────────────────────
    const fetchProducts = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const res = await apiService.inventory.getProducts(params);
            if (res.data?.success) {
                setProducts(res.data.data || []);
                setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
            }
            return res.data;
        } catch (err) {
            const msg = err.code === 'ERR_NETWORK'
                ? 'Cannot connect to server. Is the backend running on port 5000?'
                : (err.response?.data?.message || 'Failed to fetch products');
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Single product (Edit modal pre-fill) ──────────────────────────────
    const fetchProduct = useCallback(async (id) => {
        setLoading(true);
        try {
            const res = await apiService.inventory.getProduct(id);
            return res.data?.data || res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch product');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Product typeahead search (New Sale page) ──────────────────────────
    const searchProducts = useCallback(async (query) => {
        try {
            const res = await apiService.inventory.searchProducts(query);
            return res.data?.data || [];
        } catch (err) {
            toast.error('Failed to search products');
            return [];
        }
    }, []);

    // ── "Add Product" button ──────────────────────────────────────────────
    const createProduct = useCallback(async (data) => {
        setLoading(true);
        try {
            const res = await apiService.inventory.createProduct(data);
            if (res.data?.success) {
                toast.success('Product created successfully');
                return res.data.data;
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create product';
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── "Save Changes" in Edit Product modal ──────────────────────────────
    const updateProduct = useCallback(async (id, data) => {
        setLoading(true);
        try {
            const res = await apiService.inventory.updateProduct(id, data);
            if (res.data?.success) {
                toast.success('Product updated successfully');
                return res.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update product');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── "Delete" button ───────────────────────────────────────────────────
    const deleteProduct = useCallback(async (id) => {
        setLoading(true);
        try {
            const res = await apiService.inventory.deleteProduct(id);
            if (res.data?.success) {
                toast.success('Product deleted successfully');
                setProducts(prev => prev.filter(p => p.id !== id));
                return true;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete product');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Low-stock widget ──────────────────────────────────────────────────
    const fetchLowStock = useCallback(async () => {
        try {
            const res = await apiService.inventory.getLowStock();
            const data = res.data?.data || [];
            setLowStock(data);
            return data;
        } catch (err) {
            toast.error('Failed to fetch low stock alerts');
            return [];
        }
    }, []);

    // ── Stock value report card ───────────────────────────────────────────
    const fetchStockValue = useCallback(async () => {
        try {
            const res = await apiService.inventory.getStockValue();
            const data = res.data?.data || null;
            setStockValue(data);
            return data;
        } catch (err) {
            toast.error('Failed to fetch stock value');
            return null;
        }
    }, []);

    // ── Transactions tab ──────────────────────────────────────────────────
    const fetchTransactions = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const res = await apiService.inventory.getTransactions(params);
            const data = res.data?.data || [];
            setTransactions(data);
            return res.data;
        } catch (err) {
            toast.error('Failed to fetch transactions');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── "Add Stock" / Stock Inward button ────────────────────────────────
    const processInward = useCallback(async (data) => {
        setLoading(true);
        try {
            const res = await apiService.inventory.inward(data);
            if (res.data?.success) {
                toast.success(res.data.message || 'Stock added successfully');
                // Optimistically update product in list
                setProducts(prev => prev.map(p =>
                    p.id === data.productId
                        ? { ...p, current_stock: p.current_stock + parseInt(data.quantity) }
                        : p
                ));
                return res.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add stock');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── "Remove Stock" / Stock Outward button ─────────────────────────────
    const processOutward = useCallback(async (data) => {
        setLoading(true);
        try {
            const res = await apiService.inventory.outward(data);
            if (res.data?.success) {
                toast.success(res.data.message || 'Stock removed successfully');
                setProducts(prev => prev.map(p =>
                    p.id === data.productId
                        ? { ...p, current_stock: p.current_stock - parseInt(data.quantity) }
                        : p
                ));
                return res.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove stock');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Category dropdown ─────────────────────────────────────────────────
    const fetchCategories = useCallback(async () => {
        try {
            const res = await apiService.inventory.getCategories();
            const data = res.data?.data || [];
            setCategories(data);
            return data;
        } catch (_) {
            return [];
        }
    }, []);

    return {
        loading,
        products,
        transactions,
        lowStock,
        stockValue,
        categories,
        pagination,
        fetchProducts,
        fetchProduct,
        searchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        fetchLowStock,
        fetchStockValue,
        fetchTransactions,
        processInward,
        processOutward,
        fetchCategories,
        // Aliases used by older code
        getLowStock:      fetchLowStock,
        getTransactions:  fetchTransactions,
        getCategories:    fetchCategories,
    };
};

export default useInventory;
