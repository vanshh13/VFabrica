import React from 'react';
import {
    Store,
    Search,
    Building2,
    CheckCircle2,
    XCircle,
    UserCheck,
    Eye,
    Filter,
    ArrowUpDown,
    Clock,
    Calendar,
    Mail,
    MapPin,
    Phone,
    Globe,
    FileText,
    AlertCircle,
    X,
    SlidersHorizontal,
    ChevronDown,
    Users,
    Package
} from 'lucide-react';

import { getPendingSuppliers, reviewSupplier } from '../../services/adminService';

export function SupplierApprovalsModule() {
    const [pendingSuppliers, setPendingSuppliers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [busyAction, setBusyAction] = React.useState('');
    const [supplierSearch, setSupplierSearch] = React.useState('');
    const [selectedSupplier, setSelectedSupplier] = React.useState(null);
    const [deleteConfirm, setDeleteConfirm] = React.useState(null);
    const [showFilters, setShowFilters] = React.useState(false);

    const loadSuppliers = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await getPendingSuppliers();
            setPendingSuppliers(response.data || []);
        } catch (error) {
            console.error('Error loading pending suppliers:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    const handleApprove = async (supplier) => {
        setBusyAction(`approve-${supplier.id}`);
        try {
            await reviewSupplier({ supplierProfileId: supplier.id, approvalStatus: 'approved' });
            await loadSuppliers();
        } catch (error) {
            console.error('Error approving supplier:', error);
        } finally {
            setBusyAction('');
        }
    };

    const handleReject = async (supplier) => {
        setBusyAction(`reject-${supplier.id}`);
        try {
            await reviewSupplier({ supplierProfileId: supplier.id, approvalStatus: 'rejected' });
            setDeleteConfirm(null);
            await loadSuppliers();
        } catch (error) {
            console.error('Error rejecting supplier:', error);
        } finally {
            setBusyAction('');
        }
    };

    // Filter states
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [sortBy, setSortBy] = React.useState('date');
    const [sortOrder, setSortOrder] = React.useState('desc');
    const [dateRange, setDateRange] = React.useState('all');

    const getFilteredAndSortedSuppliers = () => {
        let result = [...pendingSuppliers];

        if (supplierSearch) {
            result = result.filter(s =>
                s.company_name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                s.email?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                s.company_description?.toLowerCase().includes(supplierSearch.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(s => {
                const status = s.approval_status?.toLowerCase() || 'pending';
                return status === statusFilter;
            });
        }

        if (dateRange !== 'all') {
            const now = new Date();
            result = result.filter(s => {
                const createdDate = s.created_at ? new Date(s.created_at) : new Date();
                switch (dateRange) {
                    case 'today':
                        return createdDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return createdDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return createdDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'company':
                    comparison = (a.company_name || '').localeCompare(b.company_name || '');
                    break;
                case 'email':
                    comparison = (a.email || '').localeCompare(b.email || '');
                    break;
                case 'date':
                    comparison = new Date(a.created_at || 0) - new Date(b.created_at || 0);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    };

    const filteredSuppliers = getFilteredAndSortedSuppliers();

    const clearAllFilters = () => {
        setSupplierSearch('');
        setStatusFilter('all');
        setSortBy('date');
        setSortOrder('desc');
        setDateRange('all');
    };

    const hasActiveFilters = statusFilter !== 'all' || dateRange !== 'all' || supplierSearch !== '';

    // View Details Modal
    const ViewDetailsModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="theme-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-[var(--bg-elevated)] flex items-center justify-between p-6 border-b theme-border-color rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-500/20">
                            {selectedSupplier?.company_name ? selectedSupplier.company_name[0].toUpperCase() : 'S'}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold theme-text-main">
                                {selectedSupplier?.company_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs theme-text-subtle font-mono">
                                    ID: {selectedSupplier?.id?.slice(0, 12)}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full theme-badge-warning">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {selectedSupplier?.approval_status || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedSupplier(null)}
                        className="p-2 theme-text-subtle hover:theme-text-main hover:bg-[var(--bg)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {/* Company Information */}
                    <div>
                        <h4 className="text-sm font-semibold theme-text-main mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[var(--primary)]" />
                            Company Information
                        </h4>
                        <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4 space-y-3">
                            <div>
                                <p className="text-xs font-medium theme-text-subtle">Company Description</p>
                                <p className="text-sm theme-text-main mt-1 leading-relaxed">
                                    {selectedSupplier?.company_description || 'No description provided'}
                                </p>
                            </div>
                            {selectedSupplier?.website && (
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 theme-text-subtle" />
                                    <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer"
                                        className="text-sm theme-text-primary hover:underline">
                                        {selectedSupplier.website}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h4 className="text-sm font-semibold theme-text-main mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            Contact Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Mail className="w-4 h-4 theme-text-subtle" />
                                    <p className="text-xs font-medium theme-text-subtle">Email</p>
                                </div>
                                <p className="text-sm font-semibold theme-text-main">
                                    {selectedSupplier?.email}
                                </p>
                            </div>
                            {selectedSupplier?.phone && (
                                <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Phone className="w-4 h-4 theme-text-subtle" />
                                        <p className="text-xs font-medium theme-text-subtle">Phone</p>
                                    </div>
                                    <p className="text-sm font-semibold theme-text-main">
                                        {selectedSupplier.phone}
                                    </p>
                                </div>
                            )}
                            {selectedSupplier?.address && (
                                <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4 sm:col-span-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4 theme-text-subtle" />
                                        <p className="text-xs font-medium theme-text-subtle">Address</p>
                                    </div>
                                    <p className="text-sm font-semibold theme-text-main">
                                        {selectedSupplier.address}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Registration Details */}
                    <div>
                        <h4 className="text-sm font-semibold theme-text-main mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-500" />
                            Registration Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                                <p className="text-xs font-medium theme-text-subtle mb-1">Registered On</p>
                                <p className="text-sm font-semibold theme-text-main">
                                    {selectedSupplier?.created_at
                                        ? new Date(selectedSupplier.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                            <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                                <p className="text-xs font-medium theme-text-subtle mb-1">Account Status</p>
                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full theme-badge-warning">
                                    {selectedSupplier?.approval_status || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t theme-border-color">
                        <button
                            onClick={() => {
                                setSelectedSupplier(null);
                                handleApprove(selectedSupplier);
                            }}
                            disabled={busyAction === `approve-${selectedSupplier?.id}`}
                            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {busyAction === `approve-${selectedSupplier?.id}` ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approve Supplier
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setSelectedSupplier(null);
                                setDeleteConfirm(selectedSupplier);
                            }}
                            className="flex-1 px-4 py-3 text-sm font-medium theme-badge-danger rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject Supplier
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Reject Confirmation Modal
    const RejectConfirmationModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="theme-card max-w-md w-full p-6 shadow-xl">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold theme-text-main">
                            Reject Supplier
                        </h3>
                        <p className="mt-2 text-sm theme-text-subtle">
                            Are you sure you want to reject <span className="font-medium theme-text-main">"{deleteConfirm?.company_name}"</span>? This supplier will not be able to access the marketplace.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleReject(deleteConfirm)}
                        disabled={busyAction === `reject-${deleteConfirm?.id}`}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {busyAction === `reject-${deleteConfirm?.id}` ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Rejecting...
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4" />
                                Confirm Reject
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="theme-card p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold theme-text-main">
                                Supplier Approvals
                            </h2>
                            <p className="text-sm theme-text-subtle mt-0.5">
                                Review and approve supplier registrations for marketplace access
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 px-4 py-3 bg-[var(--bg)] border theme-border-color rounded-xl">
                            <div className="text-center">
                                <p className="text-xs theme-text-subtle">Pending</p>
                                <p className="text-lg font-bold text-amber-500">
                                    {pendingSuppliers.filter(s => (s.approval_status || 'pending').toLowerCase() === 'pending').length}
                                </p>
                            </div>
                            <div className="w-px h-8 bg-[var(--border)]" />
                            <div className="text-center">
                                <p className="text-xs theme-text-subtle">Total</p>
                                <p className="text-lg font-bold theme-text-main">
                                    {pendingSuppliers.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="theme-card p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                    {/* Search, Filter, and Sort in ONE single row on all device screens */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
                        {/* Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 theme-text-subtle pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search suppliers..."
                                value={supplierSearch}
                                onChange={(e) => setSupplierSearch(e.target.value)}
                                className="theme-input-field w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl"
                            />
                        </div>

                        {/* Filter Toggle Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer ${hasActiveFilters || showFilters
                                ? 'theme-badge-primary font-semibold'
                                : 'theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)]'
                                }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="inline">Filters</span>
                            {hasActiveFilters && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                            )}
                        </button>

                        {/* Sort Dropdown */}
                        <div className="relative group flex-shrink-0">
                            <button className="px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium theme-text-main bg-[var(--bg)] border theme-border-color rounded-xl hover:bg-[var(--bg-elevated)] transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="inline">Sort</span>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 theme-card p-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            setSortBy('date');
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        }}
                                        className={`w-full px-3 py-2 text-sm rounded-lg text-left flex items-center justify-between cursor-pointer ${sortBy === 'date'
                                            ? 'theme-badge-primary font-semibold'
                                            : 'theme-text-main hover:bg-[var(--bg)]'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Date
                                        </span>
                                        {sortBy === 'date' && (
                                            <span className="text-xs">{sortOrder === 'asc' ? '↑ Oldest' : '↓ Newest'}</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('company');
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        }}
                                        className={`w-full px-3 py-2 text-sm rounded-lg text-left flex items-center justify-between cursor-pointer ${sortBy === 'company'
                                            ? 'theme-badge-primary font-semibold'
                                            : 'theme-text-main hover:bg-[var(--bg)]'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            Company Name
                                        </span>
                                        {sortBy === 'company' && (
                                            <span className="text-xs">{sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('email');
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        }}
                                        className={`w-full px-3 py-2 text-sm rounded-lg text-left flex items-center justify-between cursor-pointer ${sortBy === 'email'
                                            ? 'theme-badge-primary font-semibold'
                                            : 'theme-text-main hover:bg-[var(--bg)]'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </span>
                                        {sortBy === 'email' && (
                                            <span className="text-xs">{sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="pt-4 border-t theme-border-color">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 theme-text-subtle" />
                                    <span className="text-sm font-medium theme-text-main">Filters:</span>
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs theme-text-subtle">Status:</span>
                                    <div className="flex gap-1">
                                        {[
                                            { value: 'all', label: 'All' },
                                            { value: 'pending', label: 'Pending' },
                                            { value: 'under_review', label: 'Under Review' }
                                        ].map((status) => (
                                            <button
                                                key={status.value}
                                                onClick={() => setStatusFilter(status.value)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${statusFilter === status.value
                                                    ? 'theme-badge-primary font-bold'
                                                    : 'theme-text-subtle hover:bg-[var(--bg)] hover:theme-text-main'
                                                    }`}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range Filter */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 theme-text-subtle" />
                                    <div className="flex gap-1">
                                        {[
                                            { value: 'all', label: 'All Time' },
                                            { value: 'today', label: 'Today' },
                                            { value: 'week', label: 'This Week' },
                                            { value: 'month', label: 'This Month' }
                                        ].map((range) => (
                                            <button
                                                key={range.value}
                                                onClick={() => setDateRange(range.value)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${dateRange === range.value
                                                    ? 'theme-badge-primary font-bold'
                                                    : 'theme-text-subtle hover:bg-[var(--bg)] hover:theme-text-main'
                                                    }`}
                                            >
                                                {range.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Suppliers List */}
            <div className="theme-card shadow-sm overflow-hidden">
                {filteredSuppliers.length > 0 ? (
                    <div>
                        {/* Table Header */}
                        <div className="hidden lg:grid lg:grid-cols-[1fr,150px,130px,180px,120px] gap-4 px-6 py-3.5 bg-[var(--bg)] border-b theme-border-color">
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Company
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Status
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Registered
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Contact
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider text-right">
                                Actions
                            </div>
                        </div>

                        {/* Supplier Rows */}
                        <div className="divide-y theme-border-color">
                            {filteredSuppliers.map((supplier) => (
                                <div key={supplier.id} className="group hover:bg-[var(--bg)] transition-colors p-4 sm:px-6">
                                    <div className="flex flex-col lg:grid lg:grid-cols-[1fr,150px,130px,180px,120px] gap-3 lg:gap-4 lg:items-center">
                                        {/* Company Info */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 shadow-sm">
                                                {supplier.company_name ? supplier.company_name[0].toUpperCase() : 'S'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs sm:text-sm font-semibold theme-text-main">
                                                    {supplier.company_name}
                                                </h4>
                                                <p className="text-[11px] sm:text-xs theme-text-subtle line-clamp-1 mt-0.5">
                                                    {supplier.company_description || 'No description'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mobile/Desktop Data & Actions Row */}
                                        <div className="flex items-center justify-between lg:contents pt-2 lg:pt-0 border-t lg:border-t-0 theme-border-color">
                                            {/* Status */}
                                            <div>
                                                <span className="inline-flex items-center px-2 py-0.5 text-[11px] sm:text-xs font-medium rounded-full theme-badge-warning">
                                                    <Clock className="w-3 h-3 mr-1 animate-pulse" />
                                                    {supplier.approval_status || 'Pending'}
                                                </span>
                                            </div>

                                            {/* Registration Date */}
                                            <div className="text-xs theme-text-subtle">
                                                {supplier.created_at
                                                    ? new Date(supplier.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })
                                                    : 'N/A'
                                                }
                                            </div>

                                            {/* Contact */}
                                            <div className="hidden sm:flex items-center gap-1 text-xs theme-text-subtle truncate max-w-[160px]">
                                                <Mail className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{supplier.email}</span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedSupplier(supplier)}
                                                    className="p-1.5 theme-text-subtle hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={busyAction === `approve-${supplier.id}`}
                                                    onClick={() => handleApprove(supplier)}
                                                    className="p-1.5 theme-text-subtle hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                                    title="Approve Supplier"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={busyAction === `reject-${supplier.id}`}
                                                    onClick={() => setDeleteConfirm(supplier)}
                                                    className="p-1.5 theme-text-subtle hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                                    title="Reject Supplier"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer with Results Count */}
                        <div className="px-4 sm:px-6 py-3.5 bg-[var(--bg)] border-t theme-border-color">
                            <p className="text-xs theme-text-subtle">
                                Showing {filteredSuppliers.length} of {pendingSuppliers.length} suppliers
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-16 px-6">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border theme-border-color flex items-center justify-center mx-auto mb-6">
                            <UserCheck className="w-10 h-10 theme-text-subtle" />
                        </div>
                        <h3 className="text-lg font-semibold theme-text-main mb-2">
                            {supplierSearch || hasActiveFilters ? 'No matching suppliers' : 'No pending registrations'}
                        </h3>
                        <p className="text-sm theme-text-subtle mb-6 max-w-md mx-auto">
                            {supplierSearch || hasActiveFilters
                                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                                : 'All supplier applications have been reviewed. New registrations will appear here.'}
                        </p>
                        {(supplierSearch || hasActiveFilters) && (
                            <button
                                onClick={clearAllFilters}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedSupplier && <ViewDetailsModal />}
            {deleteConfirm && <RejectConfirmationModal />}
        </div>
    );
}