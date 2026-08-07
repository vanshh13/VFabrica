import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { SupplierGateway } from './SupplierGateway';
import { getSupplierOrders, updateSupplierOrderStatus } from '../../services/supplierService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { formatUnitQuantity } from '../../utils/productUtils';
import {
    Package,
    Search,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Clock,
    Truck,
    XCircle,
    ArrowRight,
    IndianRupee,
    Calendar,
    MapPin,
    RefreshCw,
    SlidersHorizontal,
    ChevronsLeft,
    ChevronsRight,
    Shield
} from 'lucide-react';

const STATUSES = ['Pending', 'Accepted', 'Preparing', 'Ready for Dispatch', 'Completed'];
const NEXT_STATUS = {
    Pending: 'Accepted',
    Accepted: 'Preparing',
    Preparing: 'Ready for Dispatch',
    'Ready for Dispatch': 'Completed',
    Ready: 'Completed'
};

const STATUS_CONFIG = {
    Pending: { color: 'amber', icon: Clock, bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    Accepted: { color: 'blue', icon: CheckCircle2, bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    Preparing: { color: 'purple', icon: Package, bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    'Ready for Dispatch': { color: 'emerald', icon: Truck, bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    Ready: { color: 'emerald', icon: Truck, bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    Completed: { color: 'green', icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-950/60', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
    Cancelled: { color: 'red', icon: XCircle, bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' }
};

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
}

function Pagination({ page, totalPages, totalItems, limit, onPageChange }) {
    if (totalPages <= 1) return null;

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, totalItems);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-6 py-4 mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Showing <span className="font-bold text-gray-900 dark:text-white">{startItem}-{endItem}</span> of{' '}
                    <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> orders
                </div>

                <div className="flex items-center gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        className="px-3 py-1.5 text-xs font-bold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                    </button>
                    <span className="text-xs font-bold text-gray-900 dark:text-white px-2">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                        className="px-3 py-1.5 text-xs font-bold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function OrdersInner() {
    const [orders, setOrders] = React.useState([]);
    const [pagination, setPagination] = React.useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1
    });
    const [page, setPage] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [updating, setUpdating] = React.useState(null);
    const [filter, setFilter] = React.useState('all');
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [msg, setMsg] = React.useState({ text: '', ok: true });

    const showMsg = (text, ok = true) => {
        setMsg({ text, ok });
        setTimeout(() => setMsg({ text: '', ok: true }), 3000);
    };

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const load = React.useCallback(async (targetPage = 1, currentFilter = filter) => {
        setLoading(true);
        try {
            const filtersList = [];
            if (currentFilter !== 'all') {
                filtersList.push({ field: 'status', operator: 'equals', value: currentFilter });
            }
            if (debouncedSearch) {
                filtersList.push({ field: 'order_number', operator: 'contains', value: debouncedSearch });
            }

            const res = await getSupplierOrders({
                page: targetPage,
                limit: 10,
                filters: filtersList,
                sort: [{ field: 'placed_at', order: 'desc' }]
            });

            const dataPayload = res.data;
            const rawOrderList = Array.isArray(dataPayload) ? dataPayload : (dataPayload?.items || []);
            const orderList = rawOrderList.map(o => ({
                ...o,
                status: (o.status && String(o.status).trim().toLowerCase() === 'ready') ? 'Ready for Dispatch' : o.status
            }));
            const meta = dataPayload?.pagination || {
                page: targetPage,
                limit: 10,
                totalItems: orderList.length,
                totalPages: Math.ceil(orderList.length / 10) || 1
            };

            setOrders(orderList);
            setPagination(meta);
            setPage(targetPage);
        } catch (e) {
            showMsg(e?.message || 'Failed to load orders', false);
        } finally {
            setLoading(false);
        }
    }, [filter, debouncedSearch]);

    React.useEffect(() => {
        load(1, filter);
    }, [filter, debouncedSearch]);

    useWebSocket({
        ORDER_UPDATED: () => {
            load(page, filter);
            showMsg('⚡ Real-time update: Orders updated', true);
        },
        INVENTORY_UPDATED: () => {
            load(page, filter);
        }
    });

    const handleStatus = async (orderId, newStatus) => {
        setUpdating(orderId);
        try {
            await updateSupplierOrderStatus(orderId, newStatus);
            showMsg(`Order updated to "${newStatus}" successfully!`);
            await load(page, filter);
        } catch (e) {
            showMsg(e?.message || 'Update failed', false);
        } finally {
            setUpdating(null);
        }
    };

    const stats = {
        total: pagination.totalItems,
        pending: orders.filter(o => o.status === 'Pending').length,
        processing: orders.filter(o => ['Accepted', 'Preparing'].includes(o.status)).length,
        ready: orders.filter(o => o.status === 'Ready for Dispatch').length,
    };

    return (
        <>
            {/* Header Banner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                Order Fulfillment Center
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Process buyer purchase orders and update dispatch status
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500">Total</p>
                            <p className="text-sm font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500">Pending</p>
                            <p className="text-sm font-extrabold text-amber-600">{stats.pending}</p>
                        </div>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500">Processing</p>
                            <p className="text-sm font-extrabold text-indigo-600">{stats.processing}</p>
                        </div>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500">Ready</p>
                            <p className="text-sm font-extrabold text-emerald-600">{stats.ready}</p>
                        </div>
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

            {/* Live Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Live search order numbers..."
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap pt-1">
                        {['all', ...STATUSES].map(s => {
                            const isActive = filter === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => { setFilter(s); setPage(1); }}
                                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                                            : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {s === 'all' ? 'All Orders' : s}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl h-36 border border-gray-200 dark:border-gray-700" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {filter === 'all' ? 'No Orders Placed Yet' : `No ${filter} Orders`}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        When buyers place orders for your fabric listings, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(o => {
                        const next = NEXT_STATUS[o.status];
                        const isUpdating = updating === o.id;

                        return (
                            <div
                                key={o.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                                    #{o.order_number || o.id?.slice(0, 8).toUpperCase()}
                                                </h3>
                                                <StatusBadge status={o.status} />
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                                    ₹{(parseFloat(o.grand_total) > 0 ? parseFloat(o.grand_total) : (parseFloat(o.subtotal) || 0)).toLocaleString('en-IN')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(o.placed_at || o.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                {o.shipping_address_line_1 && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                                        {o.shipping_address_line_1}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Summary */}
                                {o.items && o.items.length > 0 && (
                                    <div className="my-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
                                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">Items ({o.items.length})</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {o.items.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <div>
                                                        <span className="font-bold text-gray-900 dark:text-white block">
                                                            {item.product_name || 'Fabric Item'} <span className="text-gray-400 font-normal">({formatUnitQuantity(item.quantity, item.unit || item.unit_name || 'Meter')})</span>
                                                        </span>
                                                    </div>
                                                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                                        ₹{Number(item.total_price || (item.quantity * item.unit_price) || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                                    {next && (
                                        <button
                                            onClick={() => handleStatus(o.id, next)}
                                            disabled={isUpdating}
                                            className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-xs hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                    Mark as {next}
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {o.status === 'Pending' && (
                                        <button
                                            onClick={() => handleStatus(o.id, 'Cancelled')}
                                            disabled={isUpdating}
                                            className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 rounded-xl transition-colors cursor-pointer"
                                        >
                                            Cancel Order
                                        </button>
                                    )}

                                    {o.status === 'Completed' && (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Order Fulfilled
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <Pagination
                        page={page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        limit={pagination.limit}
                        onPageChange={load}
                    />
                </div>
            )}
        </>
    );
}

export function SupplierOrdersPage() {
    return (
        <SupplierGateway>
            {() => (
                <AppShell>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <OrdersInner />
                    </div>
                </AppShell>
            )}
        </SupplierGateway>
    );
}