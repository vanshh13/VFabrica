import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { SupplierGateway } from './SupplierGateway';
import { getCategories, getCatalogMasters } from '../../services/adminService';
import {
    getSupplierProducts,
    getSupplierProductDetails,
    createSupplierProduct,
    updateSupplierProduct,
    deleteSupplierProduct
} from '../../services/supplierService';
import {
    Package,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Upload,
    ChevronLeft,
    ChevronRight,
    IndianRupee,
    CheckCircle2,
    AlertCircle,
    Save,
    Image as ImageIcon,
    SlidersHorizontal,
    Layers,
    Tag,
    Shield,
    Sparkles
} from 'lucide-react';

const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function ProductsInner() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [masters, setMasters] = useState({ units: [], sizes: [], colors: [], attributes: [], fabricTypes: [] });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', ok: true });
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'pricing' | 'images' | 'variants'
    const [urlImageInput, setUrlImageInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        basePrice: '',
        minimumOrderQuantity: '10',
        leadTimeDays: '3',
        categoryId: '',
        fabricTypeId: '',
        unitId: '',
        brand: '',
        status: 'active',
        images: [],
        variants: []
    });

    const showMsg = (text, ok = true) => {
        setMsg({ text, ok });
        setTimeout(() => setMsg({ text: '', ok: true }), 3500);
    };

    const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    // Debounce Live Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const load = useCallback(async (targetPage = 1, searchQuery = debouncedSearch) => {
        setLoading(true);
        try {
            const filtersList = [];
            if (searchQuery) {
                filtersList.push({ field: 'name', operator: 'contains', value: searchQuery });
            }
            if (statusFilter !== 'all') {
                filtersList.push({ field: 'status', operator: 'eq', value: statusFilter });
            }
            if (categoryFilter) {
                filtersList.push({ field: 'category_id', operator: 'eq', value: categoryFilter });
            }

            const [cR, mR, pR] = await Promise.all([
                getCategories(),
                getCatalogMasters().catch(() => ({ data: {} })),
                getSupplierProducts({
                    page: targetPage,
                    limit: 10,
                    filters: filtersList,
                    sort: [{ field: 'created_at', order: 'desc' }]
                })
            ]);

            setCategories(cR.data || []);
            setMasters(mR.data || { units: [], sizes: [], colors: [], attributes: [], fabricTypes: [] });

            const dataPayload = pR.data;
            const productList = Array.isArray(dataPayload) ? dataPayload : (dataPayload?.items || []);
            const meta = dataPayload?.pagination || { page: targetPage, limit: 10, totalItems: productList.length, totalPages: 1 };

            setProducts(productList);
            setPagination(meta);
            setPage(targetPage);
        } catch (e) {
            showMsg(e?.message || 'Load failed', false);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, statusFilter, categoryFilter]);

    useEffect(() => {
        load(1, debouncedSearch);
    }, [debouncedSearch, statusFilter, categoryFilter]);

    const openNew = () => {
        setEditing(null);
        setActiveTab('basic');
        setForm({
            name: '',
            description: '',
            basePrice: '',
            minimumOrderQuantity: '10',
            leadTimeDays: '3',
            categoryId: '',
            fabricTypeId: '',
            unitId: '',
            brand: '',
            status: 'active',
            images: [],
            variants: []
        });
        setUrlImageInput('');
        setShowForm(true);
    };

    const openEdit = async (p) => {
        setEditing(p);
        setActiveTab('basic');
        setShowForm(true);
        try {
            const detailsRes = await getSupplierProductDetails(p.id);
            const details = detailsRes.data || detailsRes;
            setForm({
                name: details.name || '',
                description: details.description || '',
                basePrice: details.base_price || details.price || '',
                minimumOrderQuantity: details.minimum_order_quantity || '',
                leadTimeDays: details.lead_time_days || '',
                categoryId: details.category_id || '',
                fabricTypeId: details.fabric_type_id || '',
                unitId: details.unit_id || '',
                brand: details.brand || '',
                status: details.status || 'active',
                images: ((details.images && details.images.length > 0)
                    ? details.images
                    : (details.primaryImage ? [details.primaryImage] : [])
                ).map((img, idx) => ({
                    imageUrl: img.image_url || img.imageUrl,
                    displayOrder: img.display_order ?? img.displayOrder ?? idx,
                    isPrimary: !!(img.is_primary || img.isPrimary) || (idx === 0)
                })),
                variants: (details.variants || []).map(v => ({
                    sizeId: v.size_id || v.sizeId || '',
                    colorId: v.color_id || v.colorId || '',
                    sku: v.sku || '',
                    price: v.price || '',
                    status: v.status || 'active'
                }))
            });
        } catch {
            const fallbackImages = (p.images && p.images.length > 0)
                ? p.images
                : (p.primaryImage ? [p.primaryImage] : []);
            setForm({
                name: p.name || '',
                description: p.description || '',
                basePrice: p.price || p.base_price || '',
                minimumOrderQuantity: p.minimum_order_quantity || '',
                leadTimeDays: p.lead_time_days || '',
                categoryId: p.category_id || '',
                fabricTypeId: p.fabric_type_id || '',
                unitId: p.unit_id || '',
                brand: p.brand || '',
                status: p.status || 'active',
                images: fallbackImages.map((img, idx) => ({
                    imageUrl: img.image_url || img.imageUrl,
                    displayOrder: img.display_order ?? img.displayOrder ?? idx,
                    isPrimary: !!(img.is_primary || img.isPrimary) || (idx === 0)
                })),
                variants: (p.variants || []).map(v => ({
                    sizeId: v.size_id || v.sizeId || '',
                    colorId: v.color_id || v.colorId || '',
                    sku: v.sku || '',
                    price: v.price || '',
                    status: v.status || 'active'
                }))
            });
        }
    };

    const handleImageFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            try {
                const dataUrl = await readFileAsDataUrl(file);
                setForm(p => ({
                    ...p,
                    images: [
                        ...p.images,
                        { imageUrl: dataUrl, displayOrder: p.images.length, isPrimary: p.images.length === 0 }
                    ]
                }));
            } catch (err) {
                showMsg('Failed to process image file', false);
            }
        }
        e.target.value = '';
    };

    const addImageUrl = () => {
        if (!urlImageInput.trim()) return;
        setForm(p => ({
            ...p,
            images: [
                ...p.images,
                { imageUrl: urlImageInput.trim(), displayOrder: p.images.length, isPrimary: p.images.length === 0 }
            ]
        }));
        setUrlImageInput('');
    };

    const removeImage = (index) => {
        setForm(p => {
            const nextImages = p.images.filter((_, i) => i !== index);
            if (nextImages.length > 0 && !nextImages.some(img => img.isPrimary)) {
                nextImages[0].isPrimary = true;
            }
            return { ...p, images: nextImages };
        });
    };

    const setPrimaryImage = (index) => {
        setForm(p => ({
            ...p,
            images: p.images.map((img, i) => ({ ...img, isPrimary: i === index }))
        }));
    };

    const addVariant = () => {
        setForm(p => ({
            ...p,
            variants: [
                ...p.variants,
                { sizeId: '', colorId: '', sku: '', price: p.basePrice || '', status: 'active' }
            ]
        }));
    };

    const removeVariant = (index) => {
        setForm(p => ({
            ...p,
            variants: p.variants.filter((_, i) => i !== index)
        }));
    };

    const updateVariantField = (index, field, value) => {
        setForm(p => {
            const updated = [...p.variants];
            updated[index] = { ...updated[index], [field]: value };
            return { ...p, variants: updated };
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                description: form.description,
                basePrice: parseFloat(form.basePrice) || 0,
                minimumOrderQuantity: parseInt(form.minimumOrderQuantity) || 1,
                leadTimeDays: parseInt(form.leadTimeDays) || 3,
                categoryId: form.categoryId || null,
                fabricTypeId: form.fabricTypeId || null,
                unitId: form.unitId || null,
                brand: form.brand || null,
                status: form.status,
                images: form.images,
                variants: form.variants
            };

            if (editing) {
                await updateSupplierProduct(editing.id, payload);
                showMsg('Product updated successfully!');
            } else {
                await createSupplierProduct(payload);
                showMsg('Product created successfully!');
            }
            setShowForm(false);
            await load(page, debouncedSearch);
        } catch (e) {
            showMsg(e?.response?.data?.error || e?.message || 'Save failed', false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
        try {
            await deleteSupplierProduct(id);
            showMsg('Product deleted successfully');
            await load(page, debouncedSearch);
        } catch (e) {
            showMsg('Delete failed', false);
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'active' || s === 'published') {
            return (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Active
                </span>
            );
        }
        if (s === 'draft') {
            return (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    Draft
                </span>
            );
        }
        if (s === 'out_of_stock') {
            return (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Out of Stock
                </span>
            );
        }
        return (
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Inactive
            </span>
        );
    };

    return (
        <>
            {/* Header Banner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                Fabric Product Catalog
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Manage listed materials, pricing, variants, and stock status
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                            {pagination.totalItems} Items Listed
                        </span>
                        <button
                            onClick={openNew}
                            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Add Fabric
                        </button>
                    </div>
                </div>
            </div>

            {/* Live Search & Filters Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Live search fabrics by name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="inactive">Inactive</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>
                </div>
            </div>

            {/* Message Toast Alert */}
            {msg.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                    msg.ok
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                    {msg.ok ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-xs sm:text-sm font-semibold">{msg.text}</p>
                </div>
            )}

            {/* Product List / Table View */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl h-20 border border-gray-200 dark:border-gray-700" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        No Fabric Products Found
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        Start building your mill catalog by creating your first product.
                    </p>
                    <button
                        onClick={openNew}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:from-indigo-700 hover:to-purple-700 transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add First Fabric
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid md:grid-cols-[1.5fr,1fr,1fr,1.2fr,1fr,100px] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 z-10">
                        <div>Product Name & Spec</div>
                        <div>Price / Unit</div>
                        <div>Category</div>
                        <div>Stock Availability</div>
                        <div>Status</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {/* Table Body & Mobile Cards */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                        {products.map(p => {
                            const availQty = p.inventory?.availableQuantity ?? p.available_quantity ?? p.total_available_stock ?? p.stock ?? 0;
                            const unitLabel = p.unit_name || p.unit || 'Meter';
                            const primaryImgUrl = p.primaryImage?.image_url
                                || p.primaryImage?.imageUrl
                                || p.primary_image_url
                                || p.primaryImageUrl
                                || p.image_url
                                || p.imageUrl
                                || p.images?.find(img => img.is_primary || img.isPrimary)?.image_url
                                || p.images?.find(img => img.is_primary || img.isPrimary)?.imageUrl
                                || p.images?.[0]?.image_url
                                || p.images?.[0]?.imageUrl;

                            return (
                                <div key={p.id} className="p-4 sm:p-5 md:px-6 md:py-4 hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors">
                                    {/* Desktop View Row */}
                                    <div className="hidden md:grid md:grid-cols-[1.5fr,1fr,1fr,1.2fr,1fr,100px] gap-4 items-center">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {primaryImgUrl ? (
                                                    <img src={primaryImgUrl} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-6 h-6 text-indigo-400 opacity-60" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                                    {p.name}
                                                </h4>
                                                {p.fabric_type_name && (
                                                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{p.fabric_type_name}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-xs sm:text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                                ₹{Number(p.price || p.base_price || 0).toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">/{unitLabel}</span>
                                        </div>

                                        <div>
                                            {p.category_name ? (
                                                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                    {p.category_name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </div>

                                        <div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                                                availQty > 0
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                            }`}>
                                                {availQty > 0 ? `${availQty} ${unitLabel}` : 'Out of Stock'}
                                            </span>
                                        </div>

                                        <div>
                                            {getStatusBadge(p.status)}
                                        </div>

                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                                title="Edit Fabric"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id, p.name)}
                                                className="p-1.5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Fabric"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mobile View Card */}
                                    <div className="md:hidden space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {primaryImgUrl ? (
                                                        <img src={primaryImgUrl} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-6 h-6 text-indigo-400 opacity-60" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                                        {p.name}
                                                    </h4>
                                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                        ₹{Number(p.price || p.base_price || 0).toLocaleString('en-IN')} / {unitLabel}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(p.status)}
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                                                Stock: <strong className="text-gray-900 dark:text-white">{availQty} {unitLabel}</strong>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id, p.name)}
                                                    className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-lg border border-rose-200 dark:border-rose-800"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} items)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => load(page - 1, debouncedSearch)}
                                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>
                                <button
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => load(page + 1, debouncedSearch)}
                                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Multi-Section Add / Edit Fabric Form Modal */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto border border-gray-200 dark:border-gray-700"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Sticky Header */}
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                                        {editing ? 'Edit Fabric Product' : 'Add New Fabric Product'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Configure basic attributes, wholesale pricing, images, and variants
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Tab Navigation */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 px-5 gap-4 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setActiveTab('basic')}
                                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                                    activeTab === 'basic'
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                📌 1. Basic Info
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('pricing')}
                                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                                    activeTab === 'pricing'
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                💰 2. Pricing & Specs
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('images')}
                                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                                    activeTab === 'images'
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                🖼️ 3. Images ({form.images.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('variants')}
                                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                                    activeTab === 'variants'
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                🎨 4. Variants ({form.variants.length})
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Tab 1: Basic Info */}
                            {activeTab === 'basic' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            Fabric Product Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={f('name')}
                                            placeholder="e.g., Organic Cotton Poplin, Silk Satin 16mm"
                                            required
                                            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            Material Description
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={form.description}
                                            onChange={f('description')}
                                            placeholder="Specify weave type, thread count, GSM, suitable garment uses..."
                                            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Category
                                            </label>
                                            <select
                                                value={form.categoryId}
                                                onChange={f('categoryId')}
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Fabric Type / Material
                                            </label>
                                            <select
                                                value={form.fabricTypeId}
                                                onChange={f('fabricTypeId')}
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Select Fabric Type</option>
                                                {(masters.fabricTypes || []).map(ft => (
                                                    <option key={ft.id} value={ft.id}>{ft.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Brand / Mill Collection
                                            </label>
                                            <input
                                                type="text"
                                                value={form.brand}
                                                onChange={f('brand')}
                                                placeholder="e.g., VF Essentials, Surat Weaves"
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Catalog Status
                                            </label>
                                            <select
                                                value={form.status}
                                                onChange={f('status')}
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="active">Active (Published)</option>
                                                <option value="draft">Draft</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="out_of_stock">Out of Stock</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Pricing & Specs */}
                            {activeTab === 'pricing' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Base Price (₹) <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={form.basePrice}
                                                    onChange={f('basePrice')}
                                                    placeholder="11.80"
                                                    required
                                                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Selling Unit
                                            </label>
                                            <select
                                                value={form.unitId}
                                                onChange={f('unitId')}
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Select Selling Unit</option>
                                                {(masters.units || []).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                Minimum Order Qty (MOQ)
                                            </label>
                                            <input
                                                type="number"
                                                value={form.minimumOrderQuantity}
                                                onChange={f('minimumOrderQuantity')}
                                                placeholder="100"
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            Manufacturing Lead Time (Days)
                                        </label>
                                        <input
                                            type="number"
                                            value={form.leadTimeDays}
                                            onChange={f('leadTimeDays')}
                                            placeholder="4"
                                            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Images */}
                            {activeTab === 'images' && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <label className="px-4 py-2.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 cursor-pointer transition-colors flex items-center justify-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            Upload Image Files
                                            <input type="file" accept="image/*" multiple onChange={handleImageFileUpload} className="hidden" />
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Or enter Image URL (http://...)"
                                            value={urlImageInput}
                                            onChange={e => setUrlImageInput(e.target.value)}
                                            className="flex-1 px-4 py-2 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={addImageUrl}
                                            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                                        >
                                            Add URL
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                        {form.images.map((img, index) => (
                                            <div key={index} className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-28 group bg-gray-100 dark:bg-gray-900">
                                                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1.5 right-1.5 p-1 bg-rose-500 text-white rounded-full opacity-80 hover:opacity-100"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPrimaryImage(index)}
                                                    className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                                        img.isPrimary
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-black/60 text-white hover:bg-black/80'
                                                    }`}
                                                >
                                                    {img.isPrimary ? 'Primary' : 'Set Primary'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Variants */}
                            {activeTab === 'variants' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">Product Variants (Sizes / Colors / SKUs)</h4>
                                        <button
                                            type="button"
                                            onClick={addVariant}
                                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Variant
                                        </button>
                                    </div>

                                    {form.variants.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No variants added yet. Click above to add sizes, colors, or specific SKUs.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {form.variants.map((variant, index) => (
                                                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="SKU (e.g. POP-WHT-01)"
                                                        value={variant.sku}
                                                        onChange={e => updateVariantField(index, 'sku', e.target.value)}
                                                        className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg outline-none"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Variant Price"
                                                        value={variant.price}
                                                        onChange={e => updateVariantField(index, 'price', e.target.value)}
                                                        className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg outline-none"
                                                    />
                                                    <select
                                                        value={variant.status}
                                                        onChange={e => updateVariantField(index, 'status', e.target.value)}
                                                        className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg outline-none"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariant(index)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sticky Modal Actions Footer */}
                            <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : editing ? 'Update Fabric Product' : 'Save Fabric Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export function SupplierProductsPage() {
    return (
        <SupplierGateway>
            {() => (
                <AppShell>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <ProductsInner />
                    </div>
                </AppShell>
            )}
        </SupplierGateway>
    );
}