// frontend/src/utils/api.js
// COMPLETE – every button in the UI has a matching apiService call

import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://c8e1d100-5519-4d02-b147-fbe4c21c4ee5-00-3njm2nywcke2e.worf.replit.dev/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: global 401 / 403 handling ─────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                if (!window.location.pathname.includes('/login')) {
                    toast.error('Session expired. Please log in again.');
                    window.location.href = '/login';
                }
            }
        }
        if (error.response?.status === 403) {
            toast.error('Access denied. You do not have permission for this action.');
        }
        return Promise.reject(error);
    }
);

const apiService = {

    // ────────────────────────────────────────────────────────────────────────
    // AUTH
    // ────────────────────────────────────────────────────────────────────────
    auth: {
        // "Login" button
        login: (credentials) => api.post('/auth/login', credentials),
        // "Register" button (admin user creation)
        register: (userData) => api.post('/auth/register', userData),
        // "Logout" button in Navbar
        logout: () => api.post('/auth/logout'),
        // "Change Password" button in Settings
        changePassword: (data) => api.post('/auth/change-password', data),
        // "Forgot Password" link on login page
        forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
        // "Reset Password" button on reset page
        resetPassword: (data) => api.post('/auth/reset-password', data),
        // "Enable 2FA" button – fetches QR code + secret
        setup2FA: () => api.post('/auth/2fa/setup'),
        // "Verify & Enable" button in 2FA setup modal
        enable2FA: (code) => api.post('/auth/2fa/enable', { code }),
        // "Disable 2FA" button in Settings
        disable2FA: (password) => api.post('/auth/2fa/disable', { password }),
        // 2FA code submission at login
        verify2FA: (data) => api.post('/auth/2fa/verify', data),
    },

    // ────────────────────────────────────────────────────────────────────────
    // INVENTORY
    // ────────────────────────────────────────────────────────────────────────
    inventory: {
        // Products table: initial load, pagination, search
        getProducts: (params) => api.get('/inventory/products', { params }),
        // Edit Product modal: pre-fill form
        getProduct: (id) => api.get(`/inventory/products/${id}`),
        // "Add Product" button submit
        createProduct: (data) => api.post('/inventory/products', data),
        // "Save Changes" in Edit Product modal
        updateProduct: (id, data) => api.put(`/inventory/products/${id}`, data),
        // "Delete" button (soft delete)
        deleteProduct: (id) => api.delete(`/inventory/products/${id}`),
        // Product search typeahead in New Sale page
        searchProducts: (q) => api.get('/inventory/products/search', { params: { q } }),
        // Low-stock widget on Dashboard + Inventory index
        getLowStock: () => api.get('/inventory/stock/low'),
        // Stock value report card
        getStockValue: () => api.get('/inventory/stock/value'),
        // Transactions tab on Inventory page
        getTransactions: (params) => api.get('/inventory/transactions', { params }),
        // "Add Stock" / Stock Inward button
        inward: (data) => api.post('/inventory/transactions/inward', data),
        // "Remove Stock" / Stock Outward button
        outward: (data) => api.post('/inventory/transactions/outward', data),
        // Category filter dropdown
        getCategories: () => api.get('/inventory/categories'),
    },

    // ────────────────────────────────────────────────────────────────────────
    // SALES
    // ────────────────────────────────────────────────────────────────────────
    sales: {
        // Sales table: initial load + pagination
        getAll: (params) => api.get('/sales', { params }),
        // Sale detail modal
        getById: (id) => api.get(`/sales/${id}`),
        // "Checkout" button in /sales/new
        create: (data) => api.post('/sales', data),
        // Search bar in Sales Dashboard
        search: (q) => api.get('/sales/search', { params: { q } }),
        // "View Invoice" / "Generate Invoice" button
        getInvoice: (id) => api.get(`/sales/${id}/invoice`),
        // "Refund" button in Sales table
        refund: (id, reason) => api.post(`/sales/${id}/refund`, { reason }),
        // Stat cards on Sales Dashboard
        getDailyReport: (date) => api.get('/sales/reports/daily', { params: { date } }),
        // Top products table in Analytics
        getTopProducts: (params) => api.get('/sales/reports/top-products', { params }),
    },

    // ────────────────────────────────────────────────────────────────────────
    // ANALYTICS
    // ────────────────────────────────────────────────────────────────────────
    analytics: {
        // Dashboard stat cards (4 KPI tiles)
        getDashboardKPIs: () => api.get('/analytics/dashboard/kpis'),
        // Revenue + category pie charts
        getDashboardCharts: () => api.get('/analytics/dashboard/charts'),
        // "View Forecast" per-product button
        getForecast: (productId) => api.get(`/analytics/forecast/${productId}`),
        // Reorder alerts table
        getReorderAlerts: () => api.get('/analytics/reorder-alerts'),
        // "Acknowledge" button in alerts table
        acknowledgeAlert: (id) => api.post(`/analytics/reorder-alerts/${id}/acknowledge`),
        // Velocity chart
        getInventoryVelocity: () => api.get('/analytics/inventory/velocity'),
        // ABC analysis table
        getABCAnalysis: () => api.get('/analytics/inventory/abc-analysis'),
        // Period-filter buttons (week / month / year)
        getSalesTrends: (period) => api.get('/analytics/sales/trends', { params: { period } }),
    },

    // ────────────────────────────────────────────────────────────────────────
    // USERS
    // ────────────────────────────────────────────────────────────────────────
    users: {
        // User list table
        getAll: (params) => api.get('/users', { params }),
        // Edit User modal pre-fill
        getById: (id) => api.get(`/users/${id}`),
        // Profile page load
        getProfile: () => api.get('/users/profile/me'),
        // "Update Profile" button
        updateProfile: (data) => api.put('/users/profile/me', data),
        // "Save" in Edit User modal (role + email + username)
        updateUser: (id, data) => api.put(`/users/${id}`, data),
        // "Delete User" button
        deleteUser: (id) => api.delete(`/users/${id}`),
        // "Enable / Disable" toggle button
        toggleStatus: (id) => api.post(`/users/${id}/toggle-status`),
        // Audit log tab
        getAuditLogs: (params) => api.get('/users/audit/logs', { params }),
    },
};

export default apiService;
