// frontend/src/pages/sales/[id]/invoice.jsx
// COMPLETE – loads real invoice data from API, Print button works, Back button works

import { useRouter }    from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout  from '../../../components/layout/DashboardLayout';
import useSales         from '../../../hooks/useSales';
import LoadingSpinner   from '../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

export default function InvoicePage() {
    const router = useRouter();
    const { id } = router.query;
    const { getInvoice } = useSales();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const data = await getInvoice(id);
                setInvoice(data);
            } catch (_) {
                toast.error('Failed to load invoice');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" />
                </div>
            </DashboardLayout>
        );
    }

    if (!invoice) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <h2 className="text-xl font-bold text-gray-900">Invoice not found</h2>
                    <button
                        onClick={() => router.push('/sales')}
                        className="mt-4 text-indigo-600 hover:underline text-sm"
                    >← Back to Sales</button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                {/* Action bar – hidden when printing */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <h1 className="text-xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        >
                            ← Back
                        </button>
                        {/* "Print" button */}
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                        >
                            🖨️ Print Invoice
                        </button>
                    </div>
                </div>

                {/* Invoice document */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 print:shadow-none print:border-0">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-indigo-600">ERP Lite</h1>
                            <p className="text-gray-500 text-sm mt-1">Business Management System</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">INVOICE</p>
                            <p className="text-gray-600 font-mono text-sm mt-1">#{invoice.invoiceNumber}</p>
                        </div>
                    </div>

                    {/* Invoice meta */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Bill To</p>
                            <p className="font-semibold text-gray-900">{invoice.customer?.name || 'Walk-in Customer'}</p>
                            {invoice.customer?.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
                            {invoice.customer?.phone && <p className="text-sm text-gray-600">{invoice.customer.phone}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Invoice Details</p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Date: </span>
                                {new Date(invoice.date).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                })}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Payment: </span>
                                <span className="capitalize">{invoice.paymentMethod?.replace('_', ' ')}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Status: </span>
                                <span className={`font-semibold capitalize ${invoice.paymentStatus === 'completed' ? 'text-green-600' : invoice.paymentStatus === 'refunded' ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {invoice.paymentStatus}
                                </span>
                            </p>
                            {invoice.createdBy && (
                                <p className="text-xs text-gray-400 mt-2">Served by: {invoice.createdBy}</p>
                            )}
                        </div>
                    </div>

                    {/* Line items table */}
                    <div className="mb-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-t border-b border-gray-200">
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(invoice.items || []).map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-3 px-4 text-gray-900 font-medium">{item.product_name}</td>
                                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{item.product_sku}</td>
                                        <td className="py-3 px-4 text-right text-gray-700">{item.quantity}</td>
                                        <td className="py-3 px-4 text-right text-gray-700">{fmt(item.unit_price)}</td>
                                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{fmt(item.total_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-60 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{fmt(invoice.subtotal)}</span>
                            </div>
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>- {fmt(invoice.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (10%)</span>
                                <span>{fmt(invoice.tax)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                                <span>Total</span>
                                <span className="text-indigo-600">{fmt(invoice.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t text-center">
                        <p className="text-sm text-gray-500">Thank you for your business!</p>
                        <p className="text-xs text-gray-400 mt-1">This is a computer-generated invoice – no signature required.</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
