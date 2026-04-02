// frontend/src/hooks/useAuth.js
// COMPLETE – login, logout, 2FA setup/enable/disable, change password, profile

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

const ROLE_PERMISSIONS = {
    admin: {
        dashboard: ['view'],
        users:     ['create', 'read', 'update', 'delete'],
        products:  ['create', 'read', 'update', 'delete'],
        inventory: ['create', 'read', 'update', 'delete', 'adjust'],
        sales:     ['create', 'read', 'update', 'delete', 'refund'],
        analytics: ['view', 'export'],
        audit:     ['view', 'export'],
        settings:  ['view', 'update'],
        invoices:  ['create', 'read', 'print'],
    },
    inventory_manager: {
        dashboard:      ['view'],
        products:       ['create', 'read', 'update'],
        inventory:      ['create', 'read', 'update', 'adjust'],
        sales:          ['read'],
        analytics:      ['view'],
        reorder_alerts: ['view', 'acknowledge'],
        settings:       ['view'],
    },
    sales_staff: {
        dashboard: ['view'],
        products:  ['read'],
        inventory: ['read'],
        sales:     ['create', 'read'],
        invoices:  ['create', 'read', 'print'],
        settings:  ['view'],
    },
};

const useAuth = create(
    persist(
        (set, get) => ({
            user:               null,
            token:              null,
            isAuthenticated:    false,
            isLoading:          false,
            twoFactorRequired:  false,
            tempUserId:         null,
            isHydrated:         false,

            setHydrated: () => set({ isHydrated: true }),

            // ── "Login" button ─────────────────────────────────────────────
            login: async (credentials) => {
                set({ isLoading: true });
                try {
                    const response = await apiService.auth.login(credentials);
                    const { data } = response;

                    // Backend signals 2FA is required
                    if (data.requiresTwoFactor) {
                        set({
                            twoFactorRequired: true,
                            tempUserId:        data.userId,
                            isLoading:         false,
                        });
                        return { requiresTwoFactor: true };
                    }

                    const { token, user } = data;
                    if (typeof window !== 'undefined') localStorage.setItem('token', token);
                    set({ user, token, isAuthenticated: true, twoFactorRequired: false, tempUserId: null, isLoading: false });
                    toast.success(`Welcome back, ${user.username}!`);
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    const msg = err.response?.data?.message || 'Login failed. Please try again.';
                    toast.error(msg);
                    throw err;
                }
            },

            // ── 2FA verify step at login ──────────────────────────────────
            verify2FA: async (code) => {
                set({ isLoading: true });
                try {
                    const { tempUserId } = get();
                    const response = await apiService.auth.verify2FA({ userId: tempUserId, code });
                    const { token, user } = response.data;

                    if (typeof window !== 'undefined') localStorage.setItem('token', token);
                    set({ user, token, isAuthenticated: true, twoFactorRequired: false, tempUserId: null, isLoading: false });
                    toast.success('Login successful!');
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    toast.error(err.response?.data?.message || 'Invalid 2FA code');
                    throw err;
                }
            },

            // ── "Logout" button ───────────────────────────────────────────
            logout: async () => {
                try {
                    await apiService.auth.logout();
                } catch (_) { /* silent – still clear local state */ }
                if (typeof window !== 'undefined') localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false });
                toast.success('Logged out successfully');
            },

            // ── "Change Password" button ──────────────────────────────────
            changePassword: async (currentPassword, newPassword) => {
                set({ isLoading: true });
                try {
                    await apiService.auth.changePassword({ currentPassword, newPassword });
                    toast.success('Password changed successfully');
                    set({ isLoading: false });
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    toast.error(err.response?.data?.message || 'Failed to change password');
                    throw err;
                }
            },

            // ── "Setup 2FA" button – returns { secret, qrCode } ──────────
            setup2FA: async () => {
                set({ isLoading: true });
                try {
                    const response = await apiService.auth.setup2FA();
                    set({ isLoading: false });
                    return response.data.data; // { secret, qrCode, otpAuth }
                } catch (err) {
                    set({ isLoading: false });
                    toast.error(err.response?.data?.message || 'Failed to set up 2FA');
                    throw err;
                }
            },

            // ── "Verify & Enable" button in 2FA modal ─────────────────────
            enable2FA: async (code) => {
                set({ isLoading: true });
                try {
                    await apiService.auth.enable2FA(code);
                    // Update local user state
                    set(state => ({
                        user: { ...state.user, twoFactorEnabled: true },
                        isLoading: false,
                    }));
                    toast.success('Two-factor authentication enabled!');
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    toast.error(err.response?.data?.message || 'Failed to enable 2FA');
                    throw err;
                }
            },

            // ── "Disable 2FA" button ──────────────────────────────────────
            disable2FA: async (password) => {
                set({ isLoading: true });
                try {
                    await apiService.auth.disable2FA(password);
                    set(state => ({
                        user: { ...state.user, twoFactorEnabled: false },
                        isLoading: false,
                    }));
                    toast.success('Two-factor authentication disabled');
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    toast.error(err.response?.data?.message || 'Failed to disable 2FA');
                    throw err;
                }
            },

            // ── "Update Profile" button ───────────────────────────────────
            updateProfile: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await apiService.users.updateProfile(data);
                    const updated  = response.data.data;
                    set(state => ({
                        user: { ...state.user, ...updated },
                        isLoading: false,
                    }));
                    toast.success('Profile updated successfully');
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    toast.error(err.response?.data?.message || 'Failed to update profile');
                    throw err;
                }
            },

            // ── Permission helpers ─────────────────────────────────────────
            hasPermission: (resource, action) => {
                const { user } = get();
                if (!user) return false;
                const perms = ROLE_PERMISSIONS[user.role];
                if (!perms || !perms[resource]) return false;
                return perms[resource].includes(action) || perms[resource].includes('*');
            },

            isAdmin:   () => get().user?.role === 'admin',
            isManager: () => get().user?.role === 'inventory_manager',
            isStaff:   () => get().user?.role === 'sales_staff',
        }),
        {
            name: 'auth-storage',
            storage: typeof window !== 'undefined'
                ? {
                    getItem:    (name) => { const s = localStorage.getItem(name); return s ? JSON.parse(s) : null; },
                    setItem:    (name, value) => localStorage.setItem(name, JSON.stringify(value)),
                    removeItem: (name) => localStorage.removeItem(name),
                }
                : undefined,
            partialize: (state) => ({
                user:            state.user,
                token:           state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuth;
