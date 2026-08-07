import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useCartStore } from '../../store/useCartStore';
import { checkoutCart, getCart, removeCartItemApi, clearCartApi, updateCartItemApi } from '../../services/buyerService';
import { getProductUnit, formatUnitQuantity } from '../../utils/productUtils';
import {
    ShoppingCart,
    Trash2,
    ArrowLeft,
    CheckCircle2,
    Plus,
    Minus,
    MapPin,
    IndianRupee,
    ShieldCheck,
    PackageCheck,
    Truck,
    ArrowRight,
    Sparkles,
    AlertCircle,
    Building2,
    Clock,
    Lock
} from 'lucide-react';

export function BuyerCartModule({
    buyerAddresses = [],
    selectedShippingAddressId,
    setSelectedShippingAddressId,
    onOpenAddAddressModal,
    onNavigateToOrders,
    onNavigateToCatalog,
    setMessage
}) {
    const navigate = useNavigate();
    const { items, removeItem, updateQuantity, clearCart, setCartItems } = useCartStore();
    const [checkoutStep, setCheckoutStep] = React.useState('cart'); // 'cart', 'checkout', 'confirmed'
    const [loading, setLoading] = React.useState(false);

    // Confirmation Modals State
    const [itemToRemove, setItemToRemove] = React.useState(null);
    const [isClearCartModalOpen, setIsClearCartModalOpen] = React.useState(false);

    // Sync Backend Cart on Mount
    React.useEffect(() => {
        getCart()
            .then(res => {
                const rawItems = res?.data || res || [];
                if (Array.isArray(rawItems) && rawItems.length > 0) {
                    setCartItems(rawItems.map(item => ({
                        product: {
                            id: item.product_id || item.id,
                            cart_item_id: item.cart_item_id || item.id,
                            product_variant_id: item.product_variant_id,
                            name: item.product_name || item.name || 'Product Item',
                            price: parseFloat(item.variant_price || item.base_price || item.price || 0),
                            base_price: parseFloat(item.base_price || item.price || 0),
                            primary_image_url: item.image_url || item.primary_image_url,
                            supplier_name: item.supplier_name,
                            unit_name: item.unit_name || item.unit,
                            gsm: item.gsm,
                            width: item.width,
                            material_composition: item.material_composition,
                            minimum_order_quantity: item.minimum_order_quantity || item.min_quantity || 1,
                            available_quantity: item.available_quantity || item.stock || 500,
                            lead_time_days: item.lead_time_days || item.lead_time || '3-5'
                        },
                        quantity: Number(item.quantity || 1)
                    })));
                }
            })
            .catch(() => {});
    }, [setCartItems]);

    // Group items by product unit dynamically
    const unitTotalsSummary = React.useMemo(() => {
        const map = {};
        items.forEach(item => {
            const u = getProductUnit(item.product);
            const qty = Number(item.quantity || 0);
            map[u] = (map[u] || 0) + qty;
        });
        const entries = Object.entries(map);
        if (entries.length === 0) return '0 Items';
        return entries
            .map(([unit, total]) => formatUnitQuantity(total, unit))
            .join(' • ');
    }, [items]);

    // Optimistic Delete Item from Cart
    const confirmRemoveItem = async () => {
        if (!itemToRemove) return;
        const targetProduct = itemToRemove;
        const targetId = targetProduct.cart_item_id || targetProduct.id;

        // Instant UI & Store Update
        removeItem(targetProduct.id);
        if (targetProduct.cart_item_id) removeItem(targetProduct.cart_item_id);
        setItemToRemove(null);

        if (setMessage) setMessage('✨ Item removed from your cart');

        try {
            await removeCartItemApi(targetId);
        } catch (e) {
            console.error('Failed to remove cart item from backend:', e);
        }
    };

    const confirmClearCart = async () => {
        setIsClearCartModalOpen(false);
        clearCart();
        if (setMessage) setMessage('Cart cleared');
        try {
            await clearCartApi();
        } catch (e) {
            console.error('Failed to clear cart on backend:', e);
        }
    };

    const handleUpdateQuantity = async (product, newQty) => {
        const targetId = product.cart_item_id || product.id;
        const moq = Math.max(1, parseInt(product.minimum_order_quantity || product.min_quantity || 1, 10));
        const availableStock = product.available_quantity || 0;

        if (newQty <= 0) {
            setItemToRemove(product);
            return;
        }

        if (newQty < moq) {
            if (setMessage) setMessage(`⚠️ Minimum Order Quantity for ${product.name} is ${moq} ${getProductUnit(product)}.`);
            return;
        }

        if (availableStock > 0 && newQty > availableStock) {
            if (setMessage) setMessage(`⚠️ Quantity cannot exceed available stock (${availableStock}).`);
            return;
        }

        // Optimistic UI Update
        updateQuantity(product.id, newQty);
        if (product.cart_item_id) updateQuantity(product.cart_item_id, newQty);

        try {
            await updateCartItemApi({ cartItemId: targetId, quantity: newQty });
        } catch (e) {
            const errorMsg = e?.response?.data?.error?.message || e?.response?.data?.message || 'Quantity update failed';
            if (setMessage) setMessage(`⚠️ ${errorMsg}`);
        }
    };

    // Financial Calculations
    const totalLineItems = items.length;
    const subtotal = items.reduce((s, i) => s + parseFloat(i.product.price || i.product.base_price || 0) * Number(i.quantity || 0), 0);
    const taxRate = 0.05; // 5% GST
    const estimatedTax = subtotal * taxRate;
    const shippingCharge = subtotal > 50000 || subtotal === 0 ? 0 : 450; // Free freight on wholesale > ₹50,000
    const grandTotal = Math.max(0, subtotal + estimatedTax + shippingCharge);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const chosenAddr = buyerAddresses.find(a => String(a.id) === String(selectedShippingAddressId))
                || buyerAddresses.find(a => a.is_primary)
                || buyerAddresses[0];
            const shippingAddressStr = chosenAddr
                ? `${chosenAddr.address_line_1}${chosenAddr.landmark ? `, Near ${chosenAddr.landmark}` : ''}${chosenAddr.zipcode ? `, Zip: ${chosenAddr.zipcode}` : ''}`.trim()
                : 'Default Business Address';

            await checkoutCart({
                items: items.map(i => ({
                    productId: i.product.id,
                    quantity: i.quantity,
                    price: parseFloat(i.product.price || i.product.base_price || 0)
                })),
                shippingAddress: shippingAddressStr,
                shippingAddressId: chosenAddr?.id
            });
            clearCart();
            setCheckoutStep('confirmed');
        } catch (e) {
            if (setMessage) setMessage(e?.response?.data?.error || e?.response?.data?.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    // 1. Order Confirmed Screen
    if (checkoutStep === 'confirmed') {
        return (
            <div className="max-w-xl mx-auto py-12 px-4 animate-in zoom-in-95">
                <div className="bg-[var(--bg-elevated)] rounded-3xl p-8 border theme-border-color shadow-2xl text-center relative overflow-hidden space-y-6">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

                    <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <span className="text-xs uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full inline-block">
                        Order Dispatched to Mill
                    </span>

                    <h2 className="text-2xl font-black theme-text-main">
                        Wholesale Order Placed Successfully!
                    </h2>
                    <p className="text-xs theme-text-subtle leading-relaxed max-w-md mx-auto">
                        Your bulk order has been transmitted directly to verified textile suppliers. Track real-time fulfillment and timestamps in your buyer portal.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Button
                            onClick={() => { onNavigateToOrders ? onNavigateToOrders() : navigate('/buyer?tab=orders'); setCheckoutStep('cart'); }}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                        >
                            <PackageCheck className="w-4 h-4" />
                            View My Orders
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => { onNavigateToCatalog ? onNavigateToCatalog() : navigate('/buyer?tab=catalog'); setCheckoutStep('cart'); }}
                            className="py-3 px-6 rounded-xl"
                        >
                            Browse Fabric Catalog
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Checkout & Shipping Address Selection Screen
    if (checkoutStep === 'checkout') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 w-full overflow-x-hidden">
                <button
                    onClick={() => setCheckoutStep('cart')}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Cart Review
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {/* Shipping Address Column */}
                    <div className="md:col-span-2 lg:col-span-2 space-y-6">
                        <div className="theme-card rounded-2xl p-5 sm:p-6 border theme-border-color shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-base theme-text-main flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-500" />
                                    Select Shipping Address
                                </h3>
                                {onOpenAddAddressModal && (
                                    <button
                                        type="button"
                                        onClick={onOpenAddAddressModal}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                                    >
                                        + Add New Address
                                    </button>
                                )}
                            </div>

                            {buyerAddresses.length === 0 ? (
                                <div className="p-6 bg-[var(--bg)] border border-dashed theme-border-color rounded-xl text-center">
                                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                    <p className="text-xs font-semibold theme-text-main mb-3">No saved shipping addresses found.</p>
                                    {onOpenAddAddressModal && (
                                        <Button variant="secondary" onClick={onOpenAddAddressModal} className="text-xs">
                                            Add Shipping Address
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {buyerAddresses.map(addr => {
                                        const isSelected = String(selectedShippingAddressId) === String(addr.id) || (!selectedShippingAddressId && addr.is_primary);
                                        return (
                                            <label
                                                key={addr.id}
                                                className={`flex items-start gap-3.5 p-4 border rounded-xl cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                                                        : 'theme-border-color bg-[var(--bg)] hover:border-indigo-400'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="shipping"
                                                    checked={isSelected}
                                                    onChange={() => setSelectedShippingAddressId(addr.id)}
                                                    className="mt-1 text-indigo-600 accent-indigo-600 cursor-pointer"
                                                />
                                                <div className="flex-1 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold theme-text-main text-sm">
                                                            {addr.address_type || 'Warehouse'} Address
                                                        </span>
                                                        {addr.is_primary && (
                                                            <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="theme-text-subtle mt-1 leading-relaxed">
                                                        {addr.address_line_1}{addr.landmark ? `, Near ${addr.landmark}` : ''}{addr.zipcode ? ` (${addr.zipcode})` : ''}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Order Line Items Review */}
                        <div className="theme-card rounded-2xl p-5 sm:p-6 border theme-border-color shadow-xs space-y-3">
                            <h3 className="font-bold text-base theme-text-main">
                                Line Items ({totalLineItems} item{totalLineItems === 1 ? '' : 's'})
                            </h3>
                            <div className="divide-y theme-border-color">
                                {items.map(item => {
                                    const uName = getProductUnit(item.product);
                                    const uPrice = parseFloat(item.product.price || item.product.base_price || 0);

                                    return (
                                        <div key={item.product.id || item.product.cart_item_id} className="py-3 flex items-center justify-between gap-4 text-xs">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {item.product.primary_image_url || item.product.image_url ? (
                                                    <img
                                                        src={item.product.primary_image_url || item.product.image_url}
                                                        alt={item.product.name}
                                                        className="w-12 h-12 rounded-lg object-cover border theme-border-color flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold flex-shrink-0">
                                                        📦
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-bold theme-text-main truncate">
                                                        {item.product.name}
                                                    </p>
                                                    <p className="theme-text-subtle text-[11px] mt-0.5">
                                                        Qty: {formatUnitQuantity(item.quantity, uName)} × ₹{uPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-black text-indigo-600 dark:text-indigo-400">
                                                ₹{(Number(item.quantity) * uPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Column */}
                    <div className="space-y-4">
                        <div className="theme-card rounded-2xl p-5 sm:p-6 border theme-border-color shadow-xs sticky top-24 space-y-4">
                            <h3 className="font-bold text-base theme-text-main">Order Summary</h3>

                            <div className="space-y-2.5 text-xs border-b theme-border-color pb-4">
                                <div className="flex justify-between theme-text-subtle">
                                    <span>Total Quantities</span>
                                    <span className="font-bold theme-text-main">{unitTotalsSummary}</span>
                                </div>
                                <div className="flex justify-between theme-text-subtle">
                                    <span>Items Subtotal</span>
                                    <span className="font-bold theme-text-main">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between theme-text-subtle">
                                    <span>Estimated GST (5%)</span>
                                    <span className="font-bold theme-text-main">₹{estimatedTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between theme-text-subtle">
                                    <span>Freight Logistics</span>
                                    <span className="font-bold text-emerald-600">
                                        {shippingCharge === 0 ? 'Free Wholesale Delivery' : `₹${shippingCharge.toFixed(2)}`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-2">
                                <span className="font-extrabold theme-text-main text-base">Grand Total</span>
                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <Button
                                onClick={handleCheckout}
                                disabled={loading || buyerAddresses.length === 0}
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? 'Transmitting Order...' : 'Confirm & Place Order'}
                                <ArrowRight className="w-4 h-4" />
                            </Button>

                            <div className="p-3 bg-[var(--bg)] rounded-xl space-y-1.5 text-[11px] theme-text-subtle border theme-border-color">
                                <div className="flex items-center gap-2 font-medium">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span>Verified Mill B2B Settlement</span>
                                </div>
                                <div className="flex items-center gap-2 font-medium">
                                    <Truck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                    <span>Direct Freight Tracked Dispatch</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Main Shopping Cart View
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24 lg:pb-0 w-full overflow-x-hidden">
            {/* Header */}
            <div className="theme-card rounded-2xl p-5 sm:p-6 border theme-border-color shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold theme-text-main">
                            Wholesale Shopping Cart ({totalLineItems} item{totalLineItems === 1 ? '' : 's'})
                        </h2>
                    </div>
                    <p className="text-xs theme-text-subtle mt-1">
                        Review selling units, MOQ thresholds, and pricing before placing your bulk fabric order.
                    </p>
                </div>

                {items.length > 0 && (
                    <button
                        onClick={() => setIsClearCartModalOpen(true)}
                        className="self-start sm:self-auto text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3.5 py-2 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/50 cursor-pointer flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Cart
                    </button>
                )}
            </div>

            {/* Empty State */}
            {items.length === 0 ? (
                <div className="theme-card rounded-3xl p-10 sm:p-12 text-center border theme-border-color shadow-xs space-y-4 max-w-md mx-auto my-6">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                        <ShoppingCart className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-black theme-text-main">Your Shopping Cart is Empty</h3>
                        <p className="text-xs theme-text-subtle leading-relaxed max-w-xs mx-auto">
                            Explore our verified B2B textile catalog to add cotton, silk, denim, and technical fabrics to your order.
                        </p>
                    </div>
                    <Button
                        onClick={() => onNavigateToCatalog ? onNavigateToCatalog() : navigate('/buyer?tab=catalog')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" />
                        Browse Fabric Catalog
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {/* Cart Items List */}
                    <div className="md:col-span-2 lg:col-span-2 space-y-4">
                        {items.map(item => {
                            const unitName = getProductUnit(item.product);
                            const unitPrice = parseFloat(item.product.price || item.product.base_price || 0);
                            const itemTotal = Number(item.quantity || 0) * unitPrice;
                            const minQty = item.product.minimum_order_quantity || item.product.min_quantity || 1;
                            const availableStock = item.product.available_quantity || 500;
                            const brandName = item.product.supplier_name || 'Verified Textile Mill';
                            const isBelowMOQ = Number(item.quantity) < minQty;

                            return (
                                <div
                                    key={item.product.id || item.product.cart_item_id}
                                    className="theme-card rounded-2xl p-4 sm:p-5 border theme-border-color shadow-xs hover:shadow-md transition-all duration-300 space-y-4"
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div
                                            onClick={() => navigate(`/buyer/product/${item.product.id}`)}
                                            className="flex items-start gap-3.5 min-w-0 cursor-pointer group flex-1"
                                            title="Click to view product details"
                                        >
                                            {item.product.primary_image_url || item.product.image_url ? (
                                                <img
                                                    src={item.product.primary_image_url || item.product.image_url}
                                                    alt={item.product.name}
                                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border theme-border-color flex-shrink-0 group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-2xl font-bold flex-shrink-0 border theme-border-color">
                                                    📦
                                                </div>
                                            )}

                                            <div className="min-w-0 space-y-1">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="truncate">{brandName}</span>
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" title="Verified Mill" />
                                                </div>

                                                <h4 className="font-bold text-sm theme-text-main line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {item.product.name}
                                                </h4>

                                                {/* Fabric Specs Badges */}
                                                <div className="flex flex-wrap gap-1 pt-0.5">
                                                    {item.product.gsm && (
                                                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-gray-100 dark:bg-gray-800 theme-text-main border theme-border-color">
                                                            {item.product.gsm} GSM
                                                        </span>
                                                    )}
                                                    {item.product.width && (
                                                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-gray-100 dark:bg-gray-800 theme-text-main border theme-border-color">
                                                            {item.product.width}" Width
                                                        </span>
                                                    )}
                                                    {item.product.material_composition && (
                                                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800 truncate max-w-[110px]">
                                                            {item.product.material_composition}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-[11px] theme-text-subtle pt-0.5">
                                                    <span className="text-emerald-600 font-bold">
                                                        In Stock ({formatUnitQuantity(availableStock, unitName)})
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Clock className="w-3 h-3 text-amber-500" /> Dispatch in {item.product.lead_time_days || '3-5'} days
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete Action Icon */}
                                        <button
                                            onClick={() => setItemToRemove(item.product)}
                                            className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer self-start sm:self-auto min-w-[44px] min-h-[44px] flex items-center justify-center"
                                            title="Remove item from cart"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>

                                    {/* Bottom Row: Stepper & Pricing */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t theme-border-color">
                                        <div>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                                                ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[11px] font-normal theme-text-subtle">/ {unitName}</span>
                                            </span>
                                            <span className="text-[10px] theme-text-subtle block font-medium">
                                                MOQ: {formatUnitQuantity(minQty, unitName)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                            {/* Touch-Optimized Quantity Stepper */}
                                            <div className="flex items-center gap-1 bg-[var(--bg)] border theme-border-color rounded-xl p-1">
                                                <button
                                                    onClick={() => {
                                                        if (Number(item.quantity) <= minQty) {
                                                            setItemToRemove(item.product);
                                                        } else {
                                                            handleUpdateQuantity(item.product, Number(item.quantity) - 1);
                                                        }
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg theme-text-main hover:bg-[var(--bg-elevated)] transition-all cursor-pointer min-w-[40px] min-h-[40px]"
                                                    title={Number(item.quantity) <= minQty ? "Remove item from cart" : "Decrease quantity"}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>

                                                <input
                                                    type="number"
                                                    min={minQty}
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        handleUpdateQuantity(item.product, isNaN(val) ? '' : val);
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        if (isNaN(val) || val < minQty) {
                                                            handleUpdateQuantity(item.product, minQty);
                                                        }
                                                    }}
                                                    className="w-14 text-center font-black text-xs theme-text-main bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                                                />

                                                <button
                                                    onClick={() => handleUpdateQuantity(item.product, Number(item.quantity) + 1)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg theme-text-main hover:bg-[var(--bg-elevated)] transition-all cursor-pointer min-w-[40px] min-h-[40px]"
                                                    title="Increase quantity"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Line Item Total */}
                                            <div className="text-right min-w-[90px]">
                                                <span className="text-[10px] theme-text-subtle block uppercase font-bold">Line Total</span>
                                                <span className="font-black text-sm theme-text-main">
                                                    ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MOQ Warning */}
                                    {isBelowMOQ && (
                                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center gap-2 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                            <span>Current quantity is below mill MOQ threshold ({formatUnitQuantity(minQty, unitName)}). Supplier approval required.</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary Sidebar Column */}
                    <div className="space-y-4">
                        <div className="theme-card rounded-2xl p-5 sm:p-6 border theme-border-color shadow-xs lg:sticky lg:top-24 space-y-4">
                            <h3 className="font-bold text-base theme-text-main">Order Summary</h3>

                            {/* Summary Financial Breakdown */}
                            <div className="space-y-2.5 text-xs border-b theme-border-color pb-4">
                                <div className="flex justify-between theme-text-subtle">
                                    <span>Total Quantities</span>
                                    <span className="font-bold theme-text-main">{unitTotalsSummary}</span>
                                </div>
                                <div className="flex justify-between theme-text-subtle">
                                    <span>Items Subtotal</span>
                                    <span className="font-bold theme-text-main">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between theme-text-subtle">
                                    <span>Estimated GST Tax (5%)</span>
                                    <span className="font-bold theme-text-main">₹{estimatedTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between theme-text-subtle">
                                    <span>Freights & Shipping</span>
                                    <span className="font-bold text-emerald-600">
                                        {shippingCharge === 0 ? 'Free Wholesale Shipping' : `₹${shippingCharge.toFixed(2)}`}
                                    </span>
                                </div>
                            </div>

                            {/* Grand Total */}
                            <div className="flex justify-between items-center py-1">
                                <div>
                                    <span className="font-extrabold theme-text-main text-base block">Grand Total</span>
                                    <span className="text-[10px] theme-text-subtle">Taxes & Shipping Included</span>
                                </div>
                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <Button
                                onClick={() => setCheckoutStep('checkout')}
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                            >
                                Proceed to Checkout
                                <ArrowRight className="w-4 h-4" />
                            </Button>

                            <div className="p-3 bg-[var(--bg)] rounded-xl space-y-1.5 text-[11px] theme-text-subtle border theme-border-color">
                                <div className="flex items-center gap-2 font-semibold">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span>Verified Mill Quality Assurance</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold">
                                    <Lock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                    <span>100% Encrypted B2B Settlement</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Mobile Fixed Bottom Summary Bar (Only on Mobile Viewport) */}
            {items.length > 0 && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-elevated)] border-t theme-border-color p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
                    <div>
                        <span className="text-[10px] uppercase font-bold theme-text-subtle block">{unitTotalsSummary}</span>
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                            ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <Button
                        onClick={() => setCheckoutStep('checkout')}
                        className="py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                    >
                        <span>Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* 5. Item Removal Confirmation Modal */}
            {itemToRemove && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-elevated)] rounded-3xl max-w-sm w-full border theme-border-color shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
                        <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                            <Trash2 className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold theme-text-main">Remove item from cart?</h3>
                            <p className="text-xs theme-text-subtle font-medium">
                                "{itemToRemove.name}" will be deleted from your order list.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setItemToRemove(null)}
                                className="flex-1 py-2.5 text-xs font-bold theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer min-h-[44px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemoveItem}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-md cursor-pointer min-h-[44px]"
                            >
                                Remove Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Clear Cart Confirmation Modal */}
            {isClearCartModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-elevated)] rounded-3xl max-w-sm w-full border theme-border-color shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
                        <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                            <Trash2 className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold theme-text-main">Clear all items in cart?</h3>
                            <p className="text-xs theme-text-subtle font-medium">
                                Are you sure you want to remove all {items.length} items from your shopping cart?
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setIsClearCartModalOpen(false)}
                                className="flex-1 py-2.5 text-xs font-bold theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer min-h-[44px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClearCart}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-md cursor-pointer min-h-[44px]"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
