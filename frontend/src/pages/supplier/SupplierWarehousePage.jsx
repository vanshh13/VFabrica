import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { SupplierGateway } from './SupplierGateway';
import {
    getWarehouses, getWarehouseDashboard, createWarehouse,
    updateWarehouse, deleteWarehouse, transferStock, getInventory
} from '../../services/inventoryService';
import { getSupplierProfile } from '../../services/supplierService';
import {
    Package,
    Warehouse,
    ArrowRightLeft,
    Plus,
    Edit3,
    Trash2,
    X,
    Save,
    Search,
    Building2,
    Phone,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    AlertCircle,
    Layers,
    Box,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal
} from 'lucide-react';

const STAT_CARDS = [
    { key: 'total_products', label: 'Total SKUs', icon: Package, color: 'indigo' },
    { key: 'total_stock', label: 'Total Stock', icon: Layers, color: 'purple' },
    { key: 'reserved_stock', label: 'Reserved', icon: Box, color: 'amber' },
    { key: 'available_stock', label: 'Available', icon: CheckCircle2, color: 'emerald' },
    { key: 'low_stock', label: 'Low Stock', icon: AlertTriangle, color: 'rose' },
    { key: 'out_of_stock', label: 'Out of Stock', icon: AlertCircle, color: 'rose' },
];

function StatCard({ label, value, icon: Icon, color }) {
    const colorMap = {
        indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
        purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {label}
                </span>
                <div className={`w-9 h-9 rounded-xl ${colorMap[color]} border flex items-center justify-center`}>
                    <Icon className="w-4.5 h-4.5" />
                </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {Number(value ?? 0).toLocaleString('en-IN')}
            </p>
        </div>
    );
}

function WarehouseInner() {
    const [stats, setStats] = React.useState(null);
    const [warehouses, setWarehouses] = React.useState([]);
    const [inventory, setInventory] = React.useState([]);
    const [addresses, setAddresses] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [msg, setMsg] = React.useState({ text: '', ok: true });
    const [showForm, setShowForm] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [form, setForm] = React.useState({
        name: '',
        contactNumber: '',
        isDefault: false,
        addressId: '',
        isNewAddress: false,
        newAddressLine1: '',
        newLandmark: '',
        newZipcode: ''
    });
    const [showTransfer, setShowTransfer] = React.useState(false);
    const [transfer, setTransfer] = React.useState({ fromInventoryId: '', toWarehouseId: '', quantity: '' });
    const [saving, setSaving] = React.useState(false);
    const [tab, setTab] = React.useState('warehouses');

    // Warehouse filters
    const [warehouseSearch, setWarehouseSearch] = React.useState('');
    const [warehouseSort, setWarehouseSort] = React.useState('name');
    const [warehousePage, setWarehousePage] = React.useState(1);
    const [warehouseLimit] = React.useState(6);

    // Stock filters
    const [stockSearch, setStockSearch] = React.useState('');
    const [stockStatusFilter, setStockStatusFilter] = React.useState('all');
    const [stockWarehouseFilter, setStockWarehouseFilter] = React.useState('all');
    const [stockSort, setStockSort] = React.useState('name');
    const [stockPage, setStockPage] = React.useState(1);
    const [stockLimit] = React.useState(10);
    const [showStockFilters, setShowStockFilters] = React.useState(false);

    const showMsg = (text, ok = true) => {
        setMsg({ text, ok });
        setTimeout(() => setMsg({ text: '', ok: true }), 3500);
    };

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, invRes, profRes] = await Promise.all([
                getWarehouseDashboard(),
                getInventory({ limit: 200 }),
                getSupplierProfile().catch(() => null)
            ]);
            setStats(dashRes.data?.stats);
            setWarehouses(dashRes.data?.warehouses || []);
            setInventory(invRes.data?.inventory || []);
            if (profRes?.data?.addresses) {
                setAddresses(profRes.data.addresses);
            }
        } catch (e) {
            showMsg(e?.message || 'Load failed', false);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { load(); }, [load]);

    const openNew = () => {
        setEditing(null);
        const initialAddrId = addresses[0]?.id || '';
        setForm({
            name: '',
            contactNumber: '',
            isDefault: false,
            addressId: initialAddrId,
            isNewAddress: addresses.length === 0,
            newAddressLine1: '',
            newLandmark: '',
            newZipcode: ''
        });
        setShowForm(true);
    };

    const openEdit = (w) => {
        setEditing(w);
        setForm({
            name: w.name,
            contactNumber: w.contact_number || '',
            isDefault: !!w.is_default,
            addressId: w.address_id || '',
            isNewAddress: false,
            newAddressLine1: '',
            newLandmark: '',
            newZipcode: ''
        });
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                contactNumber: form.contactNumber,
                isDefault: form.isDefault
            };

            if (form.isNewAddress) {
                if (!form.newAddressLine1.trim()) {
                    showMsg('Please enter Address Line 1 for the new address', false);
                    setSaving(false);
                    return;
                }
                payload.newAddress = {
                    addressLine1: form.newAddressLine1.trim(),
                    landmark: form.newLandmark.trim(),
                    zipcode: form.newZipcode.trim()
                };
            } else if (form.addressId) {
                payload.addressId = form.addressId;
            }

            if (editing) await updateWarehouse(editing.id, payload);
            else await createWarehouse(payload);
            showMsg(editing ? 'Warehouse updated successfully!' : 'Warehouse created successfully!');
            setShowForm(false);
            await load();
        } catch (err) {
            showMsg(err?.response?.data?.error || 'Save failed', false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (w) => {
        if (!window.confirm(`Delete warehouse "${w.name}"? This action cannot be undone.`)) return;
        try {
            await deleteWarehouse(w.id);
            showMsg('Warehouse deleted successfully');
            await load();
        } catch (e) {
            showMsg('Delete failed', false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await transferStock({
                fromInventoryId: transfer.fromInventoryId,
                toWarehouseId: transfer.toWarehouseId,
                quantity: parseInt(transfer.quantity)
            });
            showMsg('Stock transferred successfully!');
            setShowTransfer(false);
            setTransfer({ fromInventoryId: '', toWarehouseId: '', quantity: '' });
            await load();
        } catch (err) {
            showMsg(err?.response?.data?.error || 'Transfer failed', false);
        } finally {
            setSaving(false);
        }
    };

    const getFilteredWarehouses = () => {
        let filtered = [...warehouses];

        if (warehouseSearch) {
            filtered = filtered.filter(w =>
                w.name?.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
                w.contact_number?.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
                w.address_line_1?.toLowerCase().includes(warehouseSearch.toLowerCase())
            );
        }

        switch (warehouseSort) {
            case 'name':
                filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name-desc':
                filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
                break;
            default:
                break;
        }

        return filtered;
    };

    const filteredWarehouses = getFilteredWarehouses();
    const totalWarehousePages = Math.ceil(filteredWarehouses.length / warehouseLimit);
    const paginatedWarehouses = filteredWarehouses.slice(
        (warehousePage - 1) * warehouseLimit,
        warehousePage * warehouseLimit
    );

    const getFilteredStock = () => {
        let filtered = [...inventory];

        if (stockSearch) {
            filtered = filtered.filter(item =>
                item.product_name?.toLowerCase().includes(stockSearch.toLowerCase()) ||
                item.sku?.toLowerCase().includes(stockSearch.toLowerCase()) ||
                item.warehouse_name?.toLowerCase().includes(stockSearch.toLowerCase())
            );
        }

        if (stockStatusFilter !== 'all') {
            filtered = filtered.filter(item => item.stock_status === stockStatusFilter);
        }

        if (stockWarehouseFilter !== 'all') {
            filtered = filtered.filter(item => item.warehouse_name === stockWarehouseFilter);
        }

        switch (stockSort) {
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

    const filteredStock = getFilteredStock();
    const totalStockPages = Math.ceil(filteredStock.length / stockLimit);
    const paginatedStock = filteredStock.slice(
        (stockPage - 1) * stockLimit,
        stockPage * stockLimit
    );

    const warehouseNames = [...new Set(inventory.map(item => item.warehouse_name).filter(Boolean))];

    React.useEffect(() => { setWarehousePage(1); }, [warehouseSearch, warehouseSort]);
    React.useEffect(() => { setStockPage(1); }, [stockSearch, stockStatusFilter, stockWarehouseFilter, stockSort]);

    const tabs = [
        { id: 'warehouses', label: 'Warehouse Facilities', icon: Building2 },
        { id: 'stock', label: 'Facility Stock Overview', icon: Package }
    ];

    const Pagination = ({ page, totalPages, totalItems, onPageChange, limit }) => (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Showing {Math.min((page - 1) * limit + 1, totalItems)}-{Math.min(page * limit, totalItems)} of {totalItems} items
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

    return (
        <>
            {/* Header Banner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                            <Warehouse className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                Warehouse & Storage Facilities
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Manage storage locations, primary dispatch hubs, and inter-facility stock transfers
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setShowTransfer(true); setShowForm(false); }}
                            className="px-4 py-2.5 text-xs sm:text-sm font-bold bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Transfer Stock
                        </button>
                        <button
                            onClick={() => { openNew(); setShowTransfer(false); }}
                            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Add Warehouse
                        </button>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
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

            {/* Dashboard KPI Stats */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {STAT_CARDS.map(s => (
                        <StatCard key={s.key} label={s.label} value={stats[s.key]} icon={s.icon} color={s.color} />
                    ))}
                </div>
            )}

            {/* Tab Navigation */}
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

            {/* Content Views */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl h-28 border border-gray-200 dark:border-gray-700" />
                    ))}
                </div>
            ) : tab === 'warehouses' ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search warehouses by name, phone, or location..."
                                    value={warehouseSearch}
                                    onChange={(e) => setWarehouseSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <select
                                value={warehouseSort}
                                onChange={(e) => setWarehouseSort(e.target.value)}
                                className="px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="name">Name: A-Z</option>
                                <option value="name-desc">Name: Z-A</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {filteredWarehouses.length === 0 ? (
                        <div className="text-center py-16 p-8">
                            <Warehouse className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {warehouses.length === 0 ? 'No Warehouse Facilities Added' : 'No Matching Warehouses'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                                Create primary hubs and storage locations for managing your fabric stock.
                            </p>
                            {warehouses.length === 0 && (
                                <button
                                    onClick={openNew}
                                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:from-indigo-700 transition-all inline-flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Warehouse
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                {paginatedWarehouses.map(w => (
                                    <div
                                        key={w.id}
                                        className="group p-5 hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                                    <Warehouse className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                                            {w.name}
                                                        </h3>
                                                        {w.is_default && (
                                                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                                Default Dispatch Facility
                                                            </span>
                                                        )}
                                                    </div>
                                                    {w.contact_number && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            {w.contact_number}
                                                        </div>
                                                    )}
                                                    {w.address_line_1 && (
                                                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-indigo-500" />
                                                            <span>{w.address_line_1}{w.zipcode ? ` (${w.zipcode})` : ''}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEdit(w)}
                                                    className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Warehouse"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(w)}
                                                    className="p-1.5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Warehouse"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalWarehousePages > 1 && (
                                <Pagination
                                    page={warehousePage}
                                    totalPages={totalWarehousePages}
                                    totalItems={filteredWarehouses.length}
                                    onPageChange={setWarehousePage}
                                    limit={warehouseLimit}
                                />
                            )}
                        </>
                    )}
                </div>
            ) : (
                /* Stock View */
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by product name, SKU, or warehouse..."
                                    value={stockSearch}
                                    onChange={(e) => setStockSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={stockSort}
                                    onChange={(e) => setStockSort(e.target.value)}
                                    className="px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="name">Name: A-Z</option>
                                    <option value="name-desc">Name: Z-A</option>
                                    <option value="quantity-high">Quantity: High to Low</option>
                                    <option value="quantity-low">Quantity: Low to High</option>
                                    <option value="available-high">Available: High to Low</option>
                                    <option value="available-low">Available: Low to High</option>
                                </select>
                                <button
                                    onClick={() => setShowStockFilters(!showStockFilters)}
                                    className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        showStockFilters || stockStatusFilter !== 'all' || stockWarehouseFilter !== 'all'
                                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                            : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    Filters
                                </button>
                            </div>
                        </div>

                        {showStockFilters && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Status:</span>
                                    <select
                                        value={stockStatusFilter}
                                        onChange={(e) => setStockStatusFilter(e.target.value)}
                                        className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="in_stock">In Stock</option>
                                        <option value="low_stock">Low Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Facility:</span>
                                    <select
                                        value={stockWarehouseFilter}
                                        onChange={(e) => setStockWarehouseFilter(e.target.value)}
                                        className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg"
                                    >
                                        <option value="all">All Facilities</option>
                                        {warehouseNames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {filteredStock.length === 0 ? (
                        <div className="text-center py-16 p-8">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                No Matching Inventory
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Try adjusting your search query or status filters.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:grid md:grid-cols-[1.5fr,1fr,1fr,1fr,100px] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div>Product / SKU</div>
                                <div className="text-center">Total Stock</div>
                                <div className="text-center">Reserved</div>
                                <div className="text-center">Available</div>
                                <div className="text-center">Status</div>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                {paginatedStock.map(item => {
                                    const status = item.stock_status;
                                    const statusConfig = {
                                        out_of_stock: { label: 'Out of Stock', color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
                                        low_stock: { label: 'Low Stock', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
                                        in_stock: { label: 'In Stock', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' }
                                    };
                                    const config = statusConfig[status] || statusConfig.in_stock;

                                    return (
                                        <div key={item.id} className="p-4 sm:p-5 md:px-6 md:py-4 hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors">
                                            <div className="hidden md:grid md:grid-cols-[1.5fr,1fr,1fr,1fr,100px] gap-4 items-center">
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
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full border ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mobile View */}
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
                                                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-700/60">
                                                    <span>Avail: <strong className="text-emerald-600 dark:text-emerald-400">{item.available_quantity || 0}</strong></span>
                                                    <span>Total: <strong>{item.quantity || 0}</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {totalStockPages > 1 && (
                                <Pagination
                                    page={stockPage}
                                    totalPages={totalStockPages}
                                    totalItems={filteredStock.length}
                                    onPageChange={setStockPage}
                                    limit={stockLimit}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Warehouse Form Modal */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto border border-gray-200 dark:border-gray-700"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                                    <Warehouse className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                                        {editing ? 'Edit Storage Facility' : 'Add New Warehouse'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Configure dispatch facility details and operational contacts
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Warehouse Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g., Surat Central Hub, Bhiwandi Mill Storage"
                                    required
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Contact Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={form.contactNumber}
                                    onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))}
                                    placeholder="+91 9876543210"
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Location Address
                                </label>
                                <select
                                    value={form.isNewAddress ? 'NEW' : form.addressId}
                                    onChange={e => {
                                        if (e.target.value === 'NEW') {
                                            setForm(p => ({ ...p, isNewAddress: true, addressId: '' }));
                                        } else {
                                            setForm(p => ({ ...p, isNewAddress: false, addressId: e.target.value }));
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select an existing address</option>
                                    {addresses.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.address_line_1}{a.landmark ? `, ${a.landmark}` : ''}{a.zipcode ? ` (${a.zipcode})` : ''} {a.is_primary ? '★' : ''}
                                        </option>
                                    ))}
                                    <option value="NEW">+ Add New Address</option>
                                </select>
                            </div>

                            {form.isNewAddress && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl space-y-3 border border-gray-200 dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">New Facility Address</h4>
                                    <div>
                                        <input
                                            type="text"
                                            value={form.newAddressLine1}
                                            onChange={e => setForm(p => ({ ...p, newAddressLine1: e.target.value }))}
                                            placeholder="Address Line 1"
                                            required={form.isNewAddress}
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={form.newLandmark}
                                            onChange={e => setForm(p => ({ ...p, newLandmark: e.target.value }))}
                                            placeholder="Landmark"
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={form.newZipcode}
                                            onChange={e => setForm(p => ({ ...p, newZipcode: e.target.value }))}
                                            placeholder="Pincode"
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl cursor-pointer border border-gray-200 dark:border-gray-700">
                                <input
                                    type="checkbox"
                                    checked={form.isDefault}
                                    onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Default Warehouse Facility</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Newly assigned inventory will default to this hub</p>
                                </div>
                            </label>

                            <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
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
                                    {saving ? 'Saving...' : editing ? 'Update Warehouse' : 'Save Warehouse'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Stock Modal */}
            {showTransfer && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
                    onClick={() => setShowTransfer(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto border border-gray-200 dark:border-gray-700"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                                    <ArrowRightLeft className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                                        Transfer Stock Inter-Facility
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Move inventory between active warehouse locations
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTransfer(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleTransfer} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    From Inventory Item <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={transfer.fromInventoryId}
                                    onChange={e => setTransfer(p => ({ ...p, fromInventoryId: e.target.value }))}
                                    required
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select inventory record</option>
                                    {inventory.map(inv => (
                                        <option key={inv.id} value={inv.id}>
                                            {inv.product_name} — {inv.sku} ({inv.warehouse_name}) [{inv.available_quantity} avail]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    To Destination Warehouse <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={transfer.toWarehouseId}
                                    onChange={e => setTransfer(p => ({ ...p, toWarehouseId: e.target.value }))}
                                    required
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select destination facility</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Transfer Quantity <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={transfer.quantity}
                                    onChange={e => setTransfer(p => ({ ...p, quantity: e.target.value }))}
                                    placeholder="Enter units to move"
                                    required
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowTransfer(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:from-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                    {saving ? 'Transferring...' : 'Complete Transfer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export function SupplierWarehousePage() {
    return (
        <SupplierGateway>
            {() => (
                <AppShell>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <WarehouseInner />
                    </div>
                </AppShell>
            )}
        </SupplierGateway>
    );
}