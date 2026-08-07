import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { SupplierGateway } from './SupplierGateway';
import { useAuthStore } from '../../store/useAuthStore';
import { getSupplierProfile, updateSupplierProfile } from '../../services/supplierService';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Globe,
    Mail,
    Phone,
    MapPin,
    Edit3,
    Save,
    X,
    CheckCircle2,
    AlertCircle,
    Clock,
    Award,
    Star,
    Shield,
    LogOut,
    Package,
    Warehouse,
    ChevronRight,
    Calendar,
    Hash,
    Ruler,
    FileText,
    User,
    Settings
} from 'lucide-react';

function ProfileInner({ initialProfile, fullData }) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const profileObj = fullData?.profile || initialProfile;
    const addresses = fullData?.addresses || [];
    const warehouses = fullData?.warehouses || [];

    const [profile, setProfile] = React.useState(profileObj);
    const [editing, setEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [msg, setMsg] = React.useState({ text: '', ok: true });
    const [form, setForm] = React.useState({
        companyName: profileObj?.company_name || '',
        companyDescription: profileObj?.company_description || '',
        website: profileObj?.website || '',
        minimumOrderQuantity: profileObj?.minimum_order_quantity || ''
    });

    const showMsg = (text, ok = true) => {
        setMsg({ text, ok });
        setTimeout(() => setMsg({ text: '', ok: true }), 3000);
    };

    const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await updateSupplierProfile({
                companyName: form.companyName,
                companyDescription: form.companyDescription,
                website: form.website,
                minimumOrderQuantity: parseInt(form.minimumOrderQuantity) || 1
            });
            const updated = res.data?.profile || res.data || profile;
            setProfile(updated);
            setEditing(false);
            showMsg('Profile updated successfully!');
        } catch (e) {
            showMsg(e?.response?.data?.error || 'Update failed', false);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getStatusColor = (status) => {
        const colors = {
            approved: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
            pending: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
            rejected: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        };
        return colors[status] || colors.pending;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {(user?.email || 'S').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Account Settings
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Manage your supplier profile and business information
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(profile?.approval_status)}`}>
                            <div className={`w-2 h-2 rounded-full ${profile?.approval_status === 'approved' ? 'bg-emerald-500 animate-pulse' :
                                profile?.approval_status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                            {profile?.approval_status === 'approved' ? 'Verified Supplier' :
                                profile?.approval_status === 'pending' ? 'Pending Approval' : profile?.approval_status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {msg.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${msg.ok
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    }`}>
                    {msg.ok ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-sm">{msg.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Business Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Business Information</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Company details and preferences</p>
                                </div>
                            </div>
                            {!editing && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-4 py-2 text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            {!editing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Company Name</p>
                                            </div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{profile?.company_name || '—'}</p>
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Ruler className="w-4 h-4 text-gray-400" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Min. Order Quantity</p>
                                            </div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {profile?.minimum_order_quantity ? `${profile.minimum_order_quantity} meters` : '—'}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Globe className="w-4 h-4 text-gray-400" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                                            </div>
                                            {profile?.website ? (
                                                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                                                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    {profile.website}
                                                </a>
                                            ) : (
                                                <p className="font-semibold text-gray-900 dark:text-white">—</p>
                                            )}
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                                            </div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {profile?.company_description && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {profile.company_description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleSave} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.companyName}
                                            onChange={f('companyName')}
                                            required
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Description
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={form.companyDescription}
                                            onChange={f('companyDescription')}
                                            placeholder="Describe your business, specialties, and capabilities..."
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Website
                                            </label>
                                            <div className="relative">
                                                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="url"
                                                    value={form.website}
                                                    onChange={f('website')}
                                                    placeholder="https://..."
                                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Min. Order Qty (m)
                                            </label>
                                            <input
                                                type="number"
                                                value={form.minimumOrderQuantity}
                                                onChange={f('minimumOrderQuantity')}
                                                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditing(false)}
                                            className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Addresses Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Business Addresses</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{addresses.length} registered addresses</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {addresses.length === 0 ? (
                                <div className="text-center py-8">
                                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No business addresses listed.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {addresses.map((addr, idx) => (
                                        <div key={addr.id || idx} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {addr.address_line_1 || addr.address}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {[addr.landmark, addr.city, addr.state, addr.zipcode, addr.country].filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warehouses Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <Warehouse className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fulfillment Warehouses</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{warehouses.length} warehouses</p>
                                </div>
                            </div>
                            <a href="/supplier/warehouse" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                Manage
                                <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="p-6">
                            {warehouses.length === 0 ? (
                                <div className="text-center py-8">
                                    <Warehouse className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">No warehouses registered.</p>
                                    <a
                                        href="/supplier/warehouse"
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                    >
                                        Add Warehouse
                                    </a>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {warehouses.map((wh, idx) => (
                                        <div key={wh.id || idx} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-start gap-3">
                                                <Warehouse className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {wh.name || `Warehouse #${idx + 1}`}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {[wh.address, wh.city, wh.state].filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Account Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                {(user?.email || 'S').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{user?.email}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Supplier Account</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Account Status</span>
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                    {profile?.status || 'active'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Approval Status</span>
                                <span className={`text-sm font-semibold ${profile?.approval_status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                                    }`}>
                                    {profile?.approval_status || 'pending'}
                                </span>
                            </div>
                            {profile?.approved_at && (
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-500">Approved On</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {new Date(profile.approved_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            <a href="/supplier/dashboard" className="flex items-center gap-3 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                <Building2 className="w-4 h-4" />
                                Dashboard
                            </a>
                            <a href="/supplier/products" className="flex items-center gap-3 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                <Package className="w-4 h-4" />
                                Products
                            </a>
                            <a href="/supplier/orders" className="flex items-center gap-3 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                <Package className="w-4 h-4" />
                                Orders
                            </a>
                            <a href="/supplier/inventory" className="flex items-center gap-3 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                <Warehouse className="w-4 h-4" />
                                Inventory
                            </a>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SupplierProfilePage() {
    return (
        <SupplierGateway>
            {(profile, fullData) => (
                <AppShell>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <ProfileInner initialProfile={profile} fullData={fullData} />
                    </div>
                </AppShell>
            )}
        </SupplierGateway>
    );
}