import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { SupplierGateway } from './SupplierGateway';
import { getSupplierDashboard } from '../../services/supplierService';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
    Package,
    CheckCircle2,
    Clock,
    ShoppingCart,
    Warehouse,
    Box,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Building2,
    AlertCircle,
    IndianRupee,
    Sparkles,
    Shield
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'indigo', trend }) {
    const colorMap = {
        indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
        amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
        blue: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
        purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
        rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {label}
                </span>
                <div className={`w-10 h-10 rounded-xl ${colorMap[color]} border flex items-center justify-center shadow-xs`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{sub}</p>}
                </div>
                {trend !== undefined && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        trend > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    );
}

function QuickLinkCard({ to, icon: Icon, title, description, color }) {
    const colorMap = {
        indigo: 'from-indigo-600 to-purple-600',
        emerald: 'from-emerald-600 to-teal-600',
        amber: 'from-amber-600 to-orange-600',
    };

    return (
        <Link
            to={to}
            className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </Link>
    );
}

function DashboardInner({ profile }) {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const loadDashboardData = React.useCallback(() => {
        getSupplierDashboard()
            .then(res => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    useWebSocket({
        ORDER_UPDATED: () => loadDashboardData(),
        INVENTORY_UPDATED: () => loadDashboardData()
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl h-28 border border-gray-200 dark:border-gray-700" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl h-28 border border-gray-200 dark:border-gray-700" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                    Welcome back, {profile?.company_name || 'Supplier'} 👋
                                </h1>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Live supplier marketplace dashboard & order activity
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full border border-emerald-200 dark:border-emerald-800">
                            <Shield className="w-3.5 h-3.5" />
                            Verified Manufacturer
                        </span>
                    </div>
                </div>
            </div>

            {/* Informative Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Package}
                    label="Total Products"
                    value={stats?.totalProducts ?? 0}
                    color="indigo"
                    sub="Listed fabric items"
                    trend={12}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Active Catalog"
                    value={stats?.activeProducts ?? 0}
                    color="emerald"
                    sub="Live on marketplace"
                />
                <StatCard
                    icon={Clock}
                    label="Pending Orders"
                    value={stats?.pendingOrders ?? 0}
                    color="amber"
                    sub="Requires fulfillment action"
                />
                <StatCard
                    icon={ShoppingCart}
                    label="Total Orders"
                    value={stats?.totalOrders ?? 0}
                    color="purple"
                    sub="All time orders"
                    trend={8}
                />
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickLinkCard
                    to="/supplier/products"
                    icon={Package}
                    title="Product Catalog"
                    description="Manage fabric listings, prices, units, and color/size variants"
                    color="indigo"
                />
                <QuickLinkCard
                    to="/supplier/inventory"
                    icon={Box}
                    title="Inventory Control"
                    description="Track stock levels, low-stock thresholds, and transfers"
                    color="emerald"
                />
                <QuickLinkCard
                    to="/supplier/warehouse"
                    icon={Warehouse}
                    title="Warehouse Locations"
                    description="Manage storage facilities, default hubs, and addresses"
                    color="amber"
                />
            </div>
        </div>
    );
}

export function SupplierDashboardPage() {
    return (
        <SupplierGateway>
            {(profile) => (
                <AppShell>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <DashboardInner profile={profile} />
                    </div>
                </AppShell>
            )}
        </SupplierGateway>
    );
}