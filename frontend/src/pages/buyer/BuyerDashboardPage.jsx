import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { useCartStore } from '../../store/useCartStore';
import { getBuyerAddresses, addBuyerAddress } from '../../services/buyerService';
import { BuyerCatalogModule } from '../../components/buyer/BuyerCatalogModule';
import { BuyerCartModule } from '../../components/buyer/BuyerCartModule';
import { BuyerOrdersModule } from '../../components/buyer/BuyerOrdersModule';
import { BuyerProfileModule } from '../../components/buyer/BuyerProfileModule';
import {
    ShoppingBag,
    ShoppingCart,
    Package,
    User,
    X,
    CheckCircle2
} from 'lucide-react';

export function BuyerDashboardPage({ initialTab = 'catalog' }) {
    const navigate = useNavigate();
    const { items } = useCartStore();
    const [searchParams] = useSearchParams();

    // Tab Management
    const [activeTab, setActiveTab] = React.useState(searchParams.get('tab') || initialTab);
    const [message, setMessage] = React.useState('');

    // Shared Addresses state
    const [buyerAddresses, setBuyerAddresses] = React.useState([]);
    const [selectedShippingAddressId, setSelectedShippingAddressId] = React.useState('');
    const [showAddAddressModal, setShowAddAddressModal] = React.useState(false);
    const [addressSaving, setAddressSaving] = React.useState(false);

    const [newAddressForm, setNewAddressForm] = React.useState({
        addressLine1: '',
        landmark: '',
        zipcode: '',
        cityId: '',
        addressType: 'Shipping',
        isPrimary: false
    });

    const totalItems = items.reduce((s, i) => s + i.quantity, 0);

    // Sync tab with URL search parameter
    React.useEffect(() => {
        const tab = searchParams.get('tab') || initialTab;
        setActiveTab(tab);
    }, [initialTab, searchParams]);

    // Fetch buyer addresses only when required by Cart or Profile modules
    const loadAddresses = React.useCallback(async () => {
        try {
            const res = await getBuyerAddresses();
            if (res.data) {
                setBuyerAddresses(res.data);
                const primary = res.data.find(a => a.is_primary) || res.data[0];
                if (primary) setSelectedShippingAddressId(primary.id);
            }
        } catch (e) {
            // silent catch
        }
    }, []);

    React.useEffect(() => {
        if (['cart', 'profile'].includes(activeTab)) {
            loadAddresses();
        }
    }, [activeTab, loadAddresses]);

    const handleAddAddressSubmit = async (e) => {
        e.preventDefault();
        setAddressSaving(true);
        try {
            const res = await addBuyerAddress(newAddressForm);
            if (res.data) {
                setBuyerAddresses(res.data);
                const newlyAdded = res.data[res.data.length - 1];
                if (newlyAdded) setSelectedShippingAddressId(newlyAdded.id);
            }
            setShowAddAddressModal(false);
            setNewAddressForm({
                addressLine1: '',
                landmark: '',
                zipcode: '',
                cityId: '',
                addressType: 'Shipping',
                isPrimary: false
            });
            setMessage('New shipping address saved.');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err?.response?.data?.message || err?.message || 'Failed to add address');
        } finally {
            setAddressSaving(false);
        }
    };



    return (
        <AppShell>
            <div className="min-h-screen theme-bg-page py-8">
                {/* Toast Notification */}
                {message && (
                    <div className="fixed top-20 right-4 z-50 animate-slide-in">
                        <div className="theme-card rounded-xl shadow-lg p-4 flex items-center gap-3 border theme-border-color">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="text-sm theme-text-main">{message}</p>
                            <button onClick={() => setMessage('')} className="ml-4 theme-text-subtle hover:theme-text-main">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


                    {/* Active Tab View */}
                    {activeTab === 'catalog' && (
                        <BuyerCatalogModule setMessage={setMessage} />
                    )}

                    {activeTab === 'cart' && (
                        <BuyerCartModule
                            buyerAddresses={buyerAddresses}
                            selectedShippingAddressId={selectedShippingAddressId}
                            setSelectedShippingAddressId={setSelectedShippingAddressId}
                            onOpenAddAddressModal={() => setShowAddAddressModal(true)}
                            onNavigateToOrders={() => {
                                setActiveTab('orders');
                                navigate('/buyer?tab=orders');
                            }}
                            onNavigateToCatalog={() => {
                                setActiveTab('catalog');
                                navigate('/buyer?tab=catalog');
                            }}
                            setMessage={setMessage}
                        />
                    )}

                    {activeTab === 'orders' && (
                        <BuyerOrdersModule
                            onNavigateToCatalog={() => {
                                setActiveTab('catalog');
                                navigate('/buyer?tab=catalog');
                            }}
                            onNavigateToCart={() => {
                                setActiveTab('cart');
                                navigate('/buyer?tab=cart');
                            }}
                            setMessage={setMessage}
                        />
                    )}

                    {activeTab === 'profile' && (
                        <BuyerProfileModule
                            buyerAddresses={buyerAddresses}
                            setBuyerAddresses={setBuyerAddresses}
                            onOpenAddAddressModal={() => setShowAddAddressModal(true)}
                            setMessage={setMessage}
                        />
                    )}
                </div>

                {/* Add Address Modal */}
                {showAddAddressModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="theme-card rounded-2xl shadow-xl max-w-md w-full p-6 border theme-border-color">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b theme-border-color">
                                <h3 className="text-lg font-bold theme-text-main">Add New Address</h3>
                                <button onClick={() => setShowAddAddressModal(false)} className="p-1.5 hover:bg-[var(--bg)] rounded-lg">
                                    <X className="w-5 h-5 theme-text-subtle" />
                                </button>
                            </div>

                            <form onSubmit={handleAddAddressSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium theme-text-subtle mb-1">Address Type</label>
                                    <select
                                        value={newAddressForm.addressType}
                                        onChange={e => setNewAddressForm({ ...newAddressForm, addressType: e.target.value })}
                                        className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                    >
                                        <option value="Shipping">Shipping</option>
                                        <option value="Billing">Billing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium theme-text-subtle mb-1">Address Line 1 *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAddressForm.addressLine1}
                                        onChange={e => setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })}
                                        className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium theme-text-subtle mb-1">Landmark</label>
                                    <input
                                        type="text"
                                        value={newAddressForm.landmark}
                                        onChange={e => setNewAddressForm({ ...newAddressForm, landmark: e.target.value })}
                                        className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium theme-text-subtle mb-1">Zipcode *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAddressForm.zipcode}
                                        onChange={e => setNewAddressForm({ ...newAddressForm, zipcode: e.target.value })}
                                        className="w-full px-4 py-2 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer theme-text-subtle pt-1">
                                    <input
                                        type="checkbox"
                                        checked={newAddressForm.isPrimary}
                                        onChange={e => setNewAddressForm({ ...newAddressForm, isPrimary: e.target.checked })}
                                        className="accent-[var(--primary)]"
                                    />
                                    Set as primary shipping address
                                </label>
                                <div className="flex gap-3 pt-2">
                                    <Button type="submit" disabled={addressSaving} className="flex-1">
                                        {addressSaving ? 'Saving Address...' : 'Save Address'}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setShowAddAddressModal(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}