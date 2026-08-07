import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import {
    getBuyerProfile,
    onboardBuyer,
    updateBuyerProfile,
    deleteBuyerAddress
} from '../../services/buyerService';
import {
    User,
    LogOut,
    MapPin,
    Plus,
    Trash2,
    CheckCircle2,
    Building2,
    Settings
} from 'lucide-react';

const parsePreferences = (value = '') => String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const serializePreferences = (value) => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return Object.values(value).filter(Boolean).join(', ');
    return '';
};

export function BuyerProfileModule({
    buyerAddresses = [],
    setBuyerAddresses,
    onOpenAddAddressModal,
    setMessage
}) {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();

    const [buyerProfile, setBuyerProfile] = React.useState(null);
    const [profileLoading, setProfileLoading] = React.useState(false);
    const [profileSaving, setProfileSaving] = React.useState(false);
    const [profileMessage, setProfileMessage] = React.useState('');

    const [profileForm, setProfileForm] = React.useState({
        companyName: '',
        buyerType: 'Individual',
        businessType: '',
        industry: '',
        preferences: '',
        addressLine1: '',
        landmark: '',
        zipcode: '',
        cityId: ''
    });

    const applyBuyerProfile = React.useCallback((payload) => {
        const profile = payload?.data?.profile || payload?.profile || payload?.data || null;
        const addresses = payload?.data?.addresses || payload?.addresses || [];
        const primaryAddress = addresses.find((address) => address.is_primary) || addresses[0] || null;

        setBuyerProfile(profile);
        if (setBuyerAddresses) setBuyerAddresses(addresses);

        setProfileForm({
            companyName: profile?.company_name || '',
            buyerType: profile?.buyer_type || 'Individual',
            businessType: profile?.business_type || '',
            industry: profile?.industry || '',
            preferences: serializePreferences(profile?.preferences),
            addressLine1: primaryAddress?.address_line_1 || '',
            landmark: primaryAddress?.landmark || '',
            zipcode: primaryAddress?.zipcode || '',
            cityId: primaryAddress?.city_id || ''
        });
    }, [setBuyerAddresses]);

    const loadProfile = React.useCallback(async () => {
        if (!isAuthenticated) return;
        setProfileLoading(true);
        try {
            const res = await getBuyerProfile();
            applyBuyerProfile(res);
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setProfileLoading(false);
        }
    }, [isAuthenticated, applyBuyerProfile]);

    React.useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleProfileField = (field) => (event) => {
        setProfileForm((current) => ({ ...current, [field]: event.target.value }));
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        setProfileSaving(true);
        setProfileMessage('');
        try {
            const payload = {
                companyName: profileForm.companyName,
                buyerType: profileForm.buyerType,
                businessType: profileForm.businessType,
                industry: profileForm.industry,
                preferences: parsePreferences(profileForm.preferences)
            };

            if (buyerProfile) {
                await updateBuyerProfile(payload);
                setProfileMessage('Buyer profile updated successfully.');
            } else {
                if (!profileForm.companyName.trim()) {
                    throw new Error('Company name is required to complete onboarding.');
                }
                await onboardBuyer({
                    ...payload,
                    addressLine1: profileForm.addressLine1,
                    landmark: profileForm.landmark,
                    zipcode: profileForm.zipcode,
                    cityId: profileForm.cityId
                });
                setProfileMessage('Buyer onboarding completed successfully.');
            }
            await loadProfile();
        } catch (err) {
            setProfileMessage(err?.response?.data?.error || err?.message || 'Failed to save buyer profile');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Delete this address?')) return;
        try {
            const res = await deleteBuyerAddress(addressId);
            if (res.data && setBuyerAddresses) setBuyerAddresses(res.data);
            if (setMessage) setMessage('Address deleted.');
        } catch (err) {
            if (setMessage) setMessage(err?.response?.data?.message || 'Failed to delete address');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold theme-text-main">Profile & Account Settings</h2>

            {profileMessage && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm font-medium">
                    {profileMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Column */}
                <div className="lg:col-span-2 theme-card rounded-2xl p-6 border theme-border-color shadow-sm">
                    <h3 className="text-lg font-semibold theme-text-main mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[var(--primary)]" />
                        {buyerProfile ? 'Update Business Profile' : 'Complete Buyer Onboarding'}
                    </h3>

                    {profileLoading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : (
                        <form onSubmit={handleProfileSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium theme-text-subtle mb-1">Company Name *</label>
                                    <input
                                        type="text"
                                        value={profileForm.companyName}
                                        onChange={handleProfileField('companyName')}
                                        className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium theme-text-subtle mb-1">Buyer Type</label>
                                    <select
                                        value={profileForm.buyerType}
                                        onChange={handleProfileField('buyerType')}
                                        className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                    >
                                        <option value="Individual">Individual</option>
                                        <option value="Business">Business</option>
                                        <option value="Organization">Organization</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium theme-text-subtle mb-1">Business Type</label>
                                    <input
                                        type="text"
                                        value={profileForm.businessType}
                                        onChange={handleProfileField('businessType')}
                                        className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                        placeholder="Retail, Manufacturer, Garment Unit..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium theme-text-subtle mb-1">Industry</label>
                                    <input
                                        type="text"
                                        value={profileForm.industry}
                                        onChange={handleProfileField('industry')}
                                        className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                        placeholder="Apparel, Home Textiles, Fashion..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium theme-text-subtle mb-1">Fabric Preferences</label>
                                <textarea
                                    value={profileForm.preferences}
                                    onChange={handleProfileField('preferences')}
                                    rows={3}
                                    className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                    placeholder="Preferred fibers (e.g., Organic Cotton, Linen), GOTS certified, etc."
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={profileSaving}>
                                    {profileSaving ? 'Saving Profile...' : buyerProfile ? 'Update Profile' : 'Complete Onboarding'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Address Management Section */}
                    <div className="mt-8 pt-6 border-t theme-border-color">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-sm theme-text-main flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[var(--primary)]" />
                                Saved Addresses ({buyerAddresses.length})
                            </h4>
                            {onOpenAddAddressModal && (
                                <Button variant="secondary" onClick={onOpenAddAddressModal} className="text-xs flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Address
                                </Button>
                            )}
                        </div>

                        {buyerAddresses.length === 0 ? (
                            <p className="text-xs theme-text-subtle">No addresses saved yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {buyerAddresses.map(addr => (
                                    <div key={addr.id} className="p-3 bg-[var(--bg)] border theme-border-color rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold theme-text-main">
                                                {addr.address_type || 'Shipping'} {addr.is_primary && <span className="text-[var(--primary)]">(Primary)</span>}
                                            </p>
                                            <p className="text-xs theme-text-subtle mt-0.5">
                                                {addr.address_line_1}{addr.landmark ? `, Near ${addr.landmark}` : ''}{addr.zipcode ? ` (${addr.zipcode})` : ''}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAddress(addr.id)}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                            title="Delete Address"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Details Sidebar */}
                <div className="space-y-6">
                    <div className="theme-card rounded-2xl p-6 border theme-border-color shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl">
                                {(user?.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold theme-text-main">{user?.email}</p>
                                <p className="text-xs theme-text-subtle">Registered Buyer Account</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 text-xs theme-text-subtle border-t theme-border-color">
                            <div className="flex justify-between py-1">
                                <span>Account Role</span>
                                <span className="font-medium theme-text-main capitalize">{user?.role || 'buyer'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span>Status</span>
                                <span className="font-medium text-emerald-600">Active</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={() => { logout(); navigate('/'); }}
                        className="w-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out of Account
                    </Button>
                </div>
            </div>
        </div>
    );
}
