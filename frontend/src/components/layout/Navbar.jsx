import React from 'react';
import { Link, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, X, ShoppingCart, Heart, User, LogOut, SlidersHorizontal, Package, Building2, ShieldAlert, Sparkles, GitBranch, ChevronDown, Menu, AlertCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';

export function Navbar() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const { items } = useCartStore();
    const { favorites } = useFavoritesStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const searchValue = searchParams.get('search') || '';
    const cartCount = items.reduce((s, i) => s + i.quantity, 0);
    const favCount = favorites.length;
    const role = (user?.role || '').toUpperCase();

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        setMobileMenuOpen(false);
        setShowLogoutConfirm(false);
        navigate('/');
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('tab');
        if (val) {
            newParams.set('search', val);
        } else {
            newParams.delete('search');
        }
        const isCatalogRoute = location.pathname === '/buyer' || location.pathname === '/buyer/';
        const currentTab = searchParams.get('tab');
        const isCatalogTab = !currentTab || currentTab === 'catalog';
        if (!isCatalogRoute || !isCatalogTab) {
            navigate(`/buyer?${newParams.toString()}`);
        } else {
            setSearchParams(newParams, { replace: true });
        }
    };

    const handleClearSearch = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('search');
        setSearchParams(newParams, { replace: true });
    };

    React.useEffect(() => {
        if (!dropdownOpen) return;
        const close = () => setDropdownOpen(false);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [dropdownOpen]);

    // Close logout modal on Escape key
    React.useEffect(() => {
        if (!showLogoutConfirm) return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') setShowLogoutConfirm(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showLogoutConfirm]);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (showLogoutConfirm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showLogoutConfirm]);

    const isTabActive = (tabName) => {
        if (location.pathname !== '/admin/dashboard') return false;
        const currentTab = searchParams.get('tab') || 'overview';
        return currentTab === tabName;
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">

                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md hover:scale-105 transition-transform">
                            <GitBranch className="w-5 h-5" />
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                VFabrica
                            </span>
                            <span className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                                B2B Textile Sourcing
                            </span>
                        </div>
                    </Link>

                    {/* Role-specific Nav Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {role === 'BUYER' && (
                            <>
                                <NavLink to="/buyer" end className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                                    Catalog
                                </NavLink>
                                <NavLink to="/buyer/orders" className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                                    My Orders
                                </NavLink>
                            </>
                        )}
                        {role === 'SUPPLIER' && (
                            <>
                                <NavLink to="/supplier" end className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Dashboard</NavLink>
                                <NavLink to="/supplier/products" className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Products</NavLink>
                                <NavLink to="/supplier/warehouse" className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Warehouses</NavLink>
                                <NavLink to="/supplier/inventory" className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Inventory</NavLink>
                                <NavLink to="/supplier/orders" className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Orders</NavLink>
                            </>
                        )}
                        {role === 'ADMIN' && (
                            <>
                                <Link to="/admin/dashboard" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isTabActive('overview') ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Overview</Link>
                                <Link to="/admin/dashboard?tab=approvals" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isTabActive('approvals') ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Approvals</Link>
                                <Link to="/admin/dashboard?tab=users" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isTabActive('users') ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Users</Link>
                                <Link to="/admin/dashboard?tab=categories" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isTabActive('categories') ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Categories</Link>
                            </>
                        )}
                        {!isAuthenticated && (
                            <NavLink to="/buyer/categories" className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Products</NavLink>
                        )}
                    </nav>

                    {/* Buyer Global Search Bar */}
                    {(role === 'BUYER' || (!isAuthenticated && location.pathname.startsWith('/buyer'))) && (
                        <div className="flex-1 max-w-md mx-2 relative hidden lg:block">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            <input type="text" placeholder="Search fabrics, suppliers, categories..." value={searchValue} onChange={handleSearchChange}
                                className="w-full pl-10 pr-9 py-2 bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-full text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                            {searchValue && (
                                <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full" title="Clear search">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Actions & Utilities */}
                    <div className="flex items-center gap-1.5 sm:gap-3 ml-auto flex-shrink-0">
                        {(role === 'BUYER' || (!isAuthenticated && (location.pathname.startsWith('/buyer') || location.pathname === '/'))) && (
                            <button onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
                                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-semibold text-xs shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 border border-white/20 cursor-pointer"
                                title="Open AI Fabric Sourcing Assistant">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                <span className="hidden sm:inline">AI Assistant</span>
                            </button>
                        )}
                        <div className="hidden sm:block"><ThemeToggle /></div>
                        {role === 'BUYER' && (
                            <>
                                <Link to="/buyer/favorites" className="relative flex items-center justify-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-rose-500" title="View Wishlist & Favorites">
                                    <Heart className="w-5 h-5 fill-current" />
                                    {favCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">{favCount}</span>}
                                </Link>
                                <Link to="/buyer?tab=cart" className="relative flex items-center justify-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300" title="View Cart">
                                    <ShoppingCart className="w-5 h-5" />
                                    {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">{cartCount}</span>}
                                </Link>
                            </>
                        )}
                        {isAuthenticated && user ? (
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setDropdownOpen(v => !v)} aria-expanded={dropdownOpen} aria-haspopup="true"
                                    className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/90 transition-all cursor-pointer shadow-xs">
                                    <div className="relative">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white text-xs font-black shadow-sm ring-2 ring-indigo-500/20">
                                            {(user.email || 'U').slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-900" title="Account Active" />
                                    </div>
                                    <div className="hidden sm:flex flex-col text-left max-w-[120px]">
                                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">{user.name || user.company_name || user.email?.split('@')[0]}</span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">{role === 'BUYER' ? 'Buyer Account' : role}</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/30 rounded-t-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-black shadow-md flex-shrink-0">{(user.email || 'U').slice(0, 2).toUpperCase()}</div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name || user.company_name || user.email?.split('@')[0]}</p>
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Active Status" />
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2.5 flex items-center justify-between gap-2">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800/60">
                                                    <ShieldAlert className="w-3 h-3 text-indigo-500" />{role === 'BUYER' ? 'Verified Wholesale Buyer' : role}
                                                </span>
                                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">Active</span>
                                            </div>
                                        </div>
                                        <div className="py-1.5 px-1 space-y-0.5">
                                            {role === 'BUYER' && (
                                                <>
                                                    <DropItem to="/buyer" icon="🛍️" label="Catalog Marketplace" desc="Explore fabric rolls & specs" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/buyer/orders" icon="📦" label="My Orders" desc="Track wholesale shipments" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/buyer?tab=cart" icon="🛒" label="Shopping Cart" desc="Review selected items" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/buyer/profile" icon="👤" label="Business Profile" desc="GST & company info" close={() => setDropdownOpen(false)} />
                                                </>
                                            )}
                                            {role === 'SUPPLIER' && (
                                                <>
                                                    <DropItem to="/supplier" icon="📊" label="Dashboard" desc="Mill statistics & sales" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/supplier/products" icon="📦" label="Products" desc="Manage catalog listings" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/supplier/warehouse" icon="🏭" label="Warehouses" desc="Storage locations" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/supplier/inventory" icon="📋" label="Inventory" desc="Stock levels & alerts" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/supplier/orders" icon="📑" label="Buyer Orders" desc="Fulfill & dispatch orders" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/supplier/profile" icon="⚙️" label="Profile Settings" desc="Mill verification & info" close={() => setDropdownOpen(false)} />
                                                </>
                                            )}
                                            {role === 'ADMIN' && (
                                                <>
                                                    <DropItem to="/admin/dashboard" icon="🛡️" label="Admin Dashboard" desc="System statistics" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/admin/dashboard?tab=approvals" icon="⏳" label="Supplier Approvals" desc="Review mill applications" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/admin/dashboard?tab=users" icon="👥" label="User Directory" desc="Manage buyers & suppliers" close={() => setDropdownOpen(false)} />
                                                    <DropItem to="/admin/dashboard?tab=categories" icon="🏷️" label="Categories" desc="Master catalog data" close={() => setDropdownOpen(false)} />
                                                </>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-100 dark:border-gray-800 pt-1 mt-1 px-1">
                                            <button onClick={() => { setDropdownOpen(false); setShowLogoutConfirm(true); }}
                                                className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center justify-between font-bold cursor-pointer">
                                                <div className="flex items-center gap-2.5"><LogOut className="w-4 h-4 text-rose-500" /><span>Sign Out</span></div>
                                                <span className="text-[10px] text-rose-400">Exit Session</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Sign In</Link>
                                <Link to="/auth/buyer/register" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm">Register</Link>
                            </div>
                        )}
                        <button onClick={() => setMobileMenuOpen(v => !v)} className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {(role === 'BUYER' || (!isAuthenticated && location.pathname.startsWith('/buyer'))) && (
                    <div className="px-4 pb-3 lg:hidden border-t border-gray-100 dark:border-gray-800 pt-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            <input type="text" placeholder="Search fabrics, suppliers..." value={searchValue} onChange={handleSearchChange}
                                className="w-full pl-10 pr-9 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            {searchValue && <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-3.5 h-3.5" /></button>}
                        </div>
                    </div>
                )}

                {/* Mobile Drawer Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-4 space-y-2">
                        {role === 'BUYER' && (
                            <>
                                <MobileLink to="/buyer" label="Catalog" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/buyer/orders" label="My Orders" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/buyer/profile" label="Profile" close={() => setMobileMenuOpen(false)} />
                            </>
                        )}
                        {role === 'SUPPLIER' && (
                            <>
                                <MobileLink to="/supplier" label="Dashboard" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/supplier/products" label="Products" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/supplier/warehouse" label="Warehouses" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/supplier/inventory" label="Inventory" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/supplier/orders" label="Orders" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/supplier/profile" label="Profile" close={() => setMobileMenuOpen(false)} />
                            </>
                        )}
                        {role === 'ADMIN' && (
                            <>
                                <MobileLink to="/admin/dashboard" label="Overview" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/admin/dashboard?tab=approvals" label="Supplier Approvals" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/admin/dashboard?tab=users" label="User Directory" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/admin/dashboard?tab=categories" label="Categories" close={() => setMobileMenuOpen(false)} />
                            </>
                        )}
                        {!isAuthenticated && (
                            <>
                                <MobileLink to="/auth/login" label="Sign In" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/auth/buyer/register" label="Register as Buyer" close={() => setMobileMenuOpen(false)} />
                                <MobileLink to="/auth/supplier/register" label="Register as Supplier" close={() => setMobileMenuOpen(false)} />
                            </>
                        )}
                        {isAuthenticated && (
                            <button onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true); }}
                                className="w-full text-left py-2.5 text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 cursor-pointer">
                                <div className="flex items-center gap-2"><LogOut className="w-4 h-4 text-rose-500" /><span>Sign Out</span></div>
                                <span className="text-[10px] text-rose-400 font-normal">Exit Session</span>
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* Logout Confirmation Modal - Centered */}
            {showLogoutConfirm && (
                <div
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div
                        className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center justify-center flex-shrink-0">
                                <LogOut className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sign Out</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">VFabrica Account Session</p>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5">
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                Are you sure you want to sign out? You'll need to sign in again to access your account.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 pt-0 flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function DropItem({ to, icon, label, desc, close }) {
    const navigate = useNavigate();
    return (
        <button onClick={() => { navigate(to); close(); }}
            className="w-full text-left px-3 py-2 text-xs rounded-xl text-gray-700 dark:text-gray-300 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                    <p className="font-bold truncate">{label}</p>
                    {desc && <p className="text-[10px] text-gray-400 truncate">{desc}</p>}
                </div>
            </div>
            <ChevronDown className="w-3 h-3 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 flex-shrink-0 ml-1" />
        </button>
    );
}

function MobileLink({ to, label, close }) {
    const navigate = useNavigate();
    return (
        <button onClick={() => { navigate(to); close(); }}
            className="w-full text-left py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
            {label}
        </button>
    );
}