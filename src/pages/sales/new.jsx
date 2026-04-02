// frontend/src/pages/sales/new.jsx
// COMPLETE – product search, add to cart, checkout button all wired to real backend

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    TrashIcon, PlusIcon, MinusIcon,
    ShoppingCartIcon, MagnifyingGlassIcon, UserIcon,
} from '@heroicons/react/24/outline';
import useSales     from '../../hooks/useSales';
import useInventory from '../../hooks/useInventory';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const TAX_RATE = 0.10; // 10%

export default function NewSale() {
    const router                                = useRouter();
    const { createSale, loading: saleLoading }  = useSales();
    const { searchProducts }                    = useInventory();

    const [cart, setCart]           = useState([]);
    const [searchQuery, setSearch]  = useState('');
    const [searchResults, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [discount, setDiscount]   = useState(0);
    const [customer, setCustomer]   = useState({ name: '', email: '', phone: '' });
    const [paymentMethod, setPayment] = useState('cash');

    // Debounced product search
    useEffect(() => {
        if (!searchQuery.trim()) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            const results = await searchProducts(searchQuery);
            setResults(results);
            setSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ── Cart operations ───────────────────────────────────────────────────
    const addToCart = (product) => {
        if (product.current_stock <= 0) {
            toast.error(`"${product.name}" is out of stock`);
            return;
        }
        setCart(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                if (existing.quantity >= product.current_stock) {
                    toast.error(`Only ${product.current_stock} units available`);
                    return prev;
                }
                return prev.map(i => i.id === product.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setSearch('');
        setResults([]);
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

    const updateQty = (id, qty) => {
        if (qty < 1) { removeFromCart(id); return; }
        setCart(prev => prev.map(i => {
            if (i.id !== id) return i;
            if (qty > i.current_stock) {
                toast.error(`Only ${i.current_stock} units available`);
                return i;
            }
            return { ...i, quantity: qty };
        }));
    };

    // ── Totals ────────────────────────────────────────────────────────────
    const subtotal     = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discountAmt  = Math.min(parseFloat(discount) || 0, subtotal);
    const taxableAmt   = subtotal - discountAmt;
    const taxAmt       = taxableAmt * TAX_RATE;
    const total        = taxableAmt + taxAmt;

    const fmt = (n) => `$${n.toFixed(2)}`;

    // ── "Checkout" button ─────────────────────────────────────────────────
    const handleCheckout = async () => {
        if (cart.length === 0) { toast.error('Your cart is empty'); return; }

        const saleData = {
            customerName:  customer.name  || null,
            customerEmail: customer.email || null,
            customerPhone: customer.phone || null,
            paymentMethod,
            subtotal:      parseFloat(subtotal.toFixed(2)),
            tax:           parseFloat(taxAmt.toFixed(2)),
            discount:      parseFloat(discountAmt.toFixed(2)),
            totalAmount:   parseFloat(total.toFixed(2)),
            items: cart.map(i => ({
                productId:  i.id,
                quantity:   i.quantity,
                unitPrice:  parseFloat(i.unit_price),
                totalPrice: parseFloat((i.unit_price * i.quantity).toFixed(2)),
            })),
        };

        try {
            const sale = await createSale(saleData);
            // Redirect to invoice page after successful checkout
            router.push(`/sales/${sale.id}/invoice`);
        } catch (_) { /* toast already shown in hook */ }
    };

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
                <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
                    ← Back
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Product Search + Cart ───────────────────────── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Product Search */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h2 className="text-base font-semibold text-gray-900 mb-3">Search Products</h2>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Type product name or SKU…"
                                value={searchQuery}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoComplete="off"
                            />
                        </div>

                        {/* Search results dropdown */}
                        {(searching || searchResults.length > 0) && (
                            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                                {searching ? (
                                    <div className="p-3 text-center text-gray-400 text-sm">Searching…</div>
                                ) : (
                                    searchResults.map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="w-full flex justify-between items-center px-4 py-3 hover:bg-indigo-50 text-left border-b last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                                <p className="text-xs text-gray-500">SKU: {product.sku} · Stock: {product.current_stock}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-indigo-600">{fmt(parseFloat(product.unit_price))}</p>
                                                {product.current_stock <= 0 && (
                                                    <p className="text-xs text-red-500">Out of stock</p>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                                {!searching && searchResults.length === 0 && searchQuery && (
                                    <div className="p-3 text-center text-gray-400 text-sm">No products found</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cart Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-4 py-3 border-b flex items-center gap-2">
                            <ShoppingCartIcon className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base font-semibold text-gray-900">
                                Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
                            </h2>
                        </div>
                        {cart.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <ShoppingCartIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Cart is empty. Search and add products above.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {cart.map(item => (
                                    <div key={item.id} className="px-4 py-3 flex items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">@ {fmt(parseFloat(item.unit_price))} each</p>
                                        </div>
                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQty(item.id, item.quantity - 1)}
                                                className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                            >
                                                <MinusIcon className="w-3 h-3" />
                                            </button>
                                            <input
                                                type="number"
                                                min={1}
                                                max={item.current_stock}
                                                value={item.quantity}
                                                onChange={e => updateQty(item.id, parseInt(e.target.value) || 1)}
                                                className="w-12 text-center border border-gray-300 rounded-lg py-1 text-sm"
                                            />
                                            <button
                                                onClick={() => updateQty(item.id, item.quantity + 1)}
                                                className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                            >
                                                <PlusIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="w-20 text-right">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {fmt(parseFloat(item.unit_price) * item.quantity)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Customer Info + Summary + Checkout ─────────── */}
                <div className="space-y-4">

                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <UserIcon className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-sm font-semibold text-gray-900">Customer (Optional)</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'name',  label: 'Name',  type: 'text',  placeholder: 'Customer name' },
                                { key: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
                                { key: 'phone', label: 'Phone', type: 'tel',   placeholder: '+91 9999 000000' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                                    <input
                                        type={f.type}
                                        placeholder={f.placeholder}
                                        value={customer[f.key]}
                                        onChange={e => setCustomer({ ...customer, [f.key]: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Method</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'cash',          label: '💵 Cash' },
                                { value: 'card',          label: '💳 Card' },
                                { value: 'bank_transfer', label: '🏦 Bank' },
                            ].map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setPayment(m.value)}
                                    className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                                        paymentMethod === m.value
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{fmt(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 items-center">
                                <span>Discount</span>
                                <div className="flex items-center gap-1">
                                    <span>$</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                        className="w-16 border border-gray-300 rounded px-2 py-0.5 text-right text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (10%)</span>
                                <span>{fmt(taxAmt)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2 mt-2">
                                <span>Total</span>
                                <span className="text-indigo-600">{fmt(total)}</span>
                            </div>
                        </div>

                        {/* "Checkout" button */}
                        <button
                            onClick={handleCheckout}
                            disabled={saleLoading || cart.length === 0}
                            className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saleLoading ? (
                                <><LoadingSpinner size="small" /> Processing…</>
                            ) : (
                                <><ShoppingCartIcon className="w-5 h-5" /> Checkout – {fmt(total)}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
