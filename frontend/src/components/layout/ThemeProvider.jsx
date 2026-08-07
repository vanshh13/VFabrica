import { useEffect } from 'react';
import { useThemeStore } from '../../store/useThemeStore';

export function ThemeProvider({ children }) {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'midnight') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return children;
}