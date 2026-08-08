import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getFavorites, addFavorite, removeFavorite } from '../services/buyerService';
import { useAuthStore } from './useAuthStore';

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [], // list of favorited product objects
      favoriteIds: new Set(),
      loading: false,

      // Initialize / Sync from server
      fetchFavorites: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          set({ favorites: [], favoriteIds: new Set(), loading: false });
          return;
        }
        set({ loading: true });
        try {
          const res = await getFavorites();
          const items = Array.isArray(res) ? res : (res?.data || []);
          const ids = new Set(items.map(p => p.id || p.product_id));
          set({ favorites: items, favoriteIds: ids, loading: false });
        } catch (err) {
          console.error('Failed to fetch favorites:', err);
          set({ loading: false });
        }
      },

      isFavorite: (productId) => {
        if (!productId) return false;
        const { favoriteIds, favorites } = get();
        if (favoriteIds && favoriteIds.has) {
          return favoriteIds.has(productId);
        }
        return favorites.some(p => (p.id || p.product_id) === productId);
      },

      toggleFavorite: async (product) => {
        if (!product || (!product.id && !product.product_id)) {
          return { success: false, message: 'Invalid product' };
        }
        const productId = product.id || product.product_id;
        const { favorites, favoriteIds, isFavorite } = get();
        const currentlyFavorite = isFavorite(productId);

        const previousFavorites = [...favorites];
        const previousFavoriteIds = new Set(favoriteIds);

        // Optimistic Update
        let updatedFavorites;
        if (currentlyFavorite) {
          updatedFavorites = favorites.filter(p => (p.id || p.product_id) !== productId);
        } else {
          updatedFavorites = [product, ...favorites];
        }

        const newIds = new Set(updatedFavorites.map(p => p.id || p.product_id));
        set({ favorites: updatedFavorites, favoriteIds: newIds });

        // API Sync
        try {
          if (currentlyFavorite) {
            await removeFavorite(productId);
          } else {
            await addFavorite(productId);
          }
          return { success: true, isFavorite: !currentlyFavorite };
        } catch (err) {
          // Revert optimistic update if API call failed (401, 403, 500, etc.)
          set({ favorites: previousFavorites, favoriteIds: previousFavoriteIds });
          const status = err.response?.status || err.status;
          const msg = err.response?.data?.message || (status === 401 ? 'Please sign in to save favorites.' : 'Failed to update favorites');
          return { success: false, status, message: msg };
        }
      }
    }),
    {
      name: 'vfabrica_favorites_storage',
      partialize: (state) => ({ favorites: state.favorites })
    }
  )
);
