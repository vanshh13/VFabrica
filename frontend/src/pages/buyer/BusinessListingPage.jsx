import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { useAuthStore } from '../../store/useAuthStore';
import { getProducts, getProductDetails } from '../../services/productService';
import {
    ShieldCheck,
    MapPin,
    Mail,
    Phone,
    Calendar,
    Send,
    Globe,
    Package,
    ChevronRight,
    ArrowRight,
    Building2,
    ExternalLink
} from 'lucide-react';

export function BusinessListingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [message, setMessage] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('products');
    const [subject, setSubject] = React.useState('');
    const [body, setBody] = React.useState('');
    const [supplierDetails, setSupplierDetails] = React.useState(null);
    const [targetSupplierId, setTargetSupplierId] = React.useState(null); // <-- Add this state

    React.useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                let matchedProduct = null;
                if (id) {
                    try {
                        const prodRes = await getProductDetails(id);
                        if (prodRes && (prodRes.data || prodRes.id)) {
                            matchedProduct = prodRes.data || prodRes;
                        }
                    } catch (e) {
                        // ignore if id is not a direct product ID
                    }
                }

                const prods = await getProducts(id ? { supplierId: id } : {});
                const rawItems = Array.isArray(prods) ? prods : (prods?.data || prods?.items || []);
                let allProds = rawItems;

                if (allProds.length === 0 && id) {
                    const fallbackProds = await getProducts();
                    allProds = Array.isArray(fallbackProds) ? fallbackProds : (fallbackProds?.data || fallbackProds?.items || []);
                }

                let filtered = allProds;
                const supplierId = matchedProduct?.supplier_id || matchedProduct?.supplier_profile_id || id;

                // Store in state for use in JSX
                setTargetSupplierId(supplierId || null);

                if (supplierId) {
                    const matchedProds = allProds.filter(p =>
                        String(p.supplier_id) === String(supplierId) ||
                        String(p.supplier_profile_id) === String(supplierId) ||
                        String(p.supplierId) === String(supplierId) ||
                        String(p.id) === String(supplierId)
                    );
                    if (matchedProds.length > 0) {
                        filtered = matchedProds;
                    }
                }

                const matched = matchedProduct || filtered[0] || allProds[0];
                if (matched) {
                    setSupplierDetails({
                        name: matched.supplier_name || matched.company_name || 'VF Textiles',
                        website: matched.supplier_website || matched.website || 'https://vfabrica.dev',
                        location: matched.location || null,
                        description: matched.supplier_description || matched.description || 'High-quality woven and knitted fabrics for wholesale buyers.',
                        moq: matched.minimum_order_quantity ? `${matched.minimum_order_quantity} ${matched.unit_name || 'Meters'}` : '100 Meters',
                        approvalStatus: matched.approval_status || 'APPROVED',
                        email: matched.email || null,
                        phone: matched.phone || null
                    });
                }
                setProducts(filtered.slice(0, 8));
            } catch (err) {
                console.error('Failed to load supplier catalog:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    const handleContact = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/auth/login?message=Please log in to contact this business.');
            return;
        }
        if (!subject || !body) {
            setMessage('Please fill in both the subject and message content.');
            return;
        }
        setMessage('Message sent successfully! The supplier representative will contact you via email.');
        setSubject('');
        setBody('');
        setTimeout(() => setMessage(''), 5000);
    };

    const business = {
        name: supplierDetails?.name || (loading ? 'Loading Supplier...' : 'VF Textiles'),
        logo: '🏭',
        type: 'Wholesale Fabric Mill & Supplier',
        location: supplierDetails?.location || null,
        website: supplierDetails?.website || 'https://vfabrica.dev',
        description: supplierDetails?.description || 'High-quality woven and knitted fabrics for wholesale buyers.',
        minimumOrder: supplierDetails?.moq || '100 Meters',
        approvalStatus: supplierDetails?.approvalStatus || 'APPROVED',
        verified: true
    };

    return (
        <AppShell>
            <div className="min-h-screen theme-bg-page">
                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
                            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-4xl sm:text-5xl shadow-2xl border border-white/20 flex-shrink-0">
                                    {business.logo}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                        <h1 className="text-2xl sm:text-3xl font-bold">{business.name}</h1>
                                        {business.verified && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs sm:text-sm font-medium border border-emerald-400/30">
                                                <ShieldCheck className="w-4 h-4" />
                                                Verified Supplier
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-indigo-200 mb-3">
                                        {business.location && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4" />
                                                {business.location}
                                            </span>
                                        )}
                                        <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-indigo-400" />
                                        <span>{business.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-indigo-300" />
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-300">Minimum Order Quantity</p>
                                    <p className="font-semibold">{business.minimumOrder}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-300">Approval Status</p>
                                    <p className="font-semibold text-emerald-300">{business.approvalStatus}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="theme-card rounded-2xl p-6">
                                <div className="border-b theme-border-color pb-4 mb-6">
                                    <nav className="flex gap-2 -mb-px">
                                        {[
                                            { id: 'products', label: 'Products', icon: Package },
                                            { id: 'about', label: 'About Company', icon: Building2 }
                                        ].map((tab) => {
                                            const TabIcon = tab.icon;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-xl border transition-colors ${activeTab === tab.id
                                                        ? 'theme-tag font-bold'
                                                        : 'border-transparent theme-text-subtle hover:theme-text-main'
                                                        }`}
                                                >
                                                    <TabIcon className="w-4 h-4" />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>

                                <div className="p-6">
                                    {activeTab === 'products' && (
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Product Catalog ({products.length})
                                                </h3>
                                                {targetSupplierId && (
                                                    <Link
                                                        to={`/buyer?supplierId=${targetSupplierId}`}
                                                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                                    >
                                                        View Marketplace Catalog
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </div>

                                            {loading ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {[...Array(4)].map((_, i) => (
                                                        <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-xl h-48" />
                                                    ))}
                                                </div>
                                            ) : products.length === 0 ? (
                                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">No products listed by this supplier yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {products.map(product => (
                                                        <Link
                                                            key={product.id}
                                                            to={`/buyer/product/${product.id}`}
                                                            className="group block p-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all"
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                                    {product.category_name || product.category?.name || 'Fabric'}
                                                                </span>
                                                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                                    ₹{product.base_price || product.price}/m
                                                                </span>
                                                            </div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                {product.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                                                {product.description || 'Premium quality fabric for commercial applications'}
                                                            </p>
                                                            <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                                                View Details
                                                                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'about' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                    Company Profile
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {business.description}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Website</p>
                                                    <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer"
                                                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                                        {business.website}
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Minimum Order Quantity</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{business.minimumOrder}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Contact Information
                                </h3>
                                <div className="space-y-4">
                                    {business.location && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Address</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{business.location}</p>
                                        </div>
                                    </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                                            <a href={`mailto:${supplierDetails?.email || 'inquiries@vfabrica.dev'}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                                {supplierDetails?.email || 'inquiries@vfabrica.dev'}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Phone</p>
                                            <a href={`tel:${supplierDetails?.phone || '+919876543210'}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                                {supplierDetails?.phone || '+91 (261) 489-3200'}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Globe className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Website</p>
                                            <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer"
                                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                                {business.website}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}