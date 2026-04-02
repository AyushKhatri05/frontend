import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    CurrencyDollarIcon,
    CubeIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import useInventory from '../../hooks/useInventory';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Products() {
    const { 
        loading, 
        products, 
        pagination, 
        fetchProducts, 
        createProduct, 
        updateProduct, 
        deleteProduct 
    } = useInventory();
    
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadProducts();
    }, [currentPage, search]);

    const loadProducts = async () => {
        await fetchProducts({ 
            page: currentPage, 
            limit: 10,
            search: search 
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
        setCurrentPage(1);
    };

    const handleAddProduct = async (data) => {
        setModalLoading(true);
        try {
            await createProduct(data);
            setShowAddModal(false);
            loadProducts();
            toast.success('Product added successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add product');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditProduct = async (data) => {
        setModalLoading(true);
        try {
            await updateProduct(selectedProduct.id, data);
            setShowEditModal(false);
            setSelectedProduct(null);
            loadProducts();
            toast.success('Product updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update product');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        setModalLoading(true);
        try {
            await deleteProduct(id);
            setShowDeleteModal(false);
            setSelectedProduct(null);
            loadProducts();
            toast.success('Product deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        } finally {
            setModalLoading(false);
        }
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setShowEditModal(true);
    };

    const openDeleteModal = (product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    };

    const clearSearch = () => {
        setSearch('');
        setSearchInput('');
        setCurrentPage(1);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Product Form Modal Component - MOVED INSIDE Products component
    const ProductModal = ({ isOpen, onClose, product, onSave, loading }) => {
        const [formData, setFormData] = useState({
            name: '',
            sku: '',
            description: '',
            category: '',
            unit_price: '',
            cost_price: '',
            current_stock: '',
            minimum_stock: '10',
            location: ''
        });

        useEffect(() => {
            if (product) {
                setFormData({
                    name: product.name || '',
                    sku: product.sku || '',
                    description: product.description || '',
                    category: product.category || '',
                    unit_price: product.unit_price || '',
                    cost_price: product.cost_price || '',
                    current_stock: product.current_stock || '',
                    minimum_stock: product.minimum_stock || '10',
                    location: product.location || ''
                });
            } else {
                setFormData({
                    name: '',
                    sku: '',
                    description: '',
                    category: '',
                    unit_price: '',
                    cost_price: '',
                    current_stock: '',
                    minimum_stock: '10',
                    location: ''
                });
            }
        }, [product]);

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {product ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Product Name */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter product name"
                                        required
                                    />
                                </div>
                            </div>

                            {/* SKU */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="PROD-001"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Electronics"
                                />
                            </div>

                            {/* Description */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Product description..."
                                />
                            </div>

                            {/* Selling Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selling Price ($) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.unit_price}
                                        onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Cost Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cost Price ($)
                                </label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.cost_price}
                                        onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Current Stock */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Stock <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <CubeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.current_stock}
                                        onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Minimum Stock */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Stock <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.minimum_stock}
                                    onChange={(e) => setFormData({...formData, minimum_stock: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="10"
                                    required
                                />
                            </div>

                            {/* Location */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Warehouse Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Aisle-1, Shelf-B"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg mt-4">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">📝 Summary</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-blue-700">Product: <span className="font-medium">{formData.name || 'Not set'}</span></div>
                                <div className="text-blue-700">SKU: <span className="font-medium">{formData.sku || 'Not set'}</span></div>
                                <div className="text-blue-700">Selling Price: <span className="font-medium">${formData.unit_price || '0.00'}</span></div>
                                <div className="text-blue-700">Stock: <span className="font-medium">{formData.current_stock || '0'} units</span></div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Delete Confirmation Modal - MOVED INSIDE Products component
    const DeleteModal = ({ isOpen, onClose, onConfirm, product, loading }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Delete Product</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600">
                            Are you sure you want to delete <span className="font-semibold">{product?.name}</span>?
                        </p>
                        <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => onConfirm(product?.id)}
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete Product'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading && products.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                        <p className="text-gray-500 mt-1">Manage your inventory products</p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)}>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add New Product
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 border-b">
                        <form onSubmit={handleSearch} className="flex items-center space-x-4">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products by name or SKU..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Search
                            </button>
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                                >
                                    Clear
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Selling Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.length > 0 ? (
                                    products.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                    {product.sku}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </div>
                                                {product.description && (
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">
                                                        {product.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600">
                                                    {product.category || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(product.unit_price)}
                                                </div>
                                                {product.cost_price && (
                                                    <div className="text-xs text-gray-500">
                                                        Cost: {formatCurrency(product.cost_price)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`text-sm font-medium ${
                                                        product.current_stock <= product.minimum_stock 
                                                            ? 'text-red-600' 
                                                            : 'text-gray-900'
                                                    }`}>
                                                        {product.current_stock}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        / min {product.minimum_stock}
                                                    </span>
                                                </div>
                                                {product.current_stock <= product.minimum_stock && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                                        Low Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {product.location || '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit Product"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(product)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete Product"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <CubeIcon className="w-12 h-12 text-gray-400 mb-4" />
                                                <p className="text-gray-500 mb-4">No products found</p>
                                                <Button onClick={() => setShowAddModal(true)}>
                                                    <PlusIcon className="w-4 h-4 mr-2" />
                                                    Add Your First Product
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg">
                                    {pagination.page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Product Modal */}
            <ProductModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddProduct}
                loading={modalLoading}
            />

            {/* Edit Product Modal */}
            <ProductModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                }}
                product={selectedProduct}
                onSave={handleEditProduct}
                loading={modalLoading}
            />

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedProduct(null);
                }}
                onConfirm={handleDeleteProduct}
                product={selectedProduct}
                loading={modalLoading}
            />
        </DashboardLayout>
    );
}