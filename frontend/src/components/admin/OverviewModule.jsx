import React from 'react';
import {
    Layers,
    Users,
    Store,
    Clock,
    FolderKanban,
    Package,
    ShoppingCart,
    Database,
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Calendar,
    Filter,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    BarChart3,
    PieChart,
    Target
} from 'lucide-react';
import { StatBox } from './StatBox';
import { getAdminDashboard, seedMarketplaceData } from '../../services/adminService';

export function OverviewModule({ onTabChange }) {
    const [loading, setLoading] = React.useState(true);
    const [dashboard, setDashboard] = React.useState(null);
    const [busyAction, setBusyAction] = React.useState('');
    const [timeRange, setTimeRange] = React.useState('week'); // 'today', 'week', 'month', 'year'
    const [showQuickStats, setShowQuickStats] = React.useState(true);

    const pendingCount = dashboard?.pendingSuppliers ?? 0;
    const categoriesCount = dashboard?.totalCategories ?? 0;

    const loadDashboardData = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAdminDashboard();
            setDashboard(response.data);
        } catch (error) {
            console.error('Error fetching admin dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const handleRunSeed = async () => {
        setBusyAction('seed');
        try {
            await seedMarketplaceData();
            await loadDashboardData();
        } catch (error) {
            console.error('Error seeding data:', error);
        } finally {
            setBusyAction('');
        }
    };

    const calculateGrowth = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    const growthMetrics = {
        users: calculateGrowth(dashboard?.totalUsers || 0, dashboard?.previousUsers || 0),
        suppliers: calculateGrowth(dashboard?.totalSuppliers || 0, dashboard?.previousSuppliers || 0),
        products: calculateGrowth(dashboard?.totalProducts || 0, dashboard?.previousProducts || 0),
        orders: calculateGrowth(dashboard?.totalOrders || 0, dashboard?.previousOrders || 0),
    };

    const getTimeRangeLabel = () => {
        switch (timeRange) {
            case 'today': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'year': return 'This Year';
            default: return 'This Week';
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="theme-card p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold theme-text-main">
                                Marketplace Overview
                            </h2>
                            <p className="text-xs sm:text-sm theme-text-subtle mt-0.5">
                                Monitor your marketplace performance and key metrics
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
                        {/* Time Range Selector */}
                        <div className="flex items-center gap-1 p-1 bg-[var(--bg)] border theme-border-color rounded-xl">
                            {[
                                { value: 'today', label: 'Today' },
                                { value: 'week', label: 'Week' },
                                { value: 'month', label: 'Month' },
                                { value: 'year', label: 'Year' }
                            ].map((range) => (
                                <button
                                    key={range.value}
                                    onClick={() => setTimeRange(range.value)}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-colors ${timeRange === range.value
                                        ? 'bg-[var(--primary)] text-white shadow-sm'
                                        : 'theme-text-subtle hover:theme-text-main'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Refresh Button */}
                            <button
                                onClick={() => window.location.reload()}
                                className="p-2 theme-text-subtle hover:theme-text-main hover:bg-[var(--bg)] rounded-lg transition-colors cursor-pointer"
                                title="Refresh Data"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Bar */}
                {showQuickStats && (
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t theme-border-color">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs theme-text-subtle">Time Range</p>
                                    <p className="text-xs sm:text-sm font-semibold theme-text-main truncate">{getTimeRangeLabel()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs theme-text-subtle">Last Updated</p>
                                    <p className="text-xs sm:text-sm font-semibold theme-text-main truncate">
                                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs theme-text-subtle">Pending Actions</p>
                                    <button
                                        onClick={() => onTabChange('approvals')}
                                        className="text-xs sm:text-sm font-semibold text-amber-500 hover:underline cursor-pointer truncate block"
                                    >
                                        {dashboard?.pendingSuppliers ?? 0} to review
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatBox
                    title="Total Users"
                    value={loading ? '...' : dashboard?.totalUsers ?? 0}
                    icon={Users}
                    color="indigo"
                    subtext="Registered buyer & supplier accounts"
                    trend={growthMetrics.users}
                />
                <StatBox
                    title="Active Suppliers"
                    value={loading ? '...' : dashboard?.totalSuppliers ?? 0}
                    icon={Store}
                    color="emerald"
                    subtext="Approved vendor profiles"
                    trend={growthMetrics.suppliers}
                />
                <StatBox
                    title="Pending Approvals"
                    value={loading ? '...' : dashboard?.pendingSuppliers ?? 0}
                    icon={Clock}
                    color="amber"
                    subtext="Applications awaiting review"
                    alert={(dashboard?.pendingSuppliers ?? 0) > 0}
                    onClick={() => onTabChange('approvals')}
                />
                <StatBox
                    title="Categories"
                    value={loading ? '...' : dashboard?.totalCategories ?? 0}
                    icon={FolderKanban}
                    color="purple"
                    subtext="Active product taxonomy"
                    onClick={() => onTabChange('categories')}
                />
            </div>

            {/* Secondary Metrics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Metrics */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <StatBox
                            title="Catalog Products"
                            value={loading ? '...' : dashboard?.totalProducts ?? 0}
                            icon={Package}
                            color="blue"
                            subtext="Fabrics & textiles listed"
                            trend={growthMetrics.products}
                        />
                        <StatBox
                            title="Total Orders"
                            value={loading ? '...' : dashboard?.totalOrders ?? 0}
                            icon={ShoppingCart}
                            color="teal"
                            subtext="Marketplace orders created"
                            trend={growthMetrics.orders}
                        />
                    </div>

                    {/* Recent Activity Section */}
                    <div className="theme-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold theme-text-main flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[var(--primary)]" />
                                Recent Activity
                            </h3>
                            <button
                                onClick={() => onTabChange('approvals')}
                                className="text-xs font-medium theme-text-primary hover:underline flex items-center gap-1"
                            >
                                View All
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {pendingCount > 0 && (
                                <div className="flex items-start gap-3 p-3 theme-badge-warning rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium theme-text-main">
                                            {pendingCount} Pending Supplier Approvals
                                        </p>
                                        <p className="text-xs theme-text-subtle mt-0.5">
                                            New supplier registrations awaiting review
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onTabChange('approvals')}
                                        className="text-xs font-medium text-amber-500 hover:underline flex-shrink-0"
                                    >
                                        Review
                                    </button>
                                </div>
                            )}

                            <div className="flex items-start gap-3 p-3 theme-badge-primary rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-4 h-4 theme-text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium theme-text-main">
                                        {dashboard?.totalProducts || 0} Products Listed
                                    </p>
                                    <p className="text-xs theme-text-subtle mt-0.5">
                                        Total fabrics and textiles in catalog
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 theme-badge-success rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium theme-text-main">
                                        System Operational
                                    </p>
                                    <p className="text-xs theme-text-subtle mt-0.5">
                                        All services running normally
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Seed Data Card */}
                <div className="space-y-5">
                    {/* Quick Actions Card */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800/40">
                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
                            <Database className="w-4 h-4" /> Quick Bootstrap
                        </div>
                        <h3 className="text-lg font-bold mb-2">Seed Sample Data</h3>
                        <p className="text-xs text-indigo-200 leading-relaxed mb-4">
                            Instantly populate category lookups, demo suppliers, and fabric products for testing and development.
                        </p>
                        <button
                            onClick={handleRunSeed}
                            disabled={busyAction === 'seed'}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {busyAction === 'seed' ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Seeding Content...
                                </>
                            ) : (
                                <>
                                    <Database className="w-4 h-4" />
                                    Run Seed Script
                                </>
                            )}
                        </button>
                    </div>

                    {/* Quick Navigation Card */}
                    <div className="theme-card p-6">
                        <h3 className="text-sm font-semibold theme-text-main mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-500" />
                            Quick Navigation
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => onTabChange('categories')}
                                className="w-full flex items-center justify-between p-3 text-sm font-medium theme-text-main hover:bg-[var(--bg)] rounded-xl transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <FolderKanban className="w-4 h-4 text-purple-500" />
                                    Manage Categories
                                </span>
                                <ChevronRight className="w-4 h-4 theme-text-subtle" />
                            </button>
                            <button
                                onClick={() => onTabChange('approvals')}
                                className="w-full flex items-center justify-between p-3 text-sm font-medium theme-text-main hover:bg-[var(--bg)] rounded-xl transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-amber-500" />
                                    Supplier Approvals
                                    {pendingCount > 0 && (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                                            {pendingCount}
                                        </span>
                                    )}
                                </span>
                                <ChevronRight className="w-4 h-4 theme-text-subtle" />
                            </button>
                            <button
                                onClick={() => onTabChange('users')}
                                className="w-full flex items-center justify-between p-3 text-sm font-medium theme-text-main hover:bg-[var(--bg)] rounded-xl transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-500" />
                                    User Directory
                                </span>
                                <ChevronRight className="w-4 h-4 theme-text-subtle" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Metrics Footer */}
            <div className="theme-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold theme-text-main flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-[var(--primary)]" />
                        Marketplace Health
                    </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-[var(--bg)] border theme-border-color rounded-xl">
                        <p className="text-xs theme-text-subtle mb-1">Approval Rate</p>
                        <p className="text-lg font-bold text-emerald-500">
                            {dashboard?.totalSuppliers && dashboard?.totalUsers
                                ? `${((dashboard.totalSuppliers / dashboard.totalUsers) * 100).toFixed(1)}%`
                                : '0%'
                            }
                        </p>
                    </div>
                    <div className="text-center p-4 bg-[var(--bg)] border theme-border-color rounded-xl">
                        <p className="text-xs theme-text-subtle mb-1">Products/Supplier</p>
                        <p className="text-lg font-bold text-blue-500">
                            {dashboard?.totalSuppliers && dashboard?.totalProducts
                                ? (dashboard.totalProducts / dashboard.totalSuppliers).toFixed(1)
                                : '0'
                            }
                        </p>
                    </div>
                    <div className="text-center p-4 bg-[var(--bg)] border theme-border-color rounded-xl">
                        <p className="text-xs theme-text-subtle mb-1">Avg. Order Value</p>
                        <p className="text-lg font-bold text-purple-500">
                            ₹0.00
                        </p>
                    </div>
                    <div className="text-center p-4 bg-[var(--bg)] border theme-border-color rounded-xl">
                        <p className="text-xs theme-text-subtle mb-1">Active Users</p>
                        <p className="text-lg font-bold text-teal-500">
                            {dashboard?.totalUsers || 0}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}