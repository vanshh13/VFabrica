import React from 'react';
import {
    FolderKanban,
    Edit3,
    Plus,
    Search,
    Trash2,
    X,
    Check,
    AlertCircle,
    Layers,
    Filter,
    ArrowUpDown,
    Eye,
    SlidersHorizontal,
    Calendar,
    Tag,
    ChevronDown
} from 'lucide-react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/adminService';

const categorySchema = z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().min(2, 'Category description is required')
});

export function CategoryTaxonomyModule() {
    const [categories, setCategories] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [busyAction, setBusyAction] = React.useState('');
    const [editingCategory, setEditingCategory] = React.useState(null);
    const [categorySearch, setCategorySearch] = React.useState('');
    const [deleteConfirm, setDeleteConfirm] = React.useState(null);
    const [showFormModal, setShowFormModal] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState(null);
    const [showFilters, setShowFilters] = React.useState(false);

    const categoryForm = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', description: '' }
    });

    const loadCategories = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleFormSubmit = async (values) => {
        const isEditing = Boolean(editingCategory);
        setBusyAction(isEditing ? `update-category-${editingCategory.id}` : 'create-category');
        try {
            if (isEditing) {
                await updateCategory(editingCategory.id, values);
            } else {
                await createCategory(values);
            }
            handleCloseModal();
            await loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setBusyAction('');
        }
    };

    const handleConfirmDelete = async (category) => {
        if (!category) return;
        setBusyAction(`delete-category-${category.id}`);
        try {
            await deleteCategory(category.id);
            setDeleteConfirm(null);
            await loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
        } finally {
            setBusyAction('');
        }
    };

    // Filter states
    const [statusFilter, setStatusFilter] = React.useState('all'); // 'all', 'active', 'inactive'
    const [sortBy, setSortBy] = React.useState('name'); // 'name', 'date', 'status'
    const [sortOrder, setSortOrder] = React.useState('asc'); // 'asc', 'desc'
    const [dateRange, setDateRange] = React.useState('all'); // 'all', 'today', 'week', 'month', 'year'

    const isFormBusy = busyAction === 'create-category' ||
        (editingCategory && busyAction === `update-category-${editingCategory.id}`);

    // Filter and sort logic
    const getFilteredAndSortedCategories = () => {
        let result = [...categories];

        // Search filter
        if (categorySearch) {
            result = result.filter(c =>
                c.name?.toLowerCase().includes(categorySearch.toLowerCase()) ||
                c.description?.toLowerCase().includes(categorySearch.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(c => {
                const status = c.status?.toLowerCase() || 'active';
                return status === statusFilter;
            });
        }

        // Date range filter
        if (dateRange !== 'all') {
            const now = new Date();
            result = result.filter(c => {
                const dateVal = c.createdAt || c.created_at;
                const createdDate = dateVal ? new Date(dateVal) : new Date();
                switch (dateRange) {
                    case 'today':
                        return createdDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return createdDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return createdDate >= monthAgo;
                    case 'year':
                        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                        return createdDate >= yearAgo;
                    default:
                        return true;
                }
            });
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'date':
                    comparison = new Date(a.createdAt || a.created_at || 0) - new Date(b.createdAt || b.created_at || 0);
                    break;
                case 'status':
                    comparison = (a.status || 'active').localeCompare(b.status || 'active');
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    };

    const filteredCategories = getFilteredAndSortedCategories();

    const handleEdit = (category) => {
        setEditingCategory(category);
        categoryForm.reset({
            name: category.name || '',
            description: category.description || ''
        });
        setShowFormModal(true);
    };

    const handleNewCategory = () => {
        setEditingCategory(null);
        categoryForm.reset({ name: '', description: '' });
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        setEditingCategory(null);
        categoryForm.reset({ name: '', description: '' });
    };

    const clearAllFilters = () => {
        setCategorySearch('');
        setStatusFilter('all');
        setSortBy('name');
        setSortOrder('asc');
        setDateRange('all');
    };

    const hasActiveFilters = statusFilter !== 'all' || dateRange !== 'all' || categorySearch !== '';

    // Category Form Modal
    const CategoryFormModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="theme-card rounded-2xl shadow-2xl w-full max-w-lg transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b theme-border-color">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
                            {editingCategory ? (
                                <Edit3 className="w-5 h-5 text-[var(--primary)]" />
                            ) : (
                                <Plus className="w-5 h-5 text-[var(--primary)]" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold theme-text-main">
                                {editingCategory ? 'Edit Category' : 'Create Category'}
                            </h3>
                            <p className="text-xs theme-text-subtle mt-0.5">
                                {editingCategory ? 'Update category details' : 'Add a new textile category to the marketplace'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCloseModal}
                        className="p-2 theme-text-subtle hover:theme-text-main hover:bg-[var(--bg)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <form
                    onSubmit={categoryForm.handleSubmit(handleFormSubmit)}
                    className="p-6 space-y-5"
                >
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium theme-text-main mb-1.5">
                            Category Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="e.g., Organic Cottons, Sustainable Silks..."
                                {...categoryForm.register('name')}
                                className={`theme-input-field w-full px-4 py-2.5 text-sm ${categoryForm.formState.errors.name ? 'border-rose-500' : ''}`}
                                autoFocus
                            />
                            {categoryForm.formState.errors.name && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        {categoryForm.formState.errors.name && (
                            <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {categoryForm.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* Description Field */}
                    <div>
                        <label className="block text-sm font-medium theme-text-main mb-1.5">
                            Description
                        </label>
                        <textarea
                            rows={5}
                            placeholder="Describe the types of fabrics, materials, and characteristics of this category..."
                            {...categoryForm.register('description')}
                            className={`theme-input-field w-full px-4 py-2.5 text-sm resize-none ${categoryForm.formState.errors.description ? 'border-rose-500' : ''}`}
                        />
                        {categoryForm.formState.errors.description && (
                            <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {categoryForm.formState.errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="bg-[var(--bg)] border theme-border-color rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Tag className="w-4 h-4 text-[var(--primary)]" />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold theme-text-main mb-1">
                                    Category Details
                                </h4>
                                <ul className="space-y-1 text-xs theme-text-subtle">
                                    <li className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-[var(--text-subtle)]" />
                                        Will be visible in the buyer marketplace
                                    </li>
                                    <li className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-[var(--text-subtle)]" />
                                        Can be assigned to multiple fabric listings
                                    </li>
                                    <li className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-[var(--text-subtle)]" />
                                        Status: Active by default
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="flex-1 px-4 py-2.5 text-sm font-medium theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isFormBusy}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white theme-badge-primary rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isFormBusy ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : editingCategory ? (
                                <>
                                    <Edit3 className="w-4 h-4" />
                                    Update Category
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Create Category
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    // View Details Modal
    const ViewDetailsModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="theme-card rounded-2xl shadow-2xl w-full max-w-lg transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b theme-border-color">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                            {selectedCategory?.name ? selectedCategory.name[0].toUpperCase() : 'C'}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold theme-text-main">
                                {selectedCategory?.name}
                            </h3>
                            <p className="text-xs theme-text-subtle mt-0.5">
                                Category Details
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="p-2 theme-text-subtle hover:theme-text-main hover:bg-[var(--bg)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between p-4 bg-[var(--bg)] border theme-border-color rounded-xl">
                        <span className="text-sm font-medium theme-text-main">Status</span>
                        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${(selectedCategory?.status || 'active').toLowerCase() === 'active'
                            ? 'theme-badge-success'
                            : 'theme-badge-danger'
                            }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${(selectedCategory?.status || 'active').toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {selectedCategory?.status || 'Active'}
                        </span>
                    </div>

                    {/* Description Section */}
                    <div>
                        <h4 className="text-sm font-semibold theme-text-main mb-2">
                            Description
                        </h4>
                        <p className="text-sm theme-text-subtle leading-relaxed">
                            {selectedCategory?.description || 'No description available for this category.'}
                        </p>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--bg)] border theme-border-color rounded-xl">
                            <p className="text-xs font-medium theme-text-subtle mb-1">
                                Created Date
                            </p>
                            <p className="text-sm font-semibold theme-text-main">
                                {(selectedCategory?.createdAt || selectedCategory?.created_at)
                                    ? new Date(selectedCategory.createdAt || selectedCategory.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                    : 'N/A'
                                }
                            </p>
                        </div>
                        <div className="p-4 bg-[var(--bg)] border theme-border-color rounded-xl">
                            <p className="text-xs font-medium theme-text-subtle mb-1">
                                Last Updated
                            </p>
                            <p className="text-sm font-semibold theme-text-main">
                                {(selectedCategory?.updatedAt || selectedCategory?.updated_at)
                                    ? new Date(selectedCategory.updatedAt || selectedCategory.updated_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                    : 'N/A'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => {
                                const cat = selectedCategory;
                                setSelectedCategory(null);
                                handleEdit(cat);
                            }}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white theme-badge-primary rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Category
                        </button>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="flex-1 px-4 py-2.5 text-sm font-medium theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Category Management Header */}
            <div className="theme-card shadow-sm">
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left Section - Title */}
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold theme-text-main truncate">
                                    Taxonomy Categories
                                </h2>
                                <p className="text-xs sm:text-sm theme-text-subtle mt-0.5 truncate">
                                    Manage textile categories for your marketplace
                                </p>
                            </div>
                        </div>

                        {/* Right Section - Stats & Create Action */}
                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 theme-border-color">
                            {/* Stats Counter */}
                            <div className="flex items-center gap-3 sm:gap-4 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[var(--bg)] border theme-border-color rounded-xl flex-shrink-0">
                                <div className="text-center px-1">
                                    <p className="text-[10px] sm:text-xs font-medium theme-text-subtle uppercase tracking-wider">Total</p>
                                    <p className="text-sm sm:text-base font-bold theme-text-main mt-0.5">{categories.length}</p>
                                </div>
                                <div className="w-px h-6 sm:h-7 bg-[var(--border)]" />
                                <div className="text-center px-1">
                                    <p className="text-[10px] sm:text-xs font-medium theme-text-subtle uppercase tracking-wider">Active</p>
                                    <p className="text-sm sm:text-base font-bold text-emerald-500 mt-0.5">
                                        {categories.filter(c => (c.status || 'active').toLowerCase() === 'active').length}
                                    </p>
                                </div>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleNewCategory}
                                className="px-3.5 sm:px-4 py-2 sm:py-2.5 theme-badge-primary text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ml-auto sm:ml-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Category</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="theme-card shadow-sm p-3.5 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Search, Filter, and Sort in ONE single row on all device screens */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
                        {/* Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 theme-text-subtle pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
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
                                                setSortBy('name');
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            }}
                                            className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg text-left flex items-center justify-between cursor-pointer ${sortBy === 'name'
                                                ? 'theme-badge-primary font-semibold'
                                                : 'theme-text-main hover:bg-[var(--bg)]'
                                                }`}
                                        >
                                            Name
                                            {sortBy === 'name' && (
                                                <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('date');
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            }}
                                            className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg text-left flex items-center justify-between cursor-pointer ${sortBy === 'date'
                                                ? 'theme-badge-primary font-semibold'
                                                : 'theme-text-main hover:bg-[var(--bg)]'
                                                }`}
                                        >
                                            Date
                                            {sortBy === 'date' && (
                                                <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="pt-3 border-t theme-border-color space-y-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3.5 h-3.5 theme-text-subtle" />
                                    <span className="text-xs sm:text-sm font-medium theme-text-main">Filters:</span>
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs theme-text-subtle">Status:</span>
                                    <div className="flex gap-1">
                                        {['all', 'active', 'inactive'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${statusFilter === status
                                                    ? 'theme-badge-primary font-semibold'
                                                    : 'theme-text-subtle hover:bg-[var(--bg)] hover:theme-text-main'
                                                    }`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Categories List */}
            <div className="theme-card shadow-sm overflow-hidden">
                {filteredCategories.length > 0 ? (
                    <div>
                        {/* Desktop Table Header */}
                        <div className="hidden md:grid md:grid-cols-[1fr,120px,140px,110px] gap-4 px-6 py-3.5 bg-[var(--bg)] border-b theme-border-color">
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Category Name
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Status
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider">
                                Created Date
                            </div>
                            <div className="text-xs font-semibold theme-text-subtle uppercase tracking-wider text-right">
                                Actions
                            </div>
                        </div>

                        {/* Category Rows */}
                        <div className="divide-y theme-border-color">
                            {filteredCategories.map((category) => {
                                const createdDateStr = (category.createdAt || category.created_at)
                                    ? new Date(category.createdAt || category.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                    : 'N/A';

                                return (
                                    <div key={category.id} className="group hover:bg-[var(--bg)] transition-colors p-4 sm:px-6">
                                        <div className="flex flex-col md:grid md:grid-cols-[1fr,120px,140px,110px] gap-3 md:gap-4 md:items-center">
                                            {/* Column 1: Category Info */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 shadow-sm">
                                                    {category.name ? category.name[0].toUpperCase() : 'C'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs sm:text-sm font-semibold theme-text-main truncate">
                                                        {category.name}
                                                    </h4>
                                                    <p className="text-[11px] sm:text-xs theme-text-subtle line-clamp-1 mt-0.5">
                                                        {category.description || 'No description'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Column 2: Status */}
                                            <div className="flex items-center md:block">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] sm:text-xs font-medium rounded-full ${(category.status || 'active').toLowerCase() === 'active'
                                                    ? 'theme-badge-success'
                                                    : 'theme-badge-danger'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${(category.status || 'active').toLowerCase() === 'active'
                                                        ? 'bg-emerald-500 animate-pulse'
                                                        : 'bg-rose-500'
                                                        }`} />
                                                    {category.status || 'Active'}
                                                </span>
                                            </div>

                                            {/* Column 3: Created Date */}
                                            <div className="text-xs theme-text-subtle">
                                                {createdDateStr}
                                            </div>

                                            {/* Column 4: Actions */}
                                            <div className="flex items-center justify-start md:justify-end gap-1">
                                                <button
                                                    onClick={() => setSelectedCategory(category)}
                                                    className="p-1.5 theme-text-subtle hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="p-1.5 theme-text-subtle hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Category"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={busyAction === `delete-category-${category.id}`}
                                                    onClick={() => setDeleteConfirm(category)}
                                                    className="p-1.5 theme-text-subtle hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer with Results Count */}
                        <div className="px-4 sm:px-6 py-3.5 bg-[var(--bg)] border-t theme-border-color">
                            <p className="text-xs theme-text-subtle">
                                Showing {filteredCategories.length} of {categories.length} categories
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-16 px-6">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border theme-border-color flex items-center justify-center mx-auto mb-6">
                            <FolderKanban className="w-10 h-10 theme-text-subtle" />
                        </div>
                        <h3 className="text-lg font-semibold theme-text-main mb-2">
                            {categorySearch || hasActiveFilters ? 'No matching categories' : 'No categories yet'}
                        </h3>
                        <p className="text-sm theme-text-subtle mb-6 max-w-md mx-auto">
                            {categorySearch || hasActiveFilters
                                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                                : 'Get started by creating your first textile category for the marketplace.'}
                        </p>
                        {categorySearch || hasActiveFilters ? (
                            <button
                                onClick={clearAllFilters}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium theme-text-main bg-[var(--bg)] border theme-border-color hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        ) : (
                            <button
                                onClick={handleNewCategory}
                                className="inline-flex items-center gap-2 px-4 py-2.5 theme-badge-primary text-white font-medium text-sm rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Create Your First Category
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="theme-card max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold theme-text-main">
                                    Delete Category
                                </h3>
                                <p className="mt-2 text-sm theme-text-subtle">
                                    Are you sure you want to delete <span className="font-medium theme-text-main">"{deleteConfirm.name}"</span>? This action cannot be undone and will remove this category from all associated fabrics.
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
                                onClick={() => handleConfirmDelete(deleteConfirm)}
                                disabled={busyAction === `delete-category-${deleteConfirm.id}`}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {busyAction === `delete-category-${deleteConfirm.id}` ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Category
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showFormModal && <CategoryFormModal />}
            {selectedCategory && <ViewDetailsModal />}
        </div>
    );
}