import React from 'react';
import {
    Users,
    Search,
    ShieldAlert,
    CheckCircle2,
    Eye,
    Filter,
    ArrowUpDown,
    Calendar,
    Mail,
    Clock,
    UserCheck,
    UserX,
    Shield,
    Activity,
    X,
    AlertCircle,
    SlidersHorizontal,
    Building2,
    Key,
    MoreVertical
} from 'lucide-react';

import { getUsers, updateUserStatus } from '../../services/adminService';

export function UserDirectoryModule() {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [busyAction, setBusyAction] = React.useState('');
    const [userSearch, setUserSearch] = React.useState('');
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [statusConfirm, setStatusConfirm] = React.useState(null);
    const [showFilters, setShowFilters] = React.useState(false);

    const loadUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await getUsers();
            setUsers(response.data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleStatusUpdate = async (targetUser) => {
        if (!targetUser) return;
        const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
        setBusyAction(`${nextStatus}-${targetUser.id}`);
        try {
            await updateUserStatus({ userId: targetUser.id, status: nextStatus });
            setStatusConfirm(null);
            if (selectedUser?.id === targetUser.id) {
                setSelectedUser(null);
            }
            await loadUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
        } finally {
            setBusyAction('');
        }
    };

    // Filter states
    const [userStatusFilter, setUserStatusFilter] = React.useState('all');
    const [roleFilter, setRoleFilter] = React.useState('all');
    const [sortBy, setSortBy] = React.useState('date'); // 'date', 'email', 'status', 'roles'
    const [sortOrder, setSortOrder] = React.useState('desc'); // 'asc', 'desc'
    const [dateRange, setDateRange] = React.useState('all'); // 'all', 'today', 'week', 'month'

    // Get unique roles for filter
    const uniqueRoles = React.useMemo(() => {
        const roles = new Set();
        users.forEach(u => {
            (u.roles || []).forEach(r => roles.add(r));
        });
        return ['all', ...Array.from(roles)];
    }, [users]);

    // Filter and sort logic
    const getFilteredAndSortedUsers = () => {
        let result = [...users];

        // Search filter
        if (userSearch) {
            result = result.filter(u =>
                u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.id?.toLowerCase().includes(userSearch.toLowerCase()) ||
                (u.roles || []).some(r => r.toLowerCase().includes(userSearch.toLowerCase()))
            );
        }

        // Status filter
        if (userStatusFilter !== 'all') {
            result = result.filter(u => u.status === userStatusFilter);
        }

        // Role filter
        if (roleFilter !== 'all') {
            result = result.filter(u => (u.roles || []).includes(roleFilter));
        }

        // Date range filter
        if (dateRange !== 'all') {
            const now = new Date();
            result = result.filter(u => {
                const createdDate = u.created_at ? new Date(u.created_at) : new Date();
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

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'email':
                    comparison = (a.email || '').localeCompare(b.email || '');
                    break;
                case 'status':
                    comparison = (a.status || '').localeCompare(b.status || '');
                    break;
                case 'roles':
                    comparison = ((a.roles || [])[0] || '').localeCompare((b.roles || [])[0] || '');
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

    const filteredUsers = getFilteredAndSortedUsers();

    const clearAllFilters = () => {
        setUserSearch('');
        setUserStatusFilter('all');
        setRoleFilter('all');
        setSortBy('date');
        setSortOrder('desc');
        setDateRange('all');
    };

    const hasActiveFilters = userStatusFilter !== 'all' || roleFilter !== 'all' || dateRange !== 'all' || userSearch !== '';

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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                            {selectedUser?.email ? selectedUser.email[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold theme-text-main">
                                {selectedUser?.email}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs theme-text-subtle font-mono">
                                    ID: {selectedUser?.id?.slice(0, 12)}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${selectedUser?.status === 'active'
                                    ? 'theme-badge-success'
                                    : 'theme-badge-danger'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${selectedUser?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                        }`} />
                                    {selectedUser?.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="p-2 theme-text-subtle hover:theme-text-main hover:bg-[var(--bg)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {/* Account Status */}
                    <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                        <h4 className="text-sm font-semibold theme-text-main mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            Account Status
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium theme-text-subtle mb-1">Current Status</p>
                                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${selectedUser?.status === 'active'
                                    ? 'theme-badge-success'
                                    : 'theme-badge-danger'
                                    }`}>
                                    {selectedUser?.status === 'active' ? (
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    ) : (
                                        <ShieldAlert className="w-4 h-4 mr-1.5" />
                                    )}
                                    {selectedUser?.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-medium theme-text-subtle mb-1">Last Active</p>
                                <p className="text-sm font-semibold theme-text-main flex items-center gap-1">
                                    <Clock className="w-4 h-4 theme-text-subtle" />
                                    {selectedUser?.last_active
                                        ? new Date(selectedUser.last_active).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Roles & Permissions */}
                    <div>
                        <h4 className="text-sm font-semibold theme-text-main mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-500" />
                            Roles & Permissions
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {(selectedUser?.roles || []).map((role) => (
                                <span
                                    key={role}
                                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg theme-badge-primary"
                                >
                                    {role}
                                </span>
                            ))}
                            {(!selectedUser?.roles || selectedUser.roles.length === 0) && (
                                <span className="text-xs theme-text-subtle">
                                    No roles assigned
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Account Details */}
                    <div>
                        <h4 className="text-sm font-semibold theme-text-main mb-3 flex items-center gap-2">
                            <Key className="w-4 h-4 text-blue-500" />
                            Account Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                                <p className="text-xs font-medium theme-text-subtle mb-1">User ID</p>
                                <p className="text-sm font-mono theme-text-main">
                                    {selectedUser?.id}
                                </p>
                            </div>
                            <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                                <p className="text-xs font-medium theme-text-subtle mb-1">Email</p>
                                <p className="text-sm font-semibold theme-text-main">
                                    {selectedUser?.email}
                                </p>
                            </div>
                            <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                                <p className="text-xs font-medium theme-text-subtle mb-1">Registered On</p>
                                <p className="text-sm font-semibold theme-text-main">
                                    {selectedUser?.created_at
                                        ? new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                            <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                                <p className="text-xs font-medium theme-text-subtle mb-1">Last Updated</p>
                                <p className="text-sm font-semibold theme-text-main">
                                    {selectedUser?.updated_at
                                        ? new Date(selectedUser.updated_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t theme-border-color">
                        <button
                            onClick={() => {
                                setSelectedUser(null);
                                setStatusConfirm(selectedUser);
                            }}
                            disabled={busyAction === `${selectedUser?.status === 'active' ? 'suspend' : 'activate'}-${selectedUser?.id}`}
                            className={`flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${selectedUser?.status === 'active'
                                ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20'
                                : 'text-white bg-emerald-600 hover:bg-emerald-700'
                                }`}
                        >
                            {selectedUser?.status === 'active' ? (
                                <>
                                    <ShieldAlert className="w-4 h-4" />
                                    Suspend Account
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Activate Account
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="flex-1 px-4 py-3 text-sm font-medium theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Status Change Confirmation Modal
    const StatusConfirmModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="theme-card rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusConfirm?.status === 'active'
                        ? 'bg-rose-500/20 text-rose-500'
                        : 'bg-emerald-500/20 text-emerald-500'
                        }`}>
                        {statusConfirm?.status === 'active' ? (
                            <ShieldAlert className="w-5 h-5" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold theme-text-main">
                            {statusConfirm?.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                        </h3>
                        <p className="mt-2 text-sm theme-text-subtle">
                            {statusConfirm?.status === 'active'
                                ? `Are you sure you want to suspend "${statusConfirm?.email}"? This user will lose access to the platform immediately.`
                                : `Are you sure you want to activate "${statusConfirm?.email}"? This will restore their access to the platform.`
                            }
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setStatusConfirm(null)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleStatusUpdate(statusConfirm)}
                        disabled={busyAction === `${statusConfirm?.status === 'active' ? 'suspend' : 'activate'}-${statusConfirm?.id}`}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${statusConfirm?.status === 'active'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                    >
                        {busyAction === `${statusConfirm?.status === 'active' ? 'suspend' : 'activate'}-${statusConfirm?.id}` ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {statusConfirm?.status === 'active' ? 'Suspending...' : 'Activating...'}
                            </>
                        ) : statusConfirm?.status === 'active' ? (
                            <>
                                <UserX className="w-4 h-4" />
                                Confirm Suspension
                            </>
                        ) : (
                            <>
                                <UserCheck className="w-4 h-4" />
                                Confirm Reactivation
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
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold theme-text-main">
                                User Directory
                            </h2>
                            <p className="text-sm theme-text-subtle mt-0.5">
                                Manage registered accounts and permissions across the marketplace
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 px-4 py-3 bg-[var(--bg)] border theme-border-color rounded-xl">
                            <div className="text-center">
                                <p className="text-xs theme-text-subtle">Total</p>
                                <p className="text-lg font-bold theme-text-main">{users.length}</p>
                            </div>
                            <div className="w-px h-8 bg-[var(--border)]" />
                            <div className="text-center">
                                <p className="text-xs theme-text-subtle">Active</p>
                                <p className="text-lg font-bold text-emerald-500">
                                    {users.filter(u => u.is_active !== false).length}
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
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
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
                                        Date Created
                                        {sortBy === 'date' && (
                                            <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
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
                                        Email
                                        {sortBy === 'email' && (
                                            <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('status');
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        }}
                                        className={`w-full px-3 py-2 text-sm rounded-lg text-left flex items-center justify-between cursor-pointer ${sortBy === 'status'
                                            ? 'theme-badge-primary font-semibold'
                                            : 'theme-text-main hover:bg-[var(--bg)]'
                                            }`}
                                    >
                                        Status
                                        {sortBy === 'status' && (
                                            <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="pt-4 border-t theme-border-color">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
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
                                            { value: 'active', label: 'Active' },
                                            { value: 'suspended', label: 'Suspended' }
                                        ].map((s) => (
                                            <button
                                                key={s.value}
                                                onClick={() => setUserStatusFilter(s.value)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${userStatusFilter === s.value
                                                    ? 'theme-badge-primary font-bold'
                                                    : 'theme-text-subtle hover:bg-[var(--bg)] hover:theme-text-main'
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Role Filter */}
                                {uniqueRoles.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs theme-text-subtle">Role:</span>
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="theme-input-field px-3 py-1 text-xs"
                                        >
                                            <option value="all">All Roles</option>
                                            {uniqueRoles.map((r) => (
                                                <option key={r} value={r}>
                                                    {r.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

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

            {/* Users List */}
            <div className="theme-card shadow-sm overflow-hidden">
                {filteredUsers.length > 0 ? (
                    <div>
                        {/* Table Header */}
                        <div className="hidden md:grid md:grid-cols-[1fr,140px,120px,120px,100px] gap-4 px-6 py-3.5 bg-[var(--bg)] border-b theme-border-color">
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                User Account
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Roles
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Status
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Joined
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider text-right">
                                Actions
                            </div>
                        </div>

                        {/* User Rows */}
                        <div className="divide-y theme-border-color">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="group hover:bg-[var(--bg)] transition-colors p-4 sm:px-6">
                                    <div className="flex flex-col md:grid md:grid-cols-[1fr,140px,120px,120px,100px] gap-3 md:gap-4 md:items-center">
                                        {/* User Info */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 shadow-sm">
                                                {user.email ? user.email[0].toUpperCase() : 'U'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs sm:text-sm font-semibold theme-text-main truncate">
                                                    {user.email}
                                                </h4>
                                                <p className="text-[11px] sm:text-xs theme-text-subtle font-mono truncate mt-0.5">
                                                    ID: {user.id}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mobile/Desktop Data & Actions Row */}
                                        <div className="flex items-center justify-between md:contents pt-2 md:pt-0 border-t md:border-t-0 theme-border-color">
                                            {/* Roles */}
                                            <div className="flex gap-1 flex-wrap">
                                                {Array.isArray(user.roles) ? (
                                                    user.roles.map((r) => (
                                                        <span key={r} className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-md theme-badge-primary uppercase">
                                                            {r}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-md theme-badge-primary uppercase">
                                                        {user.role || 'user'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] sm:text-xs font-medium rounded-full ${user.is_active !== false
                                                    ? 'theme-badge-success'
                                                    : 'theme-badge-danger'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${user.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                    {user.is_active !== false ? 'Active' : 'Suspended'}
                                                </span>
                                            </div>

                                            {/* Created Date */}
                                            <div className="text-xs theme-text-subtle">
                                                {user.created_at
                                                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })
                                                    : 'N/A'
                                                }
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-1.5 theme-text-subtle hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={busyAction === `toggle-status-${user.id}`}
                                                    onClick={() => setStatusConfirm(user)}
                                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${user.is_active !== false
                                                        ? 'theme-text-subtle hover:text-rose-500 hover:bg-rose-500/10'
                                                        : 'theme-text-subtle hover:text-emerald-500 hover:bg-emerald-500/10'
                                                        }`}
                                                    title={user.is_active !== false ? 'Suspend User' : 'Reactivate User'}
                                                >
                                                    {user.is_active !== false ? (
                                                        <UserX className="w-4 h-4" />
                                                    ) : (
                                                        <UserCheck className="w-4 h-4" />
                                                    )}
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
                                Showing {filteredUsers.length} of {users.length} registered accounts
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-16 px-6">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border theme-border-color flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 theme-text-subtle" />
                        </div>
                        <h3 className="text-lg font-semibold theme-text-main mb-2">
                            {userSearch || hasActiveFilters ? 'No matching users' : 'No user accounts found'}
                        </h3>
                        <p className="text-sm theme-text-subtle mb-6 max-w-md mx-auto">
                            {userSearch || hasActiveFilters
                                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                                : 'Registered user accounts will appear here.'}
                        </p>
                        {(userSearch || hasActiveFilters) && (
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
            {selectedUser && <ViewDetailsModal />}
            {statusConfirm && <StatusConfirmModal />}
        </div>
    );
}