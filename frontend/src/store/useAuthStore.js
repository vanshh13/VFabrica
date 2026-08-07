import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const normalizeUser = (payload) => {
  const user = payload?.user || payload?.data?.user || payload?.data || null;
  if (user) {
    const roles = payload?.roles || payload?.data?.roles || [];
    user.role = roles[0] || 'BUYER';
  }
  return user;
};
const normalizeTokens = (payload) => {
  const root = payload?.tokens || payload?.data?.tokens || payload?.data || payload;
  return root && (root.accessToken || root.refreshToken) ? root : null;
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      hydrateAuth: (payload) =>
        set({
          user: normalizeUser(payload),
          tokens: normalizeTokens(payload),
          isAuthenticated: Boolean(normalizeUser(payload))
        }),
      setTokens: (tokens) => set({ tokens }),
      logout: () => {
        try { localStorage.removeItem('vf_supplier_profile'); } catch {}
        set({ user: null, tokens: null, isAuthenticated: false });
      }
    }),
    { name: 'vfabrica-auth' }
  )
);