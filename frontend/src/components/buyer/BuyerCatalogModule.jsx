import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useCartAuthorization } from '../../hooks/useCartAuthorization';
import { getProducts, prefetchProductDetails } from '../../services/productService';
import { getCategories } from '../../services/adminService';
import { getSuppliers } from '../../services/buyerService';
import { getProductUnit, formatUnitQuantity } from '../../utils/productUtils';
import {
    Search,
    SlidersHorizontal,
    Grid,
    List,
    Package,
    X,
    ArrowUpDown,
    Heart,
    Eye,
    ShoppingCart,
    RefreshCw,
    Tag,
    ExternalLink,
    Building2,
    Sparkles,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Clock,
    History,
    TrendingUp,
    MapPin
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const POPULAR_SEARCHES = [
    'Organic Cotton',
    'Mulberry Silk',
    'Heavyweight Denim',
    'Technical Ripstop',
    'Linen Weave'
];

const CATEGORY_EMOJIS = {
    'cotton': '🌿',
    'silk': '✨',
    'wool': '🐑',
    'linen': '🌾',
    'synthetic': '🧪',
    'denim': '👖',
    'technical': '⚙️',
    'embroidery': '🎀',
    'fabric': '🧵'
};

const getCategoryEmoji = (catName = '', catSlug = '') => {
    const key = (catSlug || catName).toLowerCase();
    for (const [k, emoji] of Object.entries(CATEGORY_EMOJIS)) {
        if (key.includes(k)) return emoji;
    }
    return '🧵';
};

// ─── Memoized Product Card Component ─────────────────────────────────────
const ProductCard = React.memo(function ProductCard({
    product,
    viewMode,
    isFav,
    onToggleFavorite,
    onViewProduct,
    onAddToCart,
    onQuickView
}) {
    const { user } = useAuthStore();
    const isSupplier = (user?.role || '').toUpperCase() === 'SUPPLIER';
    const availableStock = product.available_quantity ?? product.total_available_stock ?? product.available_stock ?? product.stock ?? 0;
    const price = Number(product.price || product.base_price || 0);
    const isLowStock = availableStock > 0 && availableStock <= 10;
    const unitLabel = getProductUnit(product);
    const minOrderQty = product.minimum_order_quantity || 1;
    const categoryName = product.category?.name || product.category_name || 'Fabric';
    const brandName = product.brand || product.supplier_name || 'Verified Mill';
    const leadTime = product.lead_time || product.dispatch_time || '3-5 Business Days';
    const location = product.origin_location || product.location || null;

    return (
        <div
            onMouseEnter={() => prefetchProductDetails(product.id)}
            className={`group bg-[var(--bg-elevated)] rounded-2xl border theme-border-color overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 h-full flex flex-col justify-between ${viewMode === 'list' ? 'sm:flex-row gap-4 sm:gap-6' : ''
                }`}
        >
            {/* Image Container */}
            <div
                onClick={(e) => onViewProduct(product, e)}
                className={`relative overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 ${viewMode === 'list' ? 'w-full sm:w-60 h-56 sm:h-auto flex-shrink-0' : 'h-52 w-full'
                    }`}
            >
                {product.primary_image_url ? (
                    <img
                        src={product.primary_image_url}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                            }
                        }}
                    />
                ) : null}

                {/* SVG Textile Pattern Fallback */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-indigo-950/20 dark:from-indigo-950/40 dark:to-purple-950/50"
                    style={{ display: product.primary_image_url ? 'none' : 'flex' }}
                >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-1.5 shadow-xs">
                        <Package className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">VFABRICA TEXTILE</span>
                    <span className="text-[10px] theme-text-subtle font-medium">Verified Mill Weave</span>
                </div>

                {/* Top Left: Category Badge */}
                <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-white/90 dark:bg-gray-900/90 text-indigo-600 dark:text-indigo-400 backdrop-blur-md shadow-xs border border-white/20 flex items-center gap-1">
                        <span>{getCategoryEmoji(categoryName)}</span>
                        <span>{categoryName}</span>
                    </span>
                </div>

                {/* Top Right: Heart Toggle */}
                <button
                    onClick={(e) => onToggleFavorite(product.id, e)}
                    className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all shadow-sm cursor-pointer ${isFav
                        ? 'bg-rose-500 text-white scale-105'
                        : 'bg-white/80 dark:bg-gray-900/80 text-gray-500 dark:text-gray-300 hover:text-rose-500 hover:bg-white'
                        }`}
                    title={isFav ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                </button>

                {/* Bottom Left: Stock Availability Badge */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
                    {availableStock > 0 ? (
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border shadow-xs backdrop-blur-md ${isLowStock
                            ? 'bg-amber-500/90 text-white border-amber-400/30'
                            : 'bg-emerald-600/90 text-white border-emerald-400/30'
                            }`}>
                            {isLowStock ? `Only ${availableStock}${unitLabel} left` : `In Stock (${formatUnitQuantity(availableStock, unitLabel)})`}
                        </span>
                    ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600/90 text-white border border-rose-400/30 shadow-xs backdrop-blur-md">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Quick View Button Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                        onClick={(e) => onQuickView(product, e)}
                        className="px-4 py-2 bg-white/95 text-gray-900 font-bold text-xs rounded-xl shadow-lg hover:bg-indigo-600 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0 duration-200 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Quick View
                    </button>
                </div>
            </div>

            {/* Product Information Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                    {/* Supplier & Verified Badge Header */}
                    <div className="flex items-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        <div className="flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                            <span className="truncate">{brandName}</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" title="Verified Supplier" />
                        </div>
                    </div>

                    {/* Product Title */}
                    <h3
                        onClick={(e) => onViewProduct(product, e)}
                        className="font-bold text-sm theme-text-main line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                        {product.name}
                    </h3>

                    {/* Location & Dispatch Meta */}
                    <div className="flex items-center gap-3 text-[11px] theme-text-subtle mt-0.5 font-medium">
                        {location && (
                            <>
                                <span className="flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3 text-indigo-500" />
                                    {location}
                                </span>
                                <span>•</span>
                            </>
                        )}
                        <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {leadTime}
                        </span>
                    </div>

                    {/* B2B Attribute Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {product.gsm && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border theme-border-color">
                                {product.gsm} GSM
                            </span>
                        )}
                        {product.width && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border theme-border-color">
                                Width: {product.width}"
                            </span>
                        )}
                        {product.material_composition && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 truncate max-w-[130px]">
                                {product.material_composition}
                            </span>
                        )}
                    </div>
                </div>

                {/* Price, MOQ, and Action Buttons */}
                <div className="pt-3 border-t theme-border-color space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                ₹{price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] theme-text-subtle ml-1 font-medium">/{unitLabel}</span>
                        </div>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                            MOQ: {minOrderQty}{unitLabel}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => onViewProduct(product, e)}
                            icon={Eye}
                        >
                            View Details
                        </Button>

                        {isSupplier ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => onAddToCart(product, e)}
                                className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800 text-[10px]"
                                title="Only buyers can purchase products."
                            >
                                Buyers Only
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => onAddToCart(product, e)}
                                disabled={availableStock <= 0}
                                icon={ShoppingCart}
                            >
                                Add to Cart
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

// ─── Main Catalog Module ────────────────────────────────────────────────
export function BuyerCatalogModule({ setMessage }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuthStore();
    const { fetchFavorites, isFavorite, toggleFavorite: storeToggleFavorite } = useFavoritesStore();
    const { handleAddToCart: authorizeAndAddToCart } = useCartAuthorization();

    const catalogTab = searchParams.get('mode') === 'suppliers' ? 'suppliers' : 'fabrics';

    const [products, setProducts] = React.useState([]);
    const [suppliers, setSuppliers] = React.useState([]);
    const [categories, setCategories] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [suppliersLoading, setSuppliersLoading] = React.useState(false);

    React.useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const urlSearch = searchParams.get('search') || '';
    const urlSupplierId = searchParams.get('supplierId') || searchParams.get('supplier') || searchParams.get('supplier_id') || '';
    const [searchInput, setSearchInput] = React.useState(urlSearch);
    const [isSearchFocused, setIsSearchFocused] = React.useState(false);
    const [recentSearches, setRecentSearches] = React.useState(() => {
        try {
            return JSON.parse(localStorage.getItem('vfabrica_recent_searches') || '[]');
        } catch {
            return [];
        }
    });

    const [selectedCategory, setSelectedCategory] = React.useState('');
    const [viewMode, setViewMode] = React.useState('grid');
    const [showFilters, setShowFilters] = React.useState(false);
    const [sortBy, setSortBy] = React.useState('newest');
    const [sortOrder, setSortOrder] = React.useState('desc');
    const [maxPriceLimit, setMaxPriceLimit] = React.useState(2500);
    const [stockFilter, setStockFilter] = React.useState('all');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [quickViewProduct, setQuickViewProduct] = React.useState(null);

    React.useEffect(() => {
        setSearchInput(urlSearch);
    }, [urlSearch]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [urlSearch, selectedCategory, urlSupplierId, maxPriceLimit, stockFilter, sortBy]);

    const saveRecentSearch = (term) => {
        if (!term.trim()) return;
        setRecentSearches(prev => {
            const next = [term, ...prev.filter(t => t !== term)].slice(0, 5);
            try {
                localStorage.setItem('vfabrica_recent_searches', JSON.stringify(next));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== urlSearch) {
                const newParams = new URLSearchParams(searchParams);
                if (searchInput) {
                    newParams.set('search', searchInput);
                    saveRecentSearch(searchInput);
                } else {
                    newParams.delete('search');
                }
                setSearchParams(newParams, { replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, urlSearch, searchParams, setSearchParams]);

    React.useEffect(() => {
        let isMounted = true;
        getCategories()
            .then(res => {
                if (isMounted) setCategories(res.data || []);
            })
            .catch(err => console.error('Failed to load categories:', err));
        return () => { isMounted = false; };
    }, []);

    const loadProducts = React.useCallback(async () => {
        setLoading(true);
        try {
            const prodsRes = await getProducts({
                search: urlSearch || undefined,
                categoryId: selectedCategory || undefined,
                supplierId: urlSupplierId || undefined,
                maxPrice: maxPriceLimit < 2500 ? maxPriceLimit : undefined,
                sortBy,
                filter: [],
                sort: []
            });
            setProducts(prodsRes.data || []);
        } catch (e) {
            console.error('Failed to load products:', e);
        } finally {
            setLoading(false);
        }
    }, [urlSearch, selectedCategory, urlSupplierId, maxPriceLimit, sortBy]);

    const loadSuppliers = React.useCallback(async () => {
        setSuppliersLoading(true);
        try {
            const res = await getSuppliers({ search: urlSearch || undefined });
            setSuppliers(res.data || []);
        } catch (e) {
            console.error('Failed to load suppliers:', e);
        } finally {
            setSuppliersLoading(false);
        }
    }, [urlSearch]);

    React.useEffect(() => {
        if (catalogTab === 'suppliers') {
            loadSuppliers();
        } else {
            loadProducts();
        }
    }, [catalogTab, loadProducts, loadSuppliers]);

    const selectedCategoryObj = React.useMemo(() => {
        return categories.find(c => String(c.id) === String(selectedCategory));
    }, [categories, selectedCategory]);

    const filteredProducts = React.useMemo(() => {
        let filtered = [...products];

        if (urlSearch) {
            const searchLower = urlSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower) ||
                p.category?.name?.toLowerCase().includes(searchLower) ||
                p.brand?.toLowerCase().includes(searchLower)
            );
        }

        if (maxPriceLimit < 2500) {
            filtered = filtered.filter(p => (p.price || p.base_price || 0) <= maxPriceLimit);
        }

        if (stockFilter === 'inStock') {
            filtered = filtered.filter(p => (p.available_quantity ?? p.total_available_stock ?? p.available_stock ?? p.stock ?? 0) > 0);
        } else if (stockFilter === 'outOfStock') {
            filtered = filtered.filter(p => (p.available_quantity ?? p.total_available_stock ?? p.available_stock ?? p.stock ?? 0) === 0);
        }

        const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => ((a.price || a.base_price || 0) - (b.price || b.base_price || 0)) * sortMultiplier);
                break;
            case 'price-high':
                filtered.sort((a, b) => ((b.price || b.base_price || 0) - (a.price || a.base_price || 0)) * sortMultiplier);
                break;
            case 'name':
                filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '') * sortMultiplier);
                break;
            case 'moq':
                filtered.sort((a, b) => ((a.minimum_order_quantity || 1) - (b.minimum_order_quantity || 1)) * sortMultiplier);
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => (new Date(b.created_at || 0) - new Date(a.created_at || 0)) * sortMultiplier);
                break;
        }

        return filtered;
    }, [products, urlSearch, maxPriceLimit, stockFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

    const paginatedProducts = React.useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const handlePageChange = React.useCallback((page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 100, behavior: 'smooth' });
        }
    }, [totalPages]);

    const handleAddToCart = React.useCallback((product, e, customQty) => {
        if (e) e.stopPropagation();
        const res = authorizeAndAddToCart(product, customQty, { showToast: setMessage });
        if (res.allowed) {
            const unitName = getProductUnit(product);
            const qtyAdded = customQty || product.minimum_order_quantity || 1;
            if (setMessage) {
                setMessage(`✨ Added ${formatUnitQuantity(qtyAdded, unitName)} of ${product.name} to cart`);
                setTimeout(() => setMessage(''), 3500);
            }
        }
    }, [authorizeAndAddToCart, setMessage]);

    const handleViewProduct = React.useCallback((product, e) => {
        if (e) e.stopPropagation();
        navigate(`/buyer/product/${product.id}`);
    }, [navigate]);

    const toggleFavorite = React.useCallback(async (product, e) => {
        if (e) e.stopPropagation();
        if (!isAuthenticated) {
            if (setMessage) {
                setMessage('🔒 Please sign in to save favorites');
                setTimeout(() => setMessage(''), 3500);
            }
            navigate('/auth/login?message=Please%20sign%20in%20to%20save%20favorites.');
            return;
        }
        const res = await storeToggleFavorite(product);
        if (res && res.success) {
            if (setMessage) {
                setMessage(res.isFavorite ? `❤️ Saved ${product.name} to wishlist` : `Removed ${product.name} from wishlist`);
                setTimeout(() => setMessage(''), 3500);
            }
        } else if (res && res.status === 401) {
            if (setMessage) {
                setMessage('🔒 Please sign in to save favorites');
                setTimeout(() => setMessage(''), 3500);
            }
            navigate('/auth/login?message=Please%20sign%20in%20to%20save%20favorites.');
        } else {
            if (setMessage) {
                setMessage(`⚠️ ${res?.message || 'Failed to update favorites'}`);
                setTimeout(() => setMessage(''), 3500);
            }
        }
    }, [isAuthenticated, navigate, storeToggleFavorite, setMessage]);

    const handleQuickView = React.useCallback((product, e) => {
        if (e) e.stopPropagation();
        setQuickViewProduct(product);
    }, []);

    const clearAllCatalogFilters = React.useCallback(() => {
        if (urlSearch || searchInput) {
            setSearchInput('');
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('search');
            setSearchParams(newParams, { replace: true });
        }
        setSelectedCategory('');
        setMaxPriceLimit(2500);
        setStockFilter('all');
        setSortBy('newest');
    }, [urlSearch, searchInput, searchParams, setSearchParams]);

    const activeFilterCount = [
        selectedCategory ? 1 : 0,
        maxPriceLimit < 2500 ? 1 : 0,
        stockFilter !== 'all' ? 1 : 0
    ].reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-4">
            {/* Primary Mode Switcher: Fabrics vs Mills & Suppliers */}
            <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-elevated)] rounded-2xl border theme-border-color shadow-xs w-fit">
                <button
                    onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('mode');
                        setSearchParams(newParams);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${catalogTab === 'fabrics'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                        : 'theme-text-subtle hover:theme-text-main'
                        }`}
                >
                    <Package className="w-4 h-4" />
                    <span>Fabrics</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${catalogTab === 'fabrics' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-800 theme-text-main'}`}>
                        {products.length}
                    </span>
                </button>

                <button
                    onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('mode', 'suppliers');
                        setSearchParams(newParams);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${catalogTab === 'suppliers'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                        : 'theme-text-subtle hover:theme-text-main'
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    <span>Mills & Suppliers</span>
                    {suppliers.length > 0 && (
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${catalogTab === 'suppliers' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-800 theme-text-main'}`}>
                            {suppliers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Active Supplier Filter Indicator */}
            {urlSupplierId && (
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Supplier Filter Active:
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-full border border-indigo-200 dark:border-indigo-800 shadow-sm">
                        <Building2 className="w-3.5 h-3.5" />
                        {products[0]?.supplier_name || 'Supplier'}
                        <button
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.delete('supplierId');
                                newParams.delete('supplier');
                                newParams.delete('supplier_id');
                                setSearchParams(newParams);
                            }}
                            className="ml-1 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Clear supplier filter"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </span>
                </div>
            )}

            {/* 1. Category Chips Strip */}
            <div className="relative">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${!selectedCategory
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                            : 'bg-[var(--bg-elevated)] theme-text-main hover:bg-[var(--bg)] border theme-border-color hover:border-indigo-400'
                            }`}
                    >
                        <span>✨ All Fabrics</span>
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                            {products.length}
                        </span>
                    </button>

                    {categories.map((cat) => {
                        const isSelected = String(cat.id) === String(selectedCategory);
                        const emoji = getCategoryEmoji(cat.name, cat.slug);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(isSelected ? '' : String(cat.id))}
                                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${isSelected
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                                    : 'bg-[var(--bg-elevated)] theme-text-main hover:bg-[var(--bg)] border theme-border-color hover:border-indigo-400'
                                    }`}
                            >
                                <span>{emoji} {cat.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Sticky Search Bar & Controls Toolbar */}
            <div className="sticky top-16 z-30 bg-[var(--bg-elevated)]/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border theme-border-color shadow-sm transition-all">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Primary Search Input with Dropdown */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search fabrics, GSM, composition, weave, suppliers..."
                            value={searchInput}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                        />
                        {searchInput && (
                            <button
                                onClick={() => {
                                    setSearchInput('');
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.delete('search');
                                    setSearchParams(newParams, { replace: true });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
                                title="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Search Suggestions Dropdown */}
                        {isSearchFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-elevated)] rounded-2xl border theme-border-color shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="mb-3">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        <TrendingUp className="w-3 h-3 text-amber-500" /> Popular Searches
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {POPULAR_SEARCHES.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onMouseDown={() => setSearchInput(item)}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--bg)] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 theme-text-main hover:text-indigo-600 border theme-border-color transition-colors cursor-pointer"
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {recentSearches.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            <History className="w-3 h-3 text-indigo-500" /> Recent Searches
                                        </div>
                                        <div className="space-y-1">
                                            {recentSearches.map((term, idx) => (
                                                <button
                                                    key={idx}
                                                    onMouseDown={() => setSearchInput(term)}
                                                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium theme-text-main hover:bg-[var(--bg)] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                                                >
                                                    <span>{term}</span>
                                                    <Search className="w-3 h-3 text-gray-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Filter & View Controls */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 md:pb-0">
                        {/* Stock Filter */}
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="px-3 py-2 text-xs font-semibold bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer flex-shrink-0"
                        >
                            <option value="all">📦 All Stock</option>
                            <option value="inStock">✅ Available Only</option>
                            <option value="outOfStock">⚠️ Out of Stock</option>
                        </select>

                        {/* Sort Dropdown */}
                        <div className="relative flex-shrink-0">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="newest">⚡ Newest First</option>
                                <option value="price-low">🏷️ Price: Low to High</option>
                                <option value="price-high">💎 Price: High to Low</option>
                                <option value="moq">📦 MOQ: Low to High</option>
                                <option value="name">🔤 Name: A-Z</option>
                            </select>
                            <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 theme-text-subtle pointer-events-none" />
                        </div>

                        {/* Extended Filter Panel Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${showFilters || activeFilterCount > 0
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-[var(--bg)] theme-text-main border theme-border-color hover:bg-[var(--bg-elevated)]'
                                }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="w-4 h-4 bg-white text-indigo-700 text-[10px] font-black rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-0.5 p-1 bg-[var(--bg)] rounded-xl border theme-border-color flex-shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                                    ? 'bg-[var(--bg-elevated)] text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                                    : 'theme-text-subtle hover:theme-text-main'
                                    }`}
                                title="Grid View"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list'
                                    ? 'bg-[var(--bg-elevated)] text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                                    : 'theme-text-subtle hover:theme-text-main'
                                    }`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Extended Filter Panel with Price Range Slider */}
                {showFilters && (
                    <div className="mt-3 pt-3 border-t theme-border-color grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <div className="flex items-center justify-between text-[11px] font-bold theme-text-subtle uppercase tracking-wider mb-1">
                                <span>Max Price Limit</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                                    {maxPriceLimit < 2500 ? `Up to ₹${maxPriceLimit}/m` : 'All Prices'}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="2500"
                                step="50"
                                value={maxPriceLimit}
                                onChange={(e) => setMaxPriceLimit(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] theme-text-subtle font-semibold mt-1">
                                <span>₹100</span>
                                <span>₹1,250</span>
                                <span>₹2,500+</span>
                            </div>
                        </div>

                        <div className="sm:col-span-2 flex items-end justify-between gap-3">
                            <div className="flex-1">
                                <label className="block text-[11px] font-bold theme-text-subtle uppercase tracking-wider mb-1">
                                    Category Taxonomy
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={clearAllCatalogFilters}
                                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Filters Bar */}
                {(urlSearch || selectedCategory || maxPriceLimit < 2500 || stockFilter !== 'all') && (
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t theme-border-color text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 text-[11px]">
                            <Tag className="w-3 h-3 text-indigo-500" /> Active Filters:
                        </span>

                        {urlSearch && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Search: "{urlSearch}"
                                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setSearchInput('')} />
                            </span>
                        )}

                        {selectedCategory && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Category: {selectedCategoryObj?.name || 'Selected'}
                                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setSelectedCategory('')} />
                            </span>
                        )}

                        {maxPriceLimit < 2500 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Max Price: ₹{maxPriceLimit}
                                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setMaxPriceLimit(2500)} />
                            </span>
                        )}

                        {stockFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Stock: {stockFilter === 'inStock' ? 'Available' : 'Out of Stock'}
                                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setStockFilter('all')} />
                            </span>
                        )}

                        <button
                            onClick={clearAllCatalogFilters}
                            className="text-[11px] font-bold text-rose-500 hover:text-rose-600 ml-auto cursor-pointer"
                        >
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* 3. Products / Suppliers Grid & Pagination */}
            {catalogTab === 'suppliers' ? (
                suppliersLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-pulse bg-[var(--bg-elevated)] rounded-2xl border theme-border-color p-6 h-48" />
                        ))}
                    </div>
                ) : suppliers.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--bg-elevated)] rounded-3xl border theme-border-color p-8 shadow-sm">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold theme-text-main mb-1">No verified suppliers found</h3>
                        <p className="text-xs theme-text-subtle max-w-sm mx-auto mb-6">
                            {urlSearch ? `No mills or suppliers matched "${urlSearch}".` : 'No supplier profiles are currently registered.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {suppliers.map(supplier => (
                            <div
                                key={supplier.id}
                                className="bg-[var(--bg-elevated)] rounded-2xl border theme-border-color p-5 shadow-xs hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between space-y-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-md flex-shrink-0">
                                            {(supplier.company_name || supplier.name || 'S').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-extrabold text-base theme-text-main line-clamp-1">
                                                    {supplier.company_name || supplier.name || 'Textile Mill'}
                                                </h3>
                                                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" title="Verified Textile Supplier" />
                                            </div>
                                            {(supplier.location || supplier.city) && (
                                                <div className="flex items-center gap-1 text-xs theme-text-subtle mt-0.5">
                                                    <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                                    <span className="truncate">{supplier.location || supplier.city}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs theme-text-subtle line-clamp-2 leading-relaxed">
                                    {supplier.company_description || supplier.description || 'Verified manufacturer and wholesale distributor of certified woven and knitted fabrics.'}
                                </p>

                                {supplier.categories && supplier.categories.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {supplier.categories.filter(Boolean).slice(0, 4).map((catName, idx) => (
                                            <span key={idx} className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                                                {catName}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-3 border-t theme-border-color flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        <Package className="w-4 h-4" />
                                        <span>{supplier.product_count ?? supplier.products_count ?? 0} Products</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.delete('mode');
                                            newParams.set('supplierId', supplier.id);
                                            setSearchParams(newParams);
                                        }}
                                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>View Products</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="animate-pulse bg-[var(--bg-elevated)] rounded-2xl border theme-border-color overflow-hidden flex flex-col h-[380px]">
                            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-t-2xl" />
                            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                                </div>
                                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-[var(--bg-elevated)] rounded-3xl border theme-border-color shadow-sm p-8">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold theme-text-main mb-1">No matching fabrics found</h3>
                    <p className="text-xs theme-text-subtle max-w-sm mx-auto mb-6">
                        {urlSearch || activeFilterCount > 0
                            ? 'Try adjusting your search keyword or clearing active filters.'
                            : 'No product inventory is currently listed in this category.'}
                    </p>
                    {(urlSearch || activeFilterCount > 0) && (
                        <button
                            onClick={clearAllCatalogFilters}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset All Filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className={`grid gap-5 sm:gap-6 ${viewMode === 'grid'
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch'
                        : 'grid-cols-1'
                        }`}>
                        {paginatedProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                viewMode={viewMode}
                                isFav={isFavorite(product.id)}
                                onToggleFavorite={(pId, e) => toggleFavorite(product, e)}
                                onViewProduct={handleViewProduct}
                                onAddToCart={handleAddToCart}
                                onQuickView={handleQuickView}
                            />
                        ))}
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t theme-border-color mt-6">
                        <div className="text-xs theme-text-subtle font-medium text-center sm:text-left">
                            Showing <span className="font-bold theme-text-main">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)}</span> to{' '}
                            <span className="font-bold theme-text-main">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of{' '}
                            <span className="font-bold theme-text-main">{filteredProducts.length}</span> fabrics
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border theme-border-color theme-text-main hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === page
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-[var(--bg-elevated)] theme-text-main border theme-border-color hover:bg-[var(--bg)]'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border theme-border-color theme-text-main hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    title="Next Page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* 4. Quick View Specification Modal Overlay */}
            {quickViewProduct && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity animate-in fade-in"
                    onClick={() => setQuickViewProduct(null)}
                >
                    <div
                        className="bg-[var(--bg-elevated)] rounded-3xl max-w-2xl w-full border theme-border-color shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 sm:p-5 border-b theme-border-color flex items-center justify-between bg-gradient-to-r from-indigo-900 to-purple-900 text-white">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <h3 className="font-bold text-base">Quick Specification Sheet</h3>
                            </div>
                            <button
                                onClick={() => setQuickViewProduct(null)}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
                            <div className="space-y-3">
                                <div className="h-60 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border theme-border-color relative">
                                    {quickViewProduct.primary_image_url ? (
                                        <img
                                            src={quickViewProduct.primary_image_url}
                                            alt={quickViewProduct.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-12 h-12 text-indigo-400 opacity-40" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 rounded-xl bg-[var(--bg)] border theme-border-color text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="theme-text-subtle">Category:</span>
                                        <span className="font-bold theme-text-main">{quickViewProduct.category?.name || quickViewProduct.category_name || 'Fabric'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="theme-text-subtle">Supplier / Mill:</span>
                                        <span className="font-bold theme-text-main">{quickViewProduct.brand || 'Verified Mill'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold theme-text-main mb-2">
                                        {quickViewProduct.name}
                                    </h2>
                                    <p className="text-xs theme-text-subtle leading-relaxed mb-4">
                                        {quickViewProduct.description || 'Premium wholesale fabric available for custom bulk manufacturing.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                                        <div className="p-2.5 rounded-xl bg-[var(--bg)] border theme-border-color">
                                            <span className="block text-[10px] theme-text-subtle font-semibold">Base Price</span>
                                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                                ₹{Number(quickViewProduct.price || quickViewProduct.base_price || 0).toLocaleString('en-IN')}/{getProductUnit(quickViewProduct)}
                                            </span>
                                        </div>

                                        <div className="p-2.5 rounded-xl bg-[var(--bg)] border theme-border-color">
                                            <span className="block text-[10px] theme-text-subtle font-semibold">Min Order (MOQ)</span>
                                            <span className="font-bold theme-text-main text-xs">
                                                {quickViewProduct.minimum_order_quantity || 1} {getProductUnit(quickViewProduct)}
                                            </span>
                                        </div>

                                        {quickViewProduct.gsm && (
                                            <div className="p-2.5 rounded-xl bg-[var(--bg)] border theme-border-color">
                                                <span className="block text-[10px] theme-text-subtle font-semibold">Fabric Weight</span>
                                                <span className="font-bold theme-text-main text-xs">{quickViewProduct.gsm} GSM</span>
                                            </div>
                                        )}

                                        {quickViewProduct.width && (
                                            <div className="p-2.5 rounded-xl bg-[var(--bg)] border theme-border-color">
                                                <span className="block text-[10px] theme-text-subtle font-semibold">Full Width</span>
                                                <span className="font-bold theme-text-main text-xs">{quickViewProduct.width} inches</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t theme-border-color">
                                    <div className="flex items-center gap-2">
                                        {isSupplier ? (
                                            <button
                                                onClick={(e) => {
                                                    handleAddToCart(quickViewProduct, e);
                                                    setQuickViewProduct(null);
                                                }}
                                                className="flex-1 py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                                                title="Only buyers can purchase products."
                                            >
                                                Only buyers can purchase products.
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    handleAddToCart(quickViewProduct, e);
                                                    setQuickViewProduct(null);
                                                }}
                                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-all cursor-pointer"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                Add to Cart
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                const pId = quickViewProduct.id;
                                                setQuickViewProduct(null);
                                                navigate(`/buyer/product/${pId}`);
                                            }}
                                            className="py-3 px-4 rounded-xl border theme-border-color theme-text-main font-bold text-xs hover:bg-[var(--bg)] transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span>Full Page</span>
                                            <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}