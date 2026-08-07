import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useCartStore } from '../../store/useCartStore';
import { useCartAuthorization } from '../../hooks/useCartAuthorization';
import { getProductUnit, formatUnitQuantity } from '../../utils/productUtils';
import {
    Heart,
    ShoppingCart,
    Eye,
    Package,
    ArrowRight,
    ShieldCheck,
    Building2,
    MapPin,
    CheckCircle2,
    X,
    Trash2
} from 'lucide-react';

export function BuyerFavoritesPage() {
    const navigate = useNavigate();
    const { favorites, fetchFavorites, toggleFavorite, isFavorite } = useFavoritesStore();
    const { isSupplier, handleAddToCart: authorizeAndAddToCart } = useCartAuthorization();
    const [toastMessage, setToastMessage] = React.useState('');

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const handleAddToCart = (product, e) => {
        if (e) e.stopPropagation();
        const showToast = (msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(''), 3500);
        };
        const res = authorizeAndAddToCart(product, null, { showToast });
        if (res.allowed) {
            const unitName = getProductUnit(product);
            const qtyAdded = product.minimum_order_quantity || 1;
            showToast(`✨ Added ${formatUnitQuantity(qtyAdded, unitName)} of ${product.name} to cart`);
        }
    }; // <-- Missing closing brace was here

    const handleRemoveFavorite = async (product, e) => {
        if (e) e.stopPropagation();
        const res = await toggleFavorite(product);
        if (res && res.success) {
            setToastMessage(`Removed ${product.name} from favorites`);
            setTimeout(() => setToastMessage(''), 3500);
        } else if (res && res.status === 401) {
            setToastMessage('🔒 Please sign in to manage favorites');
            navigate('/auth/login?message=Please%20sign%20in%20to%20manage%20favorites.');
        }
    };

    return (
        <AppShell>
            <div className="min-h-screen theme-bg-page py-8">
                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed top-20 right-4 z-50 animate-slide-in">
                        <div className="theme-card rounded-xl shadow-lg p-4 flex items-center gap-3 border theme-border-color">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="text-sm theme-text-main">{toastMessage}</p>
                            <button onClick={() => setToastMessage('')} className="ml-4 theme-text-subtle hover:theme-text-main">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header / Hero */}
                    <div className="mb-8 bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-3">
                                    <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
                                    <span>Saved Wishlist</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    My Favorite Fabrics
                                </h1>
                                <p className="text-sm text-gray-300 mt-1 max-w-xl">
                                    Quickly review and source wholesale fabric items you have saved for upcoming collections.
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl flex items-center gap-3 flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                                    <Heart className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <span className="block text-2xl font-black text-white">{favorites.length}</span>
                                    <span className="text-[11px] text-gray-300 font-medium">Saved Items</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Favorites List / Empty State */}
                    {favorites.length === 0 ? (
                        <div className="text-center py-20 theme-card rounded-3xl border theme-border-color p-8 shadow-sm">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                                <Heart className="w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-bold theme-text-main mb-2">No Saved Favorites Yet</h2>
                            <p className="text-sm theme-text-subtle max-w-md mx-auto mb-6">
                                Explore our catalog of certified wholesale fabrics and click the heart icon to save products to your wishlist.
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/buyer')}
                                icon={ArrowRight}
                            >
                                Browse Fabric Catalog
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {favorites.map((product) => {
                                const availableStock = product.available_quantity ?? product.total_available_stock ?? product.available_stock ?? product.stock ?? 0;
                                const price = Number(product.price || product.base_price || 0);
                                const unitLabel = getProductUnit(product);
                                const isFav = isFavorite(product.id || product.product_id);

                                return (
                                    <div
                                        key={product.id || product.product_id}
                                        className="group bg-[var(--bg-elevated)] rounded-2xl border theme-border-color overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between"
                                    >
                                        {/* Image Box */}
                                        <div
                                            onClick={() => navigate(`/buyer/product/${product.id || product.product_id}`)}
                                            className="relative h-52 w-full overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800"
                                        >
                                            {product.primary_image_url ? (
                                                <img
                                                    src={product.primary_image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-900/10 dark:bg-indigo-950/40">
                                                    <Package className="w-10 h-10 text-indigo-400 opacity-60 mb-1" />
                                                </div>
                                            )}

                                            {/* Remove Favorite Button */}
                                            <button
                                                onClick={(e) => handleRemoveFavorite(product, e)}
                                                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-all cursor-pointer"
                                                title="Remove from favorites"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            {/* Stock Badge */}
                                            <div className="absolute bottom-3 left-3 z-10">
                                                {availableStock > 0 ? (
                                                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600/90 text-white shadow-xs backdrop-blur-md">
                                                        In Stock
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600/90 text-white shadow-xs backdrop-blur-md">
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                    <span className="truncate">{product.supplier_name || product.brand || 'Verified Mill'}</span>
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                </div>

                                                <h3
                                                    onClick={() => navigate(`/buyer/product/${product.id || product.product_id}`)}
                                                    className="font-bold text-sm theme-text-main line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer"
                                                >
                                                    {product.name}
                                                </h3>

                                                <p className="text-xs theme-text-subtle line-clamp-2 mt-1">
                                                    {product.description || 'High quality wholesale textile material.'}
                                                </p>
                                            </div>

                                            {/* Price & Actions */}
                                            <div className="pt-3 border-t theme-border-color space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                                            ₹{price.toLocaleString('en-IN')}
                                                        </span>
                                                        <span className="text-[11px] theme-text-subtle ml-1 font-medium">/{unitLabel}</span>
                                                    </div>

                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                                        MOQ: {product.minimum_order_quantity || 1}{unitLabel}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => navigate(`/buyer/product/${product.id || product.product_id}`)}
                                                        icon={Eye}
                                                    >
                                                        View
                                                    </Button>

                                                    {isSupplier ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => handleAddToCart(product, e)}
                                                            className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800 text-[10px]"
                                                            title="Only buyers can purchase products."
                                                        >
                                                            Buyers Only
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={(e) => handleAddToCart(product, e)}
                                                            disabled={availableStock <= 0}
                                                            icon={ShoppingCart}
                                                        >
                                                            Add Cart
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}