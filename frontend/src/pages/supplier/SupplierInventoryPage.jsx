import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { SupplierGateway } from './SupplierGateway';
import { getInventory, assignInventory, adjustStock, getInventoryTransactions } from '../../services/inventoryService';
import { getWarehouses } from '../../services/inventoryService';
import { getSupplierProducts } from '../../services/supplierService';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
    Package,
    Plus,
    Search,
    Edit3,
    ArrowRightLeft,
    X,
    Save,
    Filter,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Clock,
    Warehouse,
    Box,
    Layers,
    Building2,
    Check
} from 'lucide-react';

function StockStatusBadge({ status }) {
    const config = {
        out_of_stock: { color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', label: 'Out of Stock', icon: AlertCircle },
        low_stock: { color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', label: 'Low Stock', icon: AlertTriangle },
        in_stock: { color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', label: 'In Stock', icon: CheckCircle2 }
    };
    const { color, label, icon: Icon } = config[status] || config.in_stock;

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

const ADJUST_TYPES = [
    { value: 'IN', label: 'Add Stock (IN)', color: 'emerald' },
    { value: 'ADJUSTMENT', label: 'Adjustment', color: 'indigo' },
    { value: 'DAMAGED', label: 'Mark Damaged', color: 'rose' },
    { value: 'RETURN', label: 'Return', color: 'amber' },
];

function InventoryInner() {
    const [inventory, setInventory] = React.useState([]);
    const [warehouses, setWarehouses] = React.useState([]);
    const [products, setProducts] = React.useState([]);
    const [transactions, setTransactions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [txLoading, setTxLoading] = React.useState(false);
    const [msg, setMsg] = React.useState({ text: '', ok: true });

    // Filters
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [lowStockOnly, setLowStockOnly] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [warehouseFilter, setWarehouseFilter] = React.useState('all');
    const [sortBy, setSortBy] = React.useState('name');
    const [showFilters, setShowFilters] = React.useState(false);

    // Tab
    const [tab, setTab] = React.useState('stock');

    // Modals
    const [showAssign, setShowAssign] = React.useState(false);
    const [showAdjust, setShowAdjust] = React.useState(false);
    const [selectedInv, setSelectedInv] = React.useState(null);
    const [saving, setSaving] = React.useState(false);

    // Forms
    const [pickerSidebar, setPickerSidebar] = React.useState(null);
    const [pickerSearch, setPickerSearch] = React.useState('');

    const [assignForm, setAssignForm] = React.useState({
        warehouseId: '',
        productVariantId: '',
        quantity: '',
        reorderLevel: '10'
    });
    const [adjustForm, setAdjustForm] = React.useState({
        quantityDelta: '',
        transactionType: 'IN',
        remarks: ''
    });

    // Pagination
    const [pagination, setPagination] = React.useState({
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 1
    });

    const [txPagination, setTxPagination] = React.useState({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 1
    });

    const showMsg = (text, ok = true) => {
        setMsg({ text, ok });
        setTimeout(() => setMsg({ text: '', ok: true }), 3500);
    };

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const loadInventory = React.useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const limit = 10;
            const offset = (page - 1) * limit;
            const res = await getInventory({ search: debouncedSearch, lowStockOnly, limit, offset });
            setInventory(res.data?.inventory || []);
            setPagination(res.data?.pagination || { page, limit, total: 0, total_pages: 1 });
        } catch (e) {
            showMsg('Failed to load inventory', false);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, lowStockOnly]);

    const loadMeta = React.useCallback(async () => {
        try {
            const [wRes, pRes] = await Promise.all([
                getWarehouses(),
                getSupplierProducts()
            ]);
            setWarehouses(wRes.data || []);
            const pList = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.items || []);
            setProducts(pList);
        } catch { }
    }, []);

    const loadTransactions = React.useCallback(async (page = 1) => {
        setTxLoading(true);
        try {
            const limit = 20;
            const offset = (page - 1) * limit;
            const res = await getInventoryTransactions({ limit, offset });
            setTransactions(res.data?.transactions || []);
            setTxPagination(res.data?.pagination || { page, limit, total: 0, total_pages: 1 });
        } catch { } finally {
            setTxLoading(false);
        }
    }, []);

    React.useEffect(() => { loadMeta(); }, [loadMeta]);
    React.useEffect(() => { loadInventory(1); }, [debouncedSearch, lowStockOnly]);
    React.useEffect(() => { if (tab === 'transactions') loadTransactions(1); }, [tab]);

    useWebSocket({
        INVENTORY_UPDATED: () => {
            loadInventory(pagination.page || 1);
            if (tab === 'transactions') loadTransactions(txPagination.page || 1);
            showMsg('⚡ Real-time update: Inventory synced', true);
        },
        ORDER_UPDATED: () => {
            loadInventory(pagination.page || 1);
            if (tab === 'transactions') loadTransactions(txPagination.page || 1);
        }
    });

    const getFilteredInventory = () => {
        let filtered = [...inventory];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => item.stock_status === statusFilter);
        }

        if (warehouseFilter !== 'all') {
            filtered = filtered.filter(item => item.warehouse_name === warehouseFilter);
        }

        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
                break;
            case 'name-desc':
                filtered.sort((a, b) => (b.product_name || '').localeCompare(a.product_name || ''));
                break;
            case 'quantity-high':
                filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
                break;
            case 'quantity-low':
                filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
                break;
            case 'available-high':
                filtered.sort((a, b) => (b.available_quantity || 0) - (a.available_quantity || 0));
                break;
            case 'available-low':
                filtered.sort((a, b) => (a.available_quantity || 0) - (b.available_quantity || 0));
                break;
            default:
                break;
        }

        return filtered;
    };

    const filteredInventory = getFilteredInventory();
    const warehouseNames = [...new Set(inventory.map(item => item.warehouse_name).filter(Boolean))];

    const handleAssign = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await assignInventory({
                warehouseId: assignForm.warehouseId,
                productVariantId: assignForm.productVariantId,
                quantity: parseInt(assignForm.quantity),
                reorderLevel: parseInt(assignForm.reorderLevel || 10)
            });
            showMsg('Inventory assigned successfully!');
            setShowAssign(false);
            setAssignForm({ warehouseId: '', productVariantId: '', quantity: '', reorderLevel: '10' });
            loadInventory(pagination.page);
        } catch (err) {
            showMsg(err?.response?.data?.error || 'Assignment failed', false);
        } finally {
            setSaving(false);
        }
    };

    const openAdjust = (inv) => {
        setSelectedInv(inv);
        setAdjustForm({ quantityDelta: '', transactionType: 'IN', remarks: '' });
        setShowAdjust(true);
        setShowAssign(false);
    };

    const handleAdjust = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const qty = parseInt(adjustForm.quantityDelta);
            const delta = ['DAMAGED', 'OUT'].includes(adjustForm.transactionType) ? -Math.abs(qty) : Math.abs(qty);
            await adjustStock({
                inventoryId: selectedInv.id,
                quantityDelta: delta,
                transactionType: adjustForm.transactionType,
                remarks: adjustForm.remarks
            });
            showMsg('Stock adjusted successfully!');
            setShowAdjust(false);
            setSelectedInv(null);
            loadInventory(pagination.page);
        } catch (err) {
            showMsg(err?.response?.data?.error || 'Adjustment failed', false);
        } finally {
            setSaving(false);
        }
    };

    const Pagination = ({ page, totalPages, total, onPageChange }) => (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Page {page} of {totalPages} ({total} records)
            </span>
            <div className="flex items-center gap-2">
                <button
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>
                <span className="text-xs font-bold text-gray-900 dark:text-white px-2">
                    Page {page} of {totalPages}
                </span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    const tabs = [
        { id: 'stock', label: 'Stock Levels', icon: Box },
        { id: 'transactions', label: 'Movement History', icon: Clock }
    ];

    const variantStockMap = React.useMemo(() => {
        const map = {};
        inventory.forEach(item => {
            const vId = String(item.product_variant_id);
            if (!map[vId]) {
                map[vId] = 0;
            }
            map[vId] += Number(item.available_quantity !== undefined ? item.available_quantity : (item.quantity || 0));
        });
        return map;
    }, [inventory]);

    const allVariants = React.useMemo(() => {
        return products.flatMap(p => {
            const vars = p.variants && p.variants.length > 0
                ? p.variants
                : (p.product_variants && p.product_variants.length > 0 ? p.product_variants : []);

            if (vars.length === 0) {
                const stock = variantStockMap[String(p.id)] || p.inventory?.availableQuantity || 0;
                return [{
                    id: p.id,
                    sku: p.sku || `PROD-${String(p.id).slice(0, 6)}`,
                    price: p.basePrice || p.base_price || p.price || 0,
                    product_name: p.name,
                    brand: p.brand,
                    name: 'Standard Variant',
                    available_quantity: stock
                }];
            }
            return vars.map(v => ({
                ...v,
                product_name: p.name,
                brand: p.brand,
                available_quantity: variantStockMap[String(v.id)] !== undefined
                    ? variantStockMap[String(v.id)]
                    : (v.available_quantity || v.availableQuantity || 0)
            }));
        });
    }, [products, variantStockMap]);

    const selectedWarehouseObj = React.useMemo(() => {
        if (!assignForm.warehouseId) return null;
        return warehouses.find(w => String(w.id) === String(assignForm.warehouseId)) || null;
    }, [warehouses, assignForm.warehouseId]);

    const selectedVariantObj = React.useMemo(() => {
        if (!assignForm.productVariantId) return null;
        return allVariants.find(v => String(v.id) === String(assignForm.productVariantId)) || null;
    }, [allVariants, assignForm.productVariantId]);

    const filteredWarehousesForSidebar = React.useMemo(() => {
        if (!pickerSearch.trim()) return warehouses;
        const q = pickerSearch.toLowerCase();
        return warehouses.filter(w =>
            (w.name || '').toLowerCase().includes(q) ||
            (w.address || '').toLowerCase().includes(q) ||
            (w.city || '').toLowerCase().includes(q)
        );
    }, [warehouses, pickerSearch]);

    const filteredVariantsForSidebar = React.useMemo(() => {
        if (!pickerSearch.trim()) return allVariants;
        const q = pickerSearch.toLowerCase();
        return allVariants.filter(v =>
            (v.product_name || '').toLowerCase().includes(q) ||
            (v.sku || '').toLowerCase().includes(q) ||
            (v.brand || '').toLowerCase().includes(q)
        );
    }, [allVariants, pickerSearch]);

    return (
        <>
            {/* Header Banner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                            <Box className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                Inventory Control & Stock Audit
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Monitor real-time warehouse stock, reorder levels, and inventory adjustments
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                            {pagination.total} Stock Records
                        </span>
                        <button
                            onClick={() => { setShowAssign(true); setShowAdjust(false); }}
                            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Assign Stock
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast Message */}
            {msg.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                    msg.ok
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                    {msg.ok ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-xs sm:text-sm font-semibold">{msg.text}</p>
                </div>
            )}

            {/* Tab Bar */}
            <div className="flex gap-2 mb-6">
                {tabs.map(t => {
                    const TabIcon = t.icon;
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <TabIcon className="w-4 h-4" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab 1: Stock View */}
            {tab === 'stock' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Live search by fabric, SKU, or warehouse..."
                                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="name">Name: A-Z</option>
                                    <option value="name-desc">Name: Z-A</option>
                                    <option value="quantity-high">Stock: High to Low</option>
                                    <option value="quantity-low">Stock: Low to High</option>
                                    <option value="available-high">Available: High to Low</option>
                                </select>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        showFilters || statusFilter !== 'all' || warehouseFilter !== 'all' || lowStockOnly
                                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                            : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    Filters
                                </button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Status:</span>
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="in_stock">In Stock</option>
                                        <option value="low_stock">Low Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Warehouse:</span>
                                    <select
                                        value={warehouseFilter}
                                        onChange={e => setWarehouseFilter(e.target.value)}
                                        className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg"
                                    >
                                        <option value="all">All Facilities</option>
                                        {warehouseNames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={lowStockOnly}
                                        onChange={e => setLowStockOnly(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Low Stock Only</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-2xl h-16" />
                            ))}
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="text-center py-16 p-8">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {inventory.length === 0 ? 'No Inventory Stock Assigned' : 'No Matching Stock Items'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Assign inventory to storage facilities to start managing stock levels.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:grid md:grid-cols-[1.5fr,1fr,1fr,1fr,1.2fr,90px] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 z-10">
                                <div>Fabric / SKU</div>
                                <div className="text-center">Total Stock</div>
                                <div className="text-center">Reserved</div>
                                <div className="text-center">Available</div>
                                <div className="text-center">Status</div>
                                <div className="text-right">Actions</div>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                {filteredInventory.map(item => (
                                    <div key={item.id} className="p-4 sm:p-5 md:px-6 md:py-4 hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors">
                                        <div className="hidden md:grid md:grid-cols-[1.5fr,1fr,1fr,1fr,1.2fr,90px] gap-4 items-center">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                    SKU: {item.sku} · {item.warehouse_name}
                                                </p>
                                            </div>
                                            <div className="text-center font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm">
                                                {item.quantity || 0}
                                            </div>
                                            <div className="text-center font-extrabold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                                                {item.reserved_quantity || 0}
                                            </div>
                                            <div className="text-center font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                                                {item.available_quantity || 0}
                                            </div>
                                            <div className="flex justify-center">
                                                <StockStatusBadge status={item.stock_status} />
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => openAdjust(item)}
                                                    className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
                                                >
                                                    Adjust
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mobile View Card */}
                                        <div className="md:hidden space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        SKU: {item.sku} · {item.warehouse_name}
                                                    </p>
                                                </div>
                                                <StockStatusBadge status={item.stock_status} />
                                            </div>
                                            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                                <span>Avail: <strong className="text-emerald-600 dark:text-emerald-400">{item.available_quantity || 0}</strong></span>
                                                <button
                                                    onClick={() => openAdjust(item)}
                                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800"
                                                >
                                                    Adjust Stock
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {pagination.total_pages > 1 && (
                                <Pagination
                                    page={pagination.page}
                                    totalPages={pagination.total_pages}
                                    total={pagination.total}
                                    onPageChange={loadInventory}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Tab 2: Transactions */}
            {tab === 'transactions' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
                    {txLoading ? (
                        <div className="p-6 text-center text-xs font-bold text-gray-500">Loading Movement History...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-16 p-8">
                            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                No Stock Adjustments Found
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Adjustments and stock allocations will record here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="p-4 sm:px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                                        {tx.product_name}
                                                    </span>
                                                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                        {tx.transaction_type}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    SKU: {tx.sku} · {tx.warehouse_name} {tx.remarks ? `(${tx.remarks})` : ''}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <span className={`text-sm sm:text-base font-black ${
                                                    tx.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                }`}>
                                                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                                                </span>
                                                <p className="text-[10px] text-gray-400">
                                                    {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {txPagination.total_pages > 1 && (
                                <Pagination
                                    page={txPagination.page}
                                    totalPages={txPagination.total_pages}
                                    total={txPagination.total}
                                    onPageChange={loadTransactions}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Assign Inventory Modal */}
            {showAssign && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
                    onClick={() => setShowAssign(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto border border-gray-200 dark:border-gray-700"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                                        Assign Stock to Facility
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Allocate product variants to warehouse locations
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAssign(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssign} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Warehouse Facility <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={assignForm.warehouseId}
                                    onChange={e => setAssignForm(p => ({ ...p, warehouseId: e.target.value }))}
                                    required
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select Warehouse Hub</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Fabric Variant SKU <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={assignForm.productVariantId}
                                    onChange={e => setAssignForm(p => ({ ...p, productVariantId: e.target.value }))}
                                    required
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select Fabric Variant SKU</option>
                                    {allVariants.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.product_name} ({v.sku || 'No SKU'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Opening Stock Quantity <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={assignForm.quantity}
                                        onChange={e => setAssignForm(p => ({ ...p, quantity: e.target.value }))}
                                        placeholder="500"
                                        required
                                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Low Stock Alert Level
                                    </label>
                                    <input
                                        type="number"
                                        value={assignForm.reorderLevel}
                                        onChange={e => setAssignForm(p => ({ ...p, reorderLevel: e.target.value }))}
                                        placeholder="50"
                                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAssign(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:from-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Assigning...' : 'Save Stock Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjust Stock Modal */}
            {showAdjust && selectedInv && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
                    onClick={() => setShowAdjust(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto border border-gray-200 dark:border-gray-700"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                                        Adjust Stock — {selectedInv.product_name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Current Avail: <strong className="text-indigo-600 dark:text-indigo-400">{selectedInv.available_quantity || 0}</strong> ({selectedInv.warehouse_name})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAdjust(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdjust} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Adjustment Action Type
                                </label>
                                <select
                                    value={adjustForm.transactionType}
                                    onChange={e => setAdjustForm(p => ({ ...p, transactionType: e.target.value }))}
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {ADJUST_TYPES.map(at => (
                                        <option key={at.value} value={at.value}>{at.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Quantity Units <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={adjustForm.quantityDelta}
                                    onChange={e => setAdjustForm(p => ({ ...p, quantityDelta: e.target.value }))}
                                    placeholder="e.g. 50"
                                    required
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Reason / Audit Remarks
                                </label>
                                <input
                                    type="text"
                                    value={adjustForm.remarks}
                                    onChange={e => setAdjustForm(p => ({ ...p, remarks: e.target.value }))}
                                    placeholder="e.g. Received new shipment batch, Mill defect deduction"
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjust(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:from-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Apply Stock Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export function SupplierInventoryPage() {
    return (
        <SupplierGateway>
            {() => (
                <AppShell>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <InventoryInner />
                    </div>
                </AppShell>
            )}
        </SupplierGateway>
    );
}