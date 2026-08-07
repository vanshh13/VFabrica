import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useCartAuthorization } from '../hooks/useCartAuthorization';
import { getProductUnit, formatUnitQuantity } from '../utils/productUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    MapPin,
    Shield,
    ArrowRight,
    MessageSquare,
    Lock,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Package,
    Sparkles,
    Ruler,
    Palette,
    Truck,
    GitBranch,
    Heart,
    ShoppingCart,
    Eye,
    CheckCircle2,
    Building2,
    SlidersHorizontal
} from 'lucide-react';
import { getCategories } from '../services/adminService';
import { getSuppliers } from '../services/buyerService';
import { getProducts } from '../services/productService';

// Category Emoji Helper
function getCategoryIcon(name = '') {
    const n = name.toLowerCase();
    if (n.includes('cotton')) return '🌿';
    if (n.includes('silk')) return '✨';
    if (n.includes('linen')) return '🌾';
    if (n.includes('wool')) return '🐑';
    if (n.includes('denim')) return '👖';
    if (n.includes('cloth') || n.includes('apparel')) return '👕';
    if (n.includes('fabric')) return '🧵';
    return '📦';
}

const CATEGORY_COLORS = [
    'from-indigo-500 to-purple-600',
    'from-purple-500 to-pink-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600'
];

export function HomePage() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const { addItem } = useCartStore();
    const { fetchFavorites, toggleFavorite, isFavorite } = useFavoritesStore();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState('');

    // Dynamic API Data State
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);

    const categoryCarouselRef = useRef(null);
    const role = (user?.role || '').toUpperCase();

    // Single Batch Effect to Prevent Duplicate API Calls
    useEffect(() => {
        let isMounted = true;
        async function loadHomeData() {
            setLoading(true);
            try {
                const [catRes, supRes, featRes, newRes] = await Promise.allSettled([
                    getCategories(),
                    getSuppliers({ limit: 6 }),
                    getProducts({ limit: 8 }),
                    getProducts({ limit: 8, sortBy: 'newest' })
                ]);

                if (isMounted) {
                    if (catRes.status === 'fulfilled') {
                        setCategories(catRes.value?.data || []);
                    }
                    if (supRes.status === 'fulfilled') {
                        setSuppliers(supRes.value?.data || []);
                    }
                    if (featRes.status === 'fulfilled') {
                        const prods = featRes.value?.data || featRes.value?.items || (Array.isArray(featRes.value) ? featRes.value : []);
                        setFeaturedProducts(prods);
                    }
                    if (newRes.status === 'fulfilled') {
                        const newProds = newRes.value?.data || newRes.value?.items || (Array.isArray(newRes.value) ? newRes.value : []);
                        setNewArrivals(newProds);
                    }
                }
            } catch (err) {
                console.error('Failed to load homepage data:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadHomeData();
        fetchFavorites();

        return () => { isMounted = false; };
    }, [fetchFavorites]);

    useEffect(() => {
        if (!profileDropdownOpen) return;
        const close = () => setProfileDropdownOpen(false);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [profileDropdownOpen]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        navigate(`/buyer?${params.toString()}`);
    };

    const { isAuthenticated: isUserAuth, isSupplier: isUserSupplier, handleAddToCart: authorizeAndAddToCart } = useCartAuthorization();

    const handleAddToCart = (product, e) => {
        if (e) e.stopPropagation();
        const res = authorizeAndAddToCart(product, null, { showToast });
        if (res.allowed) {
            const unitName = getProductUnit(product);
            const qtyAdded = product.minimum_order_quantity || 1;
            showToast(`✨ Added ${formatUnitQuantity(qtyAdded, unitName)} of ${product.name} to cart`);
        }
    };

    const handleToggleFavorite = async (product, e) => {
        if (e) e.stopPropagation();
        if (!isUserAuth) {
            showToast('🔒 Please sign in to save favorites');
            navigate('/auth/login?message=Please%20sign%20in%20to%20save%20favorites.');
            return;
        }
        const res = await toggleFavorite(product);
        if (res && res.success) {
            showToast(res.isFavorite ? `❤️ Saved ${product.name} to favorites` : `Removed ${product.name} from favorites`);
        } else if (res && res.status === 401) {
            showToast('🔒 Please sign in to save favorites');
            navigate('/auth/login?message=Please%20sign%20in%20to%20save%20favorites.');
        } else {
            showToast(`⚠️ ${res?.message || 'Failed to update favorites'}`);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    const scrollCarousel = (direction) => {
        if (categoryCarouselRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            categoryCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const whyChooseUs = [
        { icon: Shield, title: 'Verified Mills & Suppliers', text: 'Every manufacturer on VFabrica is verified with active business credentials.' },
        { icon: Ruler, title: 'Direct Factory Specifications', text: 'Filter by fiber type, MOQ, GSM, and lead times directly from mills.' },
        { icon: MessageSquare, title: 'Direct Mill Contacts', text: 'Connect directly with suppliers. No agent commissions or hidden markups.' },
        { icon: Lock, title: 'Sample Swatches', text: 'Order swatches and sample yardage before committing to bulk manufacturing.' },
        { icon: Truck, title: 'Global Logistics Ready', text: 'Seamless shipment tracking from factory floor to production hub.' },
        { icon: Palette, title: 'Custom Developments', text: 'Collaborate with mills on proprietary fabric weaves, dyes, and finishes.' }
    ];

    const steps = [
        { icon: Search, title: 'Discover Fabrics', text: 'Search materials by category, composition, or mill region.' },
        { icon: Ruler, title: 'Compare Specs', text: 'Evaluate MOQ, lead times, and unit prices side-by-side.' },
        { icon: MessageSquare, title: 'Request Swatches', text: 'Contact mills directly for lab dips and sample yardage.' },
        { icon: Package, title: 'Receive Orders', text: 'Fulfill production orders with real-time tracking.' }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 animate-slide-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 flex items-center gap-3 border border-gray-200 dark:border-gray-700">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{toastMessage}</p>
                        <button onClick={() => setToastMessage('')} className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                                <GitBranch className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                VFabrica
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
                            <Link to="/buyer" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                Fabrics Catalog
                            </Link>
                            <Link to="/buyer?mode=suppliers" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                Mills & Suppliers
                            </Link>
                            <Link to="/buyer/favorites" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
                                <Heart className="w-4 h-4 text-rose-500" />
                                Favorites
                            </Link>
                        </nav>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            {isAuthenticated && user ? (
                                <div className="relative" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => setProfileDropdownOpen(v => !v)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                            {(user.email || 'U').slice(0, 2).toUpperCase()}
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                    </button>

                                    <AnimatePresence>
                                        {profileDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2"
                                            >
                                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-semibold">{role}</p>
                                                </div>
                                                <DropItem to="/buyer" icon="📊" label="Buyer Dashboard" close={() => setProfileDropdownOpen(false)} />
                                                <DropItem to="/buyer/favorites" icon="❤️" label="Saved Favorites" close={() => setProfileDropdownOpen(false)} />
                                                <DropItem to="/buyer/orders" icon="📦" label="My Orders" close={() => setProfileDropdownOpen(false)} />
                                                <DropItem to="/buyer/profile" icon="👤" label="Profile Settings" close={() => setProfileDropdownOpen(false)} />
                                                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                                                    <button
                                                        onClick={() => { logout(); setProfileDropdownOpen(false); navigate('/'); }}
                                                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                                    >
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="hidden sm:flex items-center gap-3">
                                    <Link to="/auth/login" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors">
                                        Sign In
                                    </Link>
                                    <Link to="/auth/buyer/register" className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xs">
                                        Register Free
                                    </Link>
                                </div>
                            )}

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-gray-600 dark:text-gray-300"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
                        >
                            <div className="px-4 py-4 space-y-3">
                                <Link to="/buyer" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold text-gray-700 dark:text-gray-300">Fabrics Catalog</Link>
                                <Link to="/buyer?mode=suppliers" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold text-gray-700 dark:text-gray-300">Mills & Suppliers</Link>
                                <Link to="/buyer/favorites" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold text-gray-700 dark:text-gray-300">Saved Favorites</Link>
                                {!isAuthenticated && (
                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                                        <Link to="/auth/login" className="block w-full text-center px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl">Sign In</Link>
                                        <Link to="/auth/buyer/register" className="block w-full text-center px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">Register Free</Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Compact Hero Section */}
            <section
                className="relative pt-8 pb-12 overflow-hidden border-b border-gray-100 dark:border-gray-800"
                style={{
                    backgroundImage: "url('https://images.openai.com/static-rsc-4/GppEG9NPO6F7EbHGrO3yJ4K5ycIbYcQxk1qOu3fhcRflLT-CBuNoYyHq1byfLPBzgyPfcWo8MI4btv16WQi2gbv9ez2dmaAAgFamGVkp4awtThRip8BR9C7TJPDehg2zVQYsUDcZO2DR6Dj0H9UpofuTgddkUcaJCqfZ4C3ZnnPBOjUmLG_Vys1iQkFnC3te?purpose=fullsize')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* Dark Overlay for text readability */}
                {/* <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/85 to-gray-900/70" /> */}

                {/* Subtle pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-bold text-white mb-4"
                        >
                            {/* <Sparkles className="w-3.5 h-3.5 text-amber-400" /> */}
                            Global B2B Fabric Sourcing Marketplace
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4"
                        >
                            Source Premium{' '}
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Wholesale Fabrics
                            </span>
                            {' '}Directly From Mills
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-xs sm:text-sm text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed"
                        >
                            Connect with verified textile manufacturers. Browse certified fabric inventory, evaluate technical specifications, and place sample orders directly.
                        </motion.p>

                        {/* Search & Quick Actions Form */}
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            onSubmit={handleSearchSubmit}
                            className="bg-white/15 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-2 flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto mb-4"
                        >
                            <div className="relative flex-1 w-full">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    type="text"
                                    placeholder="Search fabric type, category, GSM, weave, or mill..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-white placeholder-gray-400 focus:outline-none text-xs sm:text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
                            >
                                <span>Search</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.form>

                        {/* Quick Action Navigation Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex flex-wrap items-center justify-center gap-2 text-xs"
                        >
                            <button
                                onClick={() => navigate('/buyer')}
                                className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-white font-bold border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <Package className="w-3.5 h-3.5" />
                                <span>Browse Fabrics</span>
                            </button>
                            <button
                                onClick={() => navigate('/buyer?mode=suppliers')}
                                className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-white font-bold border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Browse Suppliers</span>
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Horizontal Categories Carousel */}
            {loading ? (
                <div className="py-8 max-w-7xl mx-auto px-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-4 animate-pulse" />
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="w-40 h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse flex-shrink-0" />
                        ))}
                    </div>
                </div>
            ) : categories.length > 0 && (
                <section className="py-8 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                    Fabric Categories
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Explore wholesale textiles by material taxonomy
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => scrollCarousel('left')}
                                    className="p-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                    title="Previous Categories"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => scrollCarousel('right')}
                                    className="p-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                    title="Next Categories"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <Link
                                    to="/buyer"
                                    className="ml-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                >
                                    <span>View All</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Carousel Container */}
                        <div
                            ref={categoryCarouselRef}
                            className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 scroll-smooth"
                        >
                            {categories.map((category, idx) => {
                                const emoji = getCategoryIcon(category.name);
                                const colorGrad = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                                return (
                                    <Link
                                        key={category.id}
                                        to={`/buyer?categoryId=${category.id}`}
                                        className="group flex-shrink-0 w-36 sm:w-44 bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-between"
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorGrad} mb-2.5 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform`}>
                                            <span>{emoji}</span>
                                        </div>
                                        <h3 className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                            {category.name}
                                        </h3>
                                        <span className="mt-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                            Category
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Fabrics Grid */}
            <section className="py-10 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                Featured Fabrics
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Verified wholesale materials from authenticated mills
                            </p>
                        </div>
                        <Link
                            to="/buyer"
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                            <span>Explore Catalog</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {featuredProducts.slice(0, 8).map(prod => (
                                <ProductHomeCard
                                    key={prod.id}
                                    product={prod}
                                    isFav={isFavorite(prod.id)}
                                    onToggleFav={handleToggleFavorite}
                                    onAddToCart={handleAddToCart}
                                    onNavigate={(id) => navigate(`/buyer/product/${id}`)}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </section>

            {/* New Arrivals Section (API-Backed Only) */}
            {newArrivals.length > 0 && !loading && (
                <section className="py-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                    ⚡ New Arrivals
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Recently listed fabric inventory from suppliers
                                </p>
                            </div>
                            <Link
                                to="/buyer?sort=newest"
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                            >
                                <span>View All New</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {newArrivals.slice(0, 4).map(prod => (
                                <ProductHomeCard
                                    key={prod.id}
                                    product={prod}
                                    isFav={isFavorite(prod.id)}
                                    onToggleFav={handleToggleFavorite}
                                    onAddToCart={handleAddToCart}
                                    onNavigate={(id) => navigate(`/buyer/product/${id}`)}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Verified Textile Suppliers Section */}
            {suppliers.length > 0 && (
                <section className="py-10 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                    Verified Textile Mills & Suppliers
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Direct manufacturer profiles registered on VFabrica
                                </p>
                            </div>
                            <Link
                                to="/buyer?mode=suppliers"
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                            >
                                <span>All Suppliers</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-56 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {suppliers.map((biz) => {
                                    const initial = (biz.company_name || 'VF').slice(0, 2).toUpperCase();
                                    return (
                                        <div
                                            key={biz.id}
                                            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                                                        {initial}
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        <Shield className="w-3 h-3" />
                                                        Verified Mill
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                                    {biz.company_name}
                                                </h3>

                                                {biz.location && (
                                                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span>{biz.location}</span>
                                                </p>
                                                )}

                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                                                    {biz.company_description || 'Verified manufacturer and distributor of woven and knitted fabrics.'}
                                                </p>

                                                {biz.categories && biz.categories.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {biz.categories.slice(0, 3).map((cat, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-200 dark:border-indigo-800/40">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                    <Package className="w-3.5 h-3.5 text-indigo-500" />
                                                    {biz.product_count ?? 0} Products
                                                </span>
                                                <button
                                                    onClick={() => navigate(`/buyer/supplier/${biz.id}`)}
                                                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span>View Profile</span>
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Why Source With VFabrica */}
            <section className="py-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Why Source With VFabrica
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                            Built specifically for B2B fabric procurement, mill discovery, and material management.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {whyChooseUs.map((item, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
                                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400">
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-10 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            How Fabric Sourcing Works
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                            Streamlined procurement workflow from material discovery to bulk delivery.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {steps.map((step, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 text-center flex flex-col items-center">
                                <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white mb-2.5 shadow-sm">
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-extrabold text-[11px] flex items-center justify-center mb-1.5">
                                    {i + 1}
                                </span>
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Compact CTA Banner — real textile photo behind the copy, not a flat gradient */}
            <section className="py-10 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="relative rounded-3xl overflow-hidden p-6 sm:p-8 text-center text-white shadow-lg bg-gray-900 bg-cover bg-center"
                        style={{
                            backgroundImage: "url('https://images.openai.com/static-rsc-4/aOwUrZdhi5CeCDTupWqKEWTaYADaHwOPJwlK2myRloIhW4bAFOwn6aLNdSYEtuKHdQujQc-hiD_GuBeaecCXp70U6xS4rPm8JZzDtji3fOHs3Ul7EZ6bPa8K5zK93FgRcj8-rAkEnzclx2xZaAqQJRvn8hqP-DAqQJaT-dKz6aLexBJEWXCIoI83dGDUatAd?purpose=fullsize')",
                        }}
                    >
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">
                            Ready to Source Wholesale Fabrics?
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-200 mb-5 max-w-xl mx-auto">
                            Browse thousands of certified textile products or list your mill on VFabrica.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Link
                                to="/buyer"
                                className="px-5 py-2.5 bg-white text-indigo-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                Explore Fabrics Catalog
                            </Link>
                            <Link
                                to="/auth/supplier/register"
                                className="px-5 py-2.5 bg-white/15 text-white text-xs font-bold rounded-xl hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/30"
                            >
                                Register As Supplier
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced Footer */}
            <footer className="bg-gray-900 text-gray-300 py-10 border-t border-gray-800 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    <GitBranch className="w-4 h-4" />
                                </div>
                                <span className="text-lg font-bold text-white">VFabrica</span>
                            </div>
                            <p className="text-xs text-gray-400 max-w-sm leading-relaxed mb-3">
                                The global B2B marketplace for fabric sourcing, connecting buyers directly with authenticated textile mills worldwide.
                            </p>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-800 text-[10px] font-semibold text-gray-300">
                                🌐 Global Textile Network
                            </span>
                        </div>

                        <div>
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Platform</h4>
                            <div className="space-y-2 text-xs">
                                <Link to="/buyer" className="block text-gray-400 hover:text-white transition-colors">Fabrics Catalog</Link>
                                <Link to="/buyer?mode=suppliers" className="block text-gray-400 hover:text-white transition-colors">Mills & Suppliers</Link>
                                <Link to="/buyer/favorites" className="block text-gray-400 hover:text-white transition-colors">Saved Wishlist</Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Help & Legal</h4>
                            <div className="space-y-2 text-xs">
                                <Link to="/buyer" className="block text-gray-400 hover:text-white transition-colors">About VFabrica</Link>
                                <Link to="/buyer" className="block text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                                <Link to="/buyer" className="block text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                                <Link to="/buyer" className="block text-gray-400 hover:text-white transition-colors">Help & Support</Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">For Manufacturers</h4>
                            <div className="space-y-2 text-xs">
                                <Link to="/auth/supplier/register" className="block text-indigo-400 font-bold hover:underline">Supplier Registration</Link>
                                <Link to="/auth/login" className="block text-gray-400 hover:text-white transition-colors">Supplier Login</Link>
                                <p className="text-gray-400 text-[11px] pt-1">Contact: sourcing@vfabrica.com</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-[11px]">
                        &copy; {new Date().getFullYear()} VFabrica Marketplace Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Reusable Product Card Component Matching Catalog Styling
function ProductHomeCard({ product, isFav, onToggleFav, onAddToCart, onNavigate }) {
    const { user } = useAuthStore();
    const isSupplier = (user?.role || '').toUpperCase() === 'SUPPLIER';
    const unitLabel = getProductUnit(product);
    const stock = Number(product.available_quantity ?? product.total_available_stock ?? product.available_stock ?? product.stock ?? 0);
    const price = Number(product.price || product.base_price || 0);

    return (
        <div
            onClick={() => onNavigate(product.id)}
            className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 flex flex-col justify-between cursor-pointer"
        >
            {/* Image Box */}
            <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-750 overflow-hidden flex items-center justify-center">
                {product.primary_image_url || (product.images && product.images[0]?.image_url) ? (
                    <img
                        src={product.primary_image_url || product.images[0]?.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-900/10 dark:bg-indigo-950/40">
                        <Package className="w-10 h-10 text-indigo-400 opacity-60 mb-1" />
                        <span className="text-[10px] font-bold text-indigo-500">VFABRICA TEXTILE</span>
                    </div>
                )}

                {/* Favorite Heart Button */}
                <button
                    onClick={(e) => onToggleFav(product, e)}
                    className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${isFav
                        ? 'bg-rose-500 text-white'
                        : 'bg-black/40 text-white hover:bg-rose-500'
                        }`}
                    title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                </button>

                {/* Stock Status Badge */}
                <div className="absolute bottom-2.5 left-2.5 z-10">
                    {stock > 0 ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600/90 text-white shadow-xs backdrop-blur-xs">
                            In Stock ({stock})
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-600/90 text-white shadow-xs backdrop-blur-xs">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Category Badge Overlay */}
                {product.category_name && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/60 text-white border border-white/20 backdrop-blur-xs">
                            {product.category_name}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">
                        <span className="truncate">{product.supplier_name || product.brand || 'Verified Mill'}</span>
                        <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {product.name}
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {product.description || 'High quality wholesale textile material.'}
                    </p>
                </div>

                {/* Price & Action Row */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                                ₹{price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-0.5 font-medium">/{unitLabel}</span>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            MOQ: {product.minimum_order_quantity || 1}{unitLabel}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                            onClick={() => onNavigate(product.id)}
                            className="py-1.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Specs</span>
                        </button>

                        {isSupplier ? (
                            <button
                                onClick={(e) => onAddToCart(product, e)}
                                className="py-1.5 px-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                                title="Only buyers can purchase products."
                            >
                                <span>Buyers Only</span>
                            </button>
                        ) : (
                            <button
                                onClick={(e) => onAddToCart(product, e)}
                                disabled={stock <= 0}
                                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Add Cart</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DropItem({ to, icon, label, close }) {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => { navigate(to); close(); }}
            className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2.5 cursor-pointer"
        >
            <span>{icon}</span>
            {label}
        </button>
    );
}