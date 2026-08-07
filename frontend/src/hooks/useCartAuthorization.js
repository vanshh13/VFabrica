import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

export function useCartAuthorization() {
    const { isAuthenticated, user } = useAuthStore();
    const addItem = useCartStore((state) => state.addItem);
    const navigate = useNavigate();

    const role = (user?.role || '').toUpperCase();
    const isBuyer = isAuthenticated && role === 'BUYER';
    const isSupplier = isAuthenticated && role === 'SUPPLIER';

    /**
     * Executes cart addition with authorization enforcement.
     * @param {Object} product - Product to add
     * @param {number|null} quantity - Quantity to add
     * @param {Object} options - Options e.g. { showToast: fn, directCheckout: bool }
     * @returns {Object} { allowed: boolean, message: string }
     */
    const handleAddToCart = (product, quantity = null, options = {}) => {
        const { showToast, directCheckout } = options;

        // 1. Unauthenticated users: redirect to login with message
        if (!isAuthenticated) {
            const msg = 'Please sign in as a Buyer to continue.';
            if (showToast) showToast(`🔒 ${msg}`);
            navigate(`/auth/login?message=${encodeURIComponent(msg)}`);
            return { allowed: false, message: msg };
        }

        // 2. Supplier accounts: block purchase
        if (role === 'SUPPLIER' || (role !== 'BUYER' && role !== 'ADMIN')) {
            const msg = 'Only buyers can purchase products.';
            if (showToast) showToast(`⚠️ ${msg}`);
            return { allowed: false, message: msg };
        }

        // 3. Authenticated Buyer: Add to cart store
        const result = addItem(product, quantity);
        if (result && result.success === false) {
            if (showToast) showToast(`⚠️ ${result.message}`);
            return { allowed: false, message: result.message };
        }

        if (directCheckout) {
            navigate('/buyer?tab=cart');
        }

        return { allowed: true, message: 'Added to cart successfully' };
    };

    return {
        isAuthenticated,
        isBuyer,
        isSupplier,
        role,
        handleAddToCart
    };
}
