import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { useAuthStore } from '../../store/useAuthStore';

// Modular Components
import { OverviewModule } from '../../components/admin/OverviewModule';
import { SupplierApprovalsModule } from '../../components/admin/SupplierApprovalsModule';
import { UserDirectoryModule } from '../../components/admin/UserDirectoryModule';
import { CategoryTaxonomyModule } from '../../components/admin/CategoryTaxonomyModule';

export function AdminDashboardPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();

    // Tab state linked to URL search param "?tab=..."
    const activeTab = searchParams.get('tab') || 'overview';
    const setActiveTab = (tab) => {
        setSearchParams(tab === 'overview' ? {} : { tab });
    };

    if (!isAuthenticated || !user || (user.role || '').toUpperCase() !== 'ADMIN') {
        return <Navigate to="/admin" replace />;
    }

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
                {/* ── MODULAR CONTENT MODULES ── */}
                {activeTab === 'overview' && (
                    <OverviewModule onTabChange={setActiveTab} />
                )}

                {activeTab === 'approvals' && (
                    <SupplierApprovalsModule />
                )}

                {activeTab === 'users' && (
                    <UserDirectoryModule />
                )}

                {activeTab === 'categories' && (
                    <CategoryTaxonomyModule />
                )}
            </div>
        </AppShell>
    );
}