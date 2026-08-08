import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useCartAuthorization } from '../../hooks/useCartAuthorization';
import { getProductDetails, getProducts } from '../../services/productService';
import { addToCartApi } from '../../services/buyerService';
import { getProductUnit, formatUnitQuantity } from '../../utils/productUtils';
import {
    ShieldCheck,
    Truck,
    ShoppingCart,
    CheckCircle,
    Package,
    X,
    Heart,
    Share2,
    ChevronRight,
    ChevronLeft,
    Minus,
    Plus,
    Ruler,
    Factory,
    Award,
    ArrowLeft,
    Info,
    ClipboardList,
    Building2,
    Tag,
    Star,
    Layers,
    Clock,
    Sparkles,
    Check,
    AlertTriangle,
    RefreshCw,
    ExternalLink,
    Zap,
    Maximize2,
    Box,
    Globe
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';

// ─── Sub-Components ────────────────────────────────────────────────────

function SpecItem({ label, value }) {
    if (!value || value === 'N/A') return null;
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white text-right">{value}</span>
        </div>
    );
}

function ImageGallery({ images, currentIndex, onNavigate, onImageClick }) {
    const mainImage = images[currentIndex];

    return (
        <div className="space-y-3">
            <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 aspect-[4/3] group shadow-xs">
                {mainImage ? (
                    <img
                        src={mainImage}
                        alt="Product"
                        className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-300"
                        onClick={onImageClick}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div
                    className="absolute inset-0 flex-col items-center justify-center text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-900"
                    style={{ display: mainImage ? 'none' : 'flex' }}
                >
                    <Package className="w-12 h-12 mb-2" />
                    <span className="text-xs font-medium">No Image Available</span>
                </div>

                {mainImage && (
                    <button
                        onClick={onImageClick}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 cursor-pointer"
                        title="Expand Fullscreen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                )}

                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => onNavigate('prev')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onNavigate('next')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold rounded-lg">
                            {currentIndex + 1} / {images.length}
                        </span>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => onNavigate(i)}
                            className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${currentIndex === i
                                ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20 scale-105'
                                : 'border-gray-200 dark:border-gray-800 opacity-70 hover:opacity-100 hover:border-gray-300'
                                }`}
                        >
                            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function QuantitySelector({ value, onChange, min = 1, max, unit = 'Unit' }) {
    const handleInputChange = (e) => {
        const raw = e.target.value;
        if (raw === '') {
            onChange(min);
            return;
        }
        const val = parseInt(raw, 10);
        if (isNaN(val)) return;
        let clamped = Math.max(min, val);
        if (max) clamped = Math.min(max, clamped);
        onChange(clamped);
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                    className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-gray-700 dark:text-gray-200 cursor-pointer flex-shrink-0"
                    title={`Minimum order quantity is ${min} ${unit}s`}
                >
                    <Minus className="w-4 h-4" />
                </button>
                <div className="relative flex-1 min-w-[95px] flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={value}
                        onChange={handleInputChange}
                        className="w-full font-extrabold text-sm text-center text-gray-900 dark:text-white bg-transparent outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold pr-0.5">{unit}s</span>
                </div>
                <button
                    onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
                    disabled={max && value >= max}
                    className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-gray-700 dark:text-gray-200 cursor-pointer flex-shrink-0"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            {value <= min && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center">
                    Minimum Order Quantity (MOQ) is {min} {unit}s
                </p>
            )}
        </div>
    );
}

function StockBadge({ stock, unit, isLowStock }) {
    if (stock <= 0) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Out of Stock
            </span>
        );
    }

    if (isLowStock) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Limited Stock: {formatUnitQuantity(stock, unit)}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {formatUnitQuantity(stock, unit)} Available
        </span>
    );
}

function TrustBadge({ icon: Icon, label, color }) {
    const colors = {
        emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
        blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
        purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
        amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    };

    return (
        <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${colors[color]}`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-bold">{label}</span>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isSupplier } = useCartAuthorization();
    const addItem = useCartStore((state) => state.addItem);
    const { isFavorite: checkIsFavorite, toggleFavorite } = useFavoritesStore();

    const [product, setProduct] = React.useState(null);
    const [related, setRelated] = React.useState([]);
    const [recentlyViewed, setRecentlyViewed] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
    const [orderQuantity, setOrderQuantity] = React.useState(1);
    const isFavorite = product ? checkIsFavorite(product.id) : false;
    const [activeTab, setActiveTab] = React.useState('details');
    const [showImageModal, setShowImageModal] = React.useState(false);
    const [selectedVariant, setSelectedVariant] = React.useState(null);
    const [cartStatus, setCartStatus] = React.useState({ type: '', text: '' });
    const [isAdding, setIsAdding] = React.useState(false);
    const [isBuying, setIsBuying] = React.useState(false);

    React.useEffect(() => {
        setSelectedImageIndex(0);
        setCartStatus({ type: '', text: '' });

        async function loadProductData() {
            setLoading(true);
            try {
                const detailsResponse = await getProductDetails(id);
                const details = detailsResponse?.data || detailsResponse;
                setProduct(details);

                if (details?.variants && details.variants.length > 0) {
                    setSelectedVariant(details.variants[0]);
                } else {
                    setSelectedVariant(null);
                }

                const moq = parseInt(details?.minimum_order_quantity || details?.moq || 1, 10);
                setOrderQuantity(Math.max(1, moq));

                if (details?.id) {
                    try {
                        const stored = JSON.parse(localStorage.getItem('vfabrica_recently_viewed') || '[]');
                        const filtered = stored.filter(item => String(item.id) !== String(details.id));
                        const currentItem = {
                            id: details.id,
                            name: details.name,
                            price: details.price || details.base_price,
                            unit_name: details.unit_name || details.unit,
                            primary_image_url: details.primary_image_url || details.image_url,
                            category_name: details.category_name || details.category?.name
                        };
                        const updated = [currentItem, ...filtered].slice(0, 8);
                        localStorage.setItem('vfabrica_recently_viewed', JSON.stringify(updated));
                        setRecentlyViewed(filtered.slice(0, 4));
                    } catch (e) {
                        console.error('Failed to sync recently viewed:', e);
                    }
                }

                if (details?.category_id || details?.categoryId) {
                    const catId = details.category_id || details.categoryId;
                    try {
                        const listResponse = await getProducts({ categoryId: catId, limit: 8 });
                        const list = Array.isArray(listResponse?.data)
                            ? listResponse.data
                            : (listResponse?.items || []);
                        setRelated(list.filter(p => String(p.id) !== String(id)).slice(0, 4));
                    } catch (relatedErr) {
                        console.error('Failed to load related products:', relatedErr);
                    }
                }
            } catch (err) {
                console.error('Error fetching product details:', err);
            } finally {
                setLoading(false);
            }
        }
        loadProductData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    const handleAddToCart = async (directCheckout = false) => {
        if (!isAuthenticated) {
            const msg = 'Please sign in as a Buyer to continue.';
            navigate(`/auth/login?message=${encodeURIComponent(msg)}`);
            return;
        }

        if (isSupplier) {
            setCartStatus({ type: 'error', text: 'Only buyers can purchase products.' });
            return;
        }

        if (!product) return;

        if (directCheckout) {
            setIsBuying(true);
        } else {
            setIsAdding(true);
        }

        const cartProduct = selectedVariant
            ? { ...product, price: selectedVariant.price || product.price, variant_id: selectedVariant.id, color_name: selectedVariant.color_name, size_name: selectedVariant.size_name, sku: selectedVariant.sku || product.sku }
            : product;

        const res = addItem(cartProduct, orderQuantity);
        if (res && res.success === false) {
            setCartStatus({ type: 'error', text: res.message });
            setIsAdding(false);
            setIsBuying(false);
            return;
        }

        try {
            await addToCartApi({ productId: product.id, quantity: orderQuantity, variantId: selectedVariant?.id });
        } catch (err) {
            console.error('Failed to sync added item to backend cart:', err);
        }

        setIsAdding(false);
        setIsBuying(false);

        if (directCheckout) {
            navigate('/buyer?tab=cart');
        } else {
            setCartStatus({ type: 'success', text: `${orderQuantity} × "${product.name}" added to cart` });
            setTimeout(() => setCartStatus({ type: '', text: '' }), 4000);
        }
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            setCartStatus({ type: 'error', text: '🔒 Please sign in to save favorites' });
            navigate('/auth/login?message=Please%20sign%20in%20to%20save%20favorites.');
            return;
        }
        if (!product) return;
        const res = await toggleFavorite(product);
        if (res && res.success) {
            setCartStatus({ type: 'success', text: res.isFavorite ? `❤️ Saved "${product.name}" to favorites` : `Removed "${product.name}" from favorites` });
            setTimeout(() => setCartStatus({ type: '', text: '' }), 3500);
        } else if (res && res.status === 401) {
            setCartStatus({ type: 'error', text: '🔒 Please sign in to save favorites' });
            navigate('/auth/login?message=Please%20sign%20in%20to%20save%20favorites.');
        } else {
            setCartStatus({ type: 'error', text: `⚠️ ${res?.message || 'Failed to update favorites'}` });
        }
    };

    const handleImageNavigate = (direction) => {
        if (typeof direction === 'number') {
            setSelectedImageIndex(direction);
        } else if (direction === 'prev') {
            setSelectedImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
        } else if (direction === 'next') {
            setSelectedImageIndex((prev) => (prev + 1) % imageList.length);
        }
    };

    // ─── Loading State ──────────────────────────────────────────────────
    if (loading) {
        return (
            <AppShell>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="animate-pulse space-y-6">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                                <div className="space-y-4">
                                    <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    // ─── Not Found State ────────────────────────────────────────────────
    if (!product) {
        return (
            <AppShell>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div className="text-center max-w-sm">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">This fabric catalog listing may have been moved or updated by the supplier.</p>
                        <Button onClick={() => navigate('/buyer')} variant="primary" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Fabric Catalog
                        </Button>
                    </div>
                </div>
            </AppShell>
        );
    }

    // ─── Data Preparation ───────────────────────────────────────────────
    const rawImages = product.images || [];
    const imageList = Array.isArray(rawImages) && rawImages.length > 0
        ? rawImages.map(img => typeof img === 'string' ? img : img.image_url)
        : [product.primary_image_url || product.image_url].filter(Boolean);
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const hasAttributes = Array.isArray(product.attributes) && product.attributes.length > 0;

    const price = selectedVariant ? parseFloat(selectedVariant.price || product.price || product.base_price || 0) : parseFloat(product.price || product.base_price || 0);
    const availableStock = selectedVariant ? (selectedVariant.available_quantity ?? product.total_available_stock ?? 0) : (product.total_available_stock ?? product.available_quantity ?? product.available_stock ?? product.stock ?? 0);
    const unit = getProductUnit(product);
    const moq = parseInt(product.minimum_order_quantity || product.moq || 1, 10);
    const isLowStock = availableStock > 0 && availableStock <= (moq * 2);

    const tabs = [
        { id: 'details', label: 'Overview & Description', icon: Info, show: true },
        { id: 'specifications', label: 'Technical Specs', icon: ClipboardList, show: true },
        { id: 'supplier', label: 'Supplier & Mill Profile', icon: Building2, show: true },
    ];

    return (
        <AppShell>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                {/* ─── Top Bar ──────────────────────────────────────────── */}
                <div className="sticky top-16 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-12">
                            <button
                                onClick={() => navigate('/buyer')}
                                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Marketplace</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`p-2 rounded-xl border transition-all cursor-pointer ${isFavorite
                                        ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                                        : 'text-gray-400 hover:text-gray-600 border-gray-200 dark:border-gray-800'
                                        }`}
                                    title={isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}
                                >
                                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: product.name, url: window.location.href });
                                        } else {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('Link copied to clipboard!');
                                        }
                                    }}
                                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                                    title="Share Fabric"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Main Content ─────────────────────────────────────── */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-6 flex-wrap">
                        <button onClick={() => navigate('/buyer')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Catalog
                        </button>
                        <ChevronRight className="w-3 h-3" />
                        {(product.category_name || product.category?.name) && (
                            <>
                                <span className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    {product.category_name || product.category?.name}
                                </span>
                                <ChevronRight className="w-3 h-3" />
                            </>
                        )}
                        <span className="text-gray-700 dark:text-gray-300 font-bold truncate max-w-[200px]">{product.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                        {/* ─── Left: Images Gallery ─────────────────────── */}
                        <ImageGallery
                            images={imageList}
                            currentIndex={selectedImageIndex}
                            onNavigate={handleImageNavigate}
                            onImageClick={() => setShowImageModal(true)}
                        />

                        {/* ─── Right: Product Detail Info ──────────────── */}
                        <div className="space-y-6">
                            {/* Header */}
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                        <Tag className="w-3.5 h-3.5" />
                                        {product.category_name || product.category?.name || 'Textile Fabric'}
                                    </span>
                                    <StockBadge stock={availableStock} unit={unit} isLowStock={isLowStock} />
                                </div>

                                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                                    {product.name}
                                </h1>

                                {/* Price Banner */}
                                <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-indigo-50/80 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between my-3">
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Wholesale Unit Price</p>
                                        <div className="flex items-baseline gap-1.5 mt-0.5">
                                            <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">/ {unit}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">MOQ Order Value</p>
                                        <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                                            ₹{(price * moq).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-gray-400">for {moq} {unit}s</p>
                                    </div>
                                </div>

                                {product.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 mt-3">
                                        {product.description}
                                    </p>
                                )}
                            </div>

                            {/* Quick Specs Grid */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-xs">
                                    <Ruler className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Min Order</p>
                                    <p className="font-extrabold text-xs text-gray-900 dark:text-white mt-0.5">{moq} {unit}s</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-xs">
                                    <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Selling Unit</p>
                                    <p className="font-extrabold text-xs text-gray-900 dark:text-white mt-0.5">{unit}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-xs">
                                    <Truck className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Lead Time</p>
                                    <p className="font-extrabold text-xs text-gray-900 dark:text-white mt-0.5">2-4 Weeks</p>
                                </div>
                            </div>

                            {/* Order Configuration Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-md space-y-4">
                                {hasVariants && (
                                    <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-700/80">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-gray-900 dark:text-white">Variant / Color</span>
                                            {selectedVariant && (
                                                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                                                    {selectedVariant.color_name || selectedVariant.size_name || selectedVariant.sku}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {product.variants.map((v, idx) => {
                                                const isSelected = selectedVariant?.id === v.id || (!selectedVariant && idx === 0);
                                                return (
                                                    <button
                                                        key={v.id || idx}
                                                        type="button"
                                                        onClick={() => setSelectedVariant(v)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                            isSelected
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                                                                : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                                        }`}
                                                    >
                                                        {v.color_name || v.size_name || `Variant ${idx + 1}`}
                                                        <span className="ml-1.5 opacity-80 text-[10px] font-normal">₹{v.price || price}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-extrabold text-gray-900 dark:text-white">Order Quantity</span>
                                        <p className="text-[10px] text-gray-400">Select total {unit}s to purchase</p>
                                    </div>
                                    <QuantitySelector
                                        value={orderQuantity}
                                        onChange={setOrderQuantity}
                                        min={moq}
                                        max={availableStock > 0 ? availableStock : undefined}
                                        unit={unit}
                                    />
                                </div>

                                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                                    <div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Estimated Subtotal</span>
                                        <p className="text-[10px] text-gray-400">Excl. Tax & Shipping</p>
                                    </div>
                                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                        ₹{(price * orderQuantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {cartStatus.text && (
                                    <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-150 ${
                                        cartStatus.type === 'error'
                                            ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                                            : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                    }`}>
                                        {cartStatus.type === 'error' ? (
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                                        )}
                                        <span>{cartStatus.text}</span>
                                    </div>
                                )}

                                {isSupplier ? (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-center space-y-1">
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            Only buyers can purchase products.
                                        </p>
                                        <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                                            Supplier accounts cannot add products to cart or place orders.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                        <Button
                                            onClick={() => handleAddToCart(false)}
                                            variant="outline"
                                            size="lg"
                                            isLoading={isAdding}
                                            disabled={availableStock <= 0}
                                            icon={ShoppingCart}
                                            className="w-full cursor-pointer"
                                        >
                                            Add to Cart
                                        </Button>
                                        <Button
                                            onClick={() => handleAddToCart(true)}
                                            variant="primary"
                                            size="lg"
                                            isLoading={isBuying}
                                            disabled={availableStock <= 0}
                                            icon={Zap}
                                            className="w-full cursor-pointer"
                                        >
                                            {availableStock <= 0 ? 'Out of Stock' : 'Buy Now'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Trust Badges Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <TrustBadge icon={ShieldCheck} label="Quality Certified Fabric" color="emerald" />
                                <TrustBadge icon={Truck} label="Pan-India Logistics" color="blue" />
                                <TrustBadge icon={Factory} label="Direct Mill Sourcing" color="purple" />
                                <TrustBadge icon={Award} label="Verified Wholesale Supplier" color="amber" />
                            </div>
                        </div>
                    </div>

                    {/* ─── Dynamic Tabs Section ─────────────────────────── */}
                    <div className="mt-12">
                        <div className="border-b border-gray-200 dark:border-gray-800">
                            <nav className="flex gap-4 sm:gap-8 -mb-px overflow-x-auto scrollbar-none">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 pb-3.5 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                            : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="mt-6">
                            {/* Overview Tab */}
                            {activeTab === 'details' && (
                                <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
                                    <div>
                                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-2">Product Description</h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {product.description || 'This premium fabric roll is manufactured to industry standard specifications for garments and textile manufacturing. Sourced directly from verified mills with guaranteed quality inspection.'}
                                        </p>
                                    </div>

                                    {hasVariants && (
                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700/80">
                                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-indigo-500" />
                                                Available Variants & Colors ({product.variants.length})
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                {product.variants.map((v, idx) => (
                                                    <div key={v.id || idx} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-xs text-gray-900 dark:text-white">
                                                                {v.color_name || 'Standard Color'}
                                                            </p>
                                                            {v.sku && <p className="text-[10px] text-gray-400 mt-0.5">SKU: {v.sku}</p>}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-xs text-indigo-600 dark:text-indigo-400">₹{v.price || price} / {unit}</p>
                                                            <p className={`text-[10px] font-semibold ${(v.available_quantity || 0) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                                {(v.available_quantity || 0) > 0 ? `${v.available_quantity} in stock` : 'Out of stock'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Technical Specifications Tab */}
                            {activeTab === 'specifications' && (
                                <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
                                    <div>
                                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4 text-indigo-500" />
                                            Fabric Technical Parameters
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            <SpecItem label="Category" value={product.category_name || product.category?.name} />
                                            <SpecItem label="Fabric Type" value={product.fabric_type_name || product.fabric_type} />
                                            <SpecItem label="Brand" value={product.brand} />
                                            <SpecItem label="Minimum Order Quantity" value={`${moq} ${unit}s`} />
                                            <SpecItem label="Selling Unit" value={unit} />
                                            <SpecItem label="Stock Availability" value={formatUnitQuantity(availableStock, unit)} />
                                            <SpecItem label="SKU Code" value={product.sku || `SKU-${product.id}`} />
                                            <SpecItem label="Dispatch Time" value="2-4 Weeks" />
                                        </div>
                                    </div>

                                    {hasAttributes && (
                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white mb-3">Custom Textile Attributes</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {product.attributes.map((attr, idx) => (
                                                    <div key={attr.id || idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{attr.attribute_name}</span>
                                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{attr.attribute_value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Supplier Profile Tab */}
                            {activeTab === 'supplier' && (
                                <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-md flex-shrink-0">
                                                {(product.supplier_name || 'V')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                                                        {product.supplier_name || 'Verified Mill Partner'}
                                                    </h3>
                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Direct Textile Mill & Wholesale Manufacturer</p>
                                            </div>
                                        </div>

                                        {product.supplier_id && (
                                            <Button
                                                onClick={() => navigate(`/buyer/supplier/${product.supplier_id}`)}
                                                variant="outline"
                                                size="sm"
                                                icon={ExternalLink}
                                            >
                                                View Mill Profile
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 text-center">
                                            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Verification Status</p>
                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">GST & Factory Verified Supplier</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Related Products Grid ────────────────────────── */}
                    {related.length > 0 && (
                        <div className="mt-14">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Similar Fabric Listings</h2>
                                    <p className="text-xs text-gray-400">More fabrics from this category</p>
                                </div>
                                <button
                                    onClick={() => navigate('/buyer')}
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    View All Catalog <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {related.map(rp => (
                                    <div
                                        key={rp.id}
                                        onClick={() => {
                                            setSelectedImageIndex(0);
                                            setCartStatus({ type: '', text: '' });
                                            navigate(`/buyer/product/${rp.id}`);
                                        }}
                                        className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                                                {rp.primary_image_url || rp.image_url ? (
                                                    <img src={rp.primary_image_url || rp.image_url} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                                ) : (
                                                    <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                                )}
                                                <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded-md">
                                                    MOQ: {rp.minimum_order_quantity || 1}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {rp.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{rp.category_name || 'Fabric'}</p>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                ₹{rp.price || rp.base_price} <span className="text-[10px] font-normal text-gray-400">/ {getProductUnit(rp)}</span>
                                            </p>
                                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                                                View <ChevronRight className="w-3 h-3 ml-0.5" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── Recently Viewed Products Grid ─────────────────── */}
                    {recentlyViewed.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-gray-200/80 dark:border-gray-800">
                            <div className="mb-6">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">Recently Viewed Fabrics</h2>
                                <p className="text-xs text-gray-400">Items you previously explored in this session</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {recentlyViewed.map(rv => (
                                    <div
                                        key={rv.id}
                                        onClick={() => {
                                            setSelectedImageIndex(0);
                                            setCartStatus({ type: '', text: '' });
                                            navigate(`/buyer/product/${rv.id}`);
                                        }}
                                        className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                                                {rv.primary_image_url ? (
                                                    <img src={rv.primary_image_url} alt={rv.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                                ) : (
                                                    <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                {rv.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{rv.category_name || 'Fabric'}</p>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                            <p className="text-xs font-black text-purple-600 dark:text-purple-400">
                                                ₹{rv.price} <span className="text-[10px] font-normal text-gray-400">/ {rv.unit_name || 'Unit'}</span>
                                            </p>
                                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                                                Revisit <ChevronRight className="w-3 h-3 ml-0.5" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Full Screen Image Modal ──────────────────────────── */}
                {showImageModal && imageList[selectedImageIndex] && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setShowImageModal(false)}
                    >
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        {imageList.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleImageNavigate('prev'); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleImageNavigate('next'); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}
                        <img
                            src={imageList[selectedImageIndex]}
                            alt={product.name}
                            className="max-w-full max-h-[85vh] object-contain rounded-xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {imageList.length > 1 && (
                            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-full">
                                {selectedImageIndex + 1} / {imageList.length}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    );
}