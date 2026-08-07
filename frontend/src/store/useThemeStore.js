import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME } from '../theme/themes';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme })
    }),
    { name: 'vfabrica-theme' }
  )
);