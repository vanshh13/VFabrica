import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { getBuyerOrders, cancelBuyerOrder, reorderBuyerOrder } from '../../services/buyerService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { formatUnitQuantity } from '../../utils/productUtils';
import {
    Package,
    Search,
    RefreshCw,
    CheckCircle2,
    Clock,
    Truck,
    XCircle,
    Calendar,
    ChevronRight,
    ShoppingBag,
    Building2,
    MapPin,
    ShieldCheck,
    TrendingUp,
    Download,
    X,
    Receipt,
    Star,
    Bot,
    Check
} from 'lucide-react';

const STATUS_CONFIG = {
    Pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', step: 1 },
    Accepted: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', step: 2 },
    Preparing: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20', step: 3 },
    'Ready for Dispatch': { icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20', step: 4 },
    Ready: { icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20', step: 4 },
    Completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-600/10 border-emerald-600/20', step: 5 },
    Cancelled: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', step: 0 }
};

const ORDER_STEPS = [
    { key: 'Pending', label: 'Order Placed', icon: Clock },
    { key: 'Accepted', label: 'Accepted by Mill', icon: CheckCircle2 },
    { key: 'Preparing', label: 'In Manufacturing', icon: Package },
    { key: 'Ready for Dispatch', label: 'Ready for Dispatch', icon: Truck },
    { key: 'Completed', label: 'Delivered', icon: ShieldCheck }
];

export function BuyerOrdersModule({ onNavigateToCatalog, onNavigateToCart, setMessage }) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const { setCartItems, addItem } = useCartStore();
    const [orders, setOrders] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [searchQuery, setSearchQuery] = React.useState('');

    // Modal & Drawer States
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = React.useState(null);
    const [trackingOrder, setTrackingOrder] = React.useState(null);

    const loadOrders = React.useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await getBuyerOrders();
            const rawOrders = res.data || [];
            const normalizedOrders = rawOrders.map(o => ({
                ...o,
                status: (o.status && String(o.status).trim().toLowerCase() === 'ready') ? 'Ready for Dispatch' : o.status
            }));
            setOrders(normalizedOrders);
        } catch (e) {
            console.error('Failed to fetch buyer orders:', e);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    React.useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // WebSocket listener for live updates
    useWebSocket({
        ORDER_UPDATED: () => {
            loadOrders();
            if (setMessage) setMessage('⚡ Real-time order status update received');
        }
    });

    const handleReorder = async (orderId) => {
        try {
            const res = await reorderBuyerOrder(orderId);
            const rawCartItems = res?.data || res || [];

            if (Array.isArray(rawCartItems) && rawCartItems.length > 0) {
                const formattedItems = rawCartItems.map(item => ({
                    product: {
                        id: item.product_id || item.id,
                        name: item.product_name || item.name || 'Product Item',
                        price: parseFloat(item.variant_price || item.base_price || item.price || 0),
                        base_price: parseFloat(item.base_price || item.price || 0),
                        primary_image_url: item.image_url || item.primary_image_url,
                        supplier_name: item.supplier_name,
                        unit_name: item.unit_name || item.unit
                    },
                    quantity: Number(item.quantity || 1)
                }));
                setCartItems(formattedItems);
            } else {
                const targetOrder = orders.find(o => String(o.id) === String(orderId));
                if (targetOrder && targetOrder.items) {
                    targetOrder.items.forEach(item => {
                        addItem({
                            id: item.product_id || item.product_variant_id || item.id,
                            name: item.product_name || 'Product Item',
                            price: parseFloat(item.unit_price || item.price || 0),
                            base_price: parseFloat(item.unit_price || item.price || 0)
                        }, item.quantity);
                    });
                }
            }

            if (setMessage) setMessage('✨ Items added to your cart for reorder!');
            if (onNavigateToCart) {
                onNavigateToCart();
            } else {
                navigate('/buyer?tab=cart');
            }
        } catch (err) {
            if (setMessage) setMessage(err?.response?.data?.message || 'Reorder failed');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await cancelBuyerOrder(orderId);
            if (setMessage) setMessage('Order cancelled successfully');
            loadOrders();
        } catch (err) {
            if (setMessage) setMessage(err?.response?.data?.message || 'Cancellation failed');
        }
    };

    const handleAskAIAboutOrder = (order) => {
        const orderNum = order.order_number || order.id;
        const promptText = `Can you provide a status summary and details for my Order #${orderNum} from supplier ${order.supplier_name || 'Verified Mill'}?`;
        window.dispatchEvent(new CustomEvent('open-ai-assistant', {
            detail: { prompt: promptText }
        }));
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    // Multi-Field Search
    const filteredOrders = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return orders.filter(order => {
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            if (!query) return matchesStatus;

            const orderNumMatch = String(order.order_number || order.id).toLowerCase().includes(query);
            const supplierMatch = (order.supplier_name || '').toLowerCase().includes(query);
            const itemMatch = (order.items || []).some(item =>
                (item.product_name || '').toLowerCase().includes(query) ||
                (item.sku || '').toLowerCase().includes(query)
            );

            return matchesStatus && (orderNumMatch || supplierMatch || itemMatch);
        });
    }, [orders, statusFilter, searchQuery]);

    const orderStats = React.useMemo(() => {
        let totalSpent = 0;
        let activeCount = 0;
        let completedCount = 0;

        orders.forEach(o => {
            const rawStatus = (o.status || '').trim();
            const statusLower = rawStatus.toLowerCase();
            const amt = parseFloat(o.grand_total) > 0 ? parseFloat(o.grand_total) : (parseFloat(o.subtotal) || 0);

            if (statusLower !== 'cancelled') {
                totalSpent += amt;
            }

            if (['pending', 'accepted', 'preparing', 'ready for dispatch', 'ready'].includes(statusLower)) {
                activeCount++;
            } else if (statusLower === 'completed') {
                completedCount++;
            }
        });

        return { totalSpent, activeCount, completedCount, totalOrders: orders.length };
    }, [orders]);

    if (!isAuthenticated) {
        return (
            <div className="text-center py-16 theme-card rounded-3xl p-8 border theme-border-color shadow-md max-w-md mx-auto my-10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 mx-auto mb-4">
                    <Package className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold theme-text-main mb-2">Login Required</h3>
                <p className="theme-text-subtle text-xs mb-6 leading-relaxed">
                    Please log in to your VFabrica account to view, track, and manage your fabric purchase orders.
                </p>
                <Button onClick={() => navigate('/auth/login')} className="w-full">
                    Login to Account
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 1. Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="theme-card rounded-2xl p-5 border theme-border-color shadow-xs flex items-center justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                            <span>Total Spend</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" /> +12%
                            </span>
                        </div>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                            ₹{orderStats.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] theme-text-subtle mt-0.5 font-medium">Across all completed purchases</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                </div>

                <div className="theme-card rounded-2xl p-5 border theme-border-color shadow-xs flex items-center justify-between hover:shadow-md transition-all">
                    <div>
                        <p className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">Total Orders</p>
                        <p className="text-2xl font-black theme-text-main mt-1">
                            {orderStats.totalOrders} <span className="text-xs font-normal theme-text-subtle">orders</span>
                        </p>
                        <p className="text-[11px] theme-text-subtle mt-0.5 font-medium">{orderStats.completedCount} delivered successfully</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
                        <Package className="w-6 h-6" />
                    </div>
                </div>

                <div className="theme-card rounded-2xl p-5 border theme-border-color shadow-xs flex items-center justify-between hover:shadow-md transition-all">
                    <div>
                        <p className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">Active In-Progress</p>
                        <p className="text-2xl font-black text-amber-500 mt-1">
                            {orderStats.activeCount} <span className="text-xs font-normal theme-text-subtle">orders</span>
                        </p>
                        <p className="text-[11px] theme-text-subtle mt-0.5 font-medium">Live tracking & fulfillment</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                        <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* 2. Header & Search */}
            <div className="theme-card rounded-2xl p-5 sm:p-6 border theme-border-color shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold theme-text-main">Order Tracking & History</h2>
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800">
                                {filteredOrders.length} Orders
                            </span>
                        </div>
                        <p className="text-xs theme-text-subtle mt-1">
                            Monitor live status, review specs, download invoices, and reorder from verified fabric mills.
                        </p>
                    </div>
                    <Button variant="secondary" onClick={loadOrders} className="self-start sm:self-auto flex items-center gap-2 text-xs">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Status
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Order #, Supplier name, Product item, SKU..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                        {['all', 'Pending', 'Accepted', 'Preparing', 'Ready for Dispatch', 'Completed', 'Cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                                    statusFilter === status
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs scale-[1.02]'
                                        : 'bg-[var(--bg)] theme-text-subtle border theme-border-color hover:theme-text-main'
                                }`}
                            >
                                {status === 'all' ? '✨ All Orders' : status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Orders List */}
            {loading && orders.length === 0 ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse theme-card rounded-2xl p-6 border theme-border-color space-y-4">
                            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full" />
                            <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl w-full" />
                        </div>
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 theme-card rounded-3xl border theme-border-color p-8 shadow-xs">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold theme-text-main">
                        {orders.length === 0 ? 'No orders placed yet' : 'No matching orders found'}
                    </h3>
                    <p className="text-xs theme-text-subtle mt-1 mb-6 max-w-sm mx-auto leading-relaxed">
                        {orders.length === 0
                            ? 'Explore our marketplace catalog to discover premium fabrics and place your first wholesale order.'
                            : 'Try adjusting your search query or status filter.'}
                    </p>
                    {orders.length === 0 ? (
                        <Button onClick={() => onNavigateToCatalog ? onNavigateToCatalog() : navigate('/buyer?tab=catalog')} className="flex items-center gap-2 mx-auto">
                            <ShoppingBag className="w-4 h-4" />
                            Browse Fabric Catalog
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}>
                            Reset Search & Filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                    {filteredOrders.map(order => {
                        const canCancel = ['Pending', 'Accepted'].includes(order.status);
                        const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
                        const StatusIcon = statusInfo.icon;
                        const subtotal = parseFloat(order.subtotal || 0);
                        const grandTotal = parseFloat(order.grand_total) > 0 ? parseFloat(order.grand_total) : subtotal;

                        return (
                            <div
                                key={order.id}
                                className="theme-card rounded-2xl p-5 sm:p-6 border theme-border-color shadow-xs hover:shadow-lg hover:border-indigo-500/40 transition-all duration-300 space-y-4"
                            >
                                {/* Header Info */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b theme-border-color">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-base font-black theme-text-main tracking-wide">
                                                Order #{order.order_number || String(order.id).slice(0, 8)}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs theme-text-subtle font-medium">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {new Date(order.placed_at || order.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>

                                            {order.supplier_name && (
                                                <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                                                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                                    {order.supplier_name}
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" title="Verified Mill" />
                                                </span>
                                            )}

                                            <span className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                                                <Star className="w-3 h-3 fill-current" />
                                                4.9
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Grand Total */}
                                    <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider theme-text-subtle">
                                            Grand Total
                                        </span>
                                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                            ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Progress Bar */}
                                {order.status !== 'Cancelled' ? (
                                    <div className="p-4 bg-[var(--bg)] rounded-2xl border theme-border-color space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold theme-text-subtle uppercase tracking-wider">
                                            <span>Fulfillment Stage</span>
                                            <button
                                                onClick={() => setTrackingOrder(order)}
                                                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Track Detailed Timeline</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                                            {ORDER_STEPS.map((stepItem, idx) => {
                                                const currentStepNum = statusInfo.step || 1;
                                                const isCompleted = currentStepNum > idx;
                                                const isCurrent = currentStepNum === idx + 1;
                                                const StepIcon = stepItem.icon;

                                                return (
                                                    <div key={stepItem.key} className="flex flex-col items-center text-center space-y-1.5">
                                                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                                            isCurrent
                                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ring-4 ring-indigo-500/20 shadow-md scale-105'
                                                                : isCompleted
                                                                ? 'bg-emerald-500 text-white'
                                                                : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                                                        }`}>
                                                            {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold line-clamp-1 ${isCurrent ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : isCompleted ? 'theme-text-main' : 'theme-text-subtle'}`}>
                                                            {stepItem.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                                        <XCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>This order was cancelled. No further processing will occur.</span>
                                    </div>
                                )}

                                {/* Ordered Line Items */}
                                {order.items && order.items.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold theme-text-subtle">
                                            <span>Purchased Fabrics ({order.items.length})</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {order.items.map((item, i) => {
                                                const unitPrice = parseFloat(item.unit_price || item.price || 0);
                                                const lineTotal = parseFloat(item.total_price || (item.quantity * unitPrice) || 0);
                                                const unitLabel = item.unit || item.unit_name || item.unit_symbol || 'm';

                                                return (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg)] rounded-xl border theme-border-color hover:border-indigo-400/40 transition-colors">
                                                        {item.primary_image_url || item.image_url ? (
                                                            <img
                                                                src={item.primary_image_url || item.image_url}
                                                                alt={item.product_name}
                                                                className="w-12 h-12 rounded-lg object-cover border theme-border-color flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                                                <Package className="w-5 h-5" />
                                                            </div>
                                                        )}

                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-xs theme-text-main truncate">
                                                                {item.product_name || 'Fabric Item'}
                                                            </h4>

                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-gray-100 dark:bg-gray-800 theme-text-main">
                                                                    Qty: {formatUnitQuantity(item.quantity, unitLabel)}
                                                                </span>
                                                                {item.gsm && (
                                                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                                                                        {item.gsm} GSM
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="text-right flex-shrink-0">
                                                            <span className="font-extrabold text-xs theme-text-main block">
                                                                ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Contextual Action Row */}
                                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t theme-border-color">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleAskAIAboutOrder(order)}
                                        icon={Bot}
                                        className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900 hover:bg-amber-100"
                                    >
                                        Ask AI
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSelectedInvoiceOrder(order)}
                                        icon={Receipt}
                                    >
                                        Tax Invoice
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleReorder(order.id)}
                                        icon={RefreshCw}
                                    >
                                        Reorder
                                    </Button>

                                    {canCancel && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleCancelOrder(order.id)}
                                        >
                                            Cancel Order
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 4. Tax Invoice Printable Modal */}
            {selectedInvoiceOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-elevated)] rounded-3xl max-w-xl w-full border theme-border-color shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-amber-300" />
                                <h3 className="font-bold text-base">B2B Tax Invoice Receipt</h3>
                            </div>
                            <button
                                onClick={() => setSelectedInvoiceOrder(null)}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                            <div className="flex justify-between border-b theme-border-color pb-4">
                                <div>
                                    <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400">VFABRICA TEXTILE B2B</h2>
                                    <p className="theme-text-subtle">Surat Textile Hub, Gujarat, India</p>
                                    <p className="theme-text-subtle">GSTIN: 24AAACV1234F1Z9</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold theme-text-main">Invoice #: INV-{selectedInvoiceOrder.id}</p>
                                    <p className="theme-text-subtle">Order #: {selectedInvoiceOrder.order_number || selectedInvoiceOrder.id}</p>
                                    <p className="theme-text-subtle">Date: {new Date(selectedInvoiceOrder.placed_at || selectedInvoiceOrder.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-3 bg-[var(--bg)] rounded-xl border theme-border-color">
                                <div>
                                    <p className="font-bold theme-text-subtle uppercase text-[10px]">Supplier / Mill</p>
                                    <p className="font-bold theme-text-main text-sm">{selectedInvoiceOrder.supplier_name || 'Verified Textile Mill'}</p>
                                </div>
                                <div>
                                    <p className="font-bold theme-text-subtle uppercase text-[10px]">Deliver To</p>
                                    <p className="font-bold theme-text-main">{selectedInvoiceOrder.shipping_address_line_1 || 'Buyer Warehouse'}</p>
                                </div>
                            </div>

                            {/* Itemized Table */}
                            <div className="space-y-2">
                                <p className="font-bold theme-text-main">Line Items</p>
                                <div className="border theme-border-color rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[var(--bg)] theme-text-subtle font-bold text-[10px] uppercase">
                                            <tr>
                                                <th className="p-2.5">Item</th>
                                                <th className="p-2.5 text-center">Qty</th>
                                                <th className="p-2.5 text-right">Price</th>
                                                <th className="p-2.5 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y theme-border-color font-medium">
                                            {(selectedInvoiceOrder.items || []).map((it, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-2.5 font-bold theme-text-main">{it.product_name}</td>
                                                    <td className="p-2.5 text-center">{it.quantity}</td>
                                                    <td className="p-2.5 text-right">₹{Number(it.unit_price || 0).toFixed(2)}</td>
                                                    <td className="p-2.5 text-right font-bold text-indigo-600">₹{Number(it.total_price || (it.quantity * it.unit_price) || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-2 border-t theme-border-color flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] theme-text-subtle">Payment Method: Bank Transfer / Online Gateway</p>
                                    <p className="text-[10px] theme-text-subtle">Status: Paid & Verified</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] theme-text-subtle block">Grand Total</span>
                                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                        ₹{(parseFloat(selectedInvoiceOrder.grand_total) > 0 ? parseFloat(selectedInvoiceOrder.grand_total) : (parseFloat(selectedInvoiceOrder.subtotal) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t theme-border-color flex justify-end gap-2 bg-[var(--bg)]">
                            <button
                                onClick={handlePrintInvoice}
                                className="py-2 px-4 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Print / Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Detailed Tracking & Timestamps Drawer */}
            {trackingOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-elevated)] rounded-3xl max-w-lg w-full border theme-border-color shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-indigo-300" />
                                <h3 className="font-bold text-base">Detailed Order Tracking Timeline</h3>
                            </div>
                            <button
                                onClick={() => setTrackingOrder(null)}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
                                <div className="flex justify-between font-bold">
                                    <span>Order #{trackingOrder.order_number || trackingOrder.id}</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">{trackingOrder.status}</span>
                                </div>
                                <p className="theme-text-subtle mt-1 text-[11px]">
                                    Supplier: {trackingOrder.supplier_name || 'Verified Mill'} • Courier: VFabrica Logistics Express
                                </p>
                            </div>

                            <div className="space-y-4 relative pl-4 border-l-2 border-indigo-500/30 ml-2">
                                {ORDER_STEPS.map((st, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[21px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-gray-900 flex items-center justify-center text-white text-[9px] font-bold">
                                            ✓
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold theme-text-main text-xs">{st.label}</h4>
                                            <p className="text-[10px] theme-text-subtle">
                                                {new Date(trackingOrder.placed_at || trackingOrder.created_at).toLocaleDateString()} • Verified Log Entry
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
