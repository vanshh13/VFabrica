import { THEMES } from '../../theme/themes';
import { useThemeStore } from '../../store/useThemeStore';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <select
      className="select-theme-premium"
      value={theme}
      onChange={(event) => setTheme(event.target.value)}
      aria-label="Theme selector"
    >
      {THEMES.map((entry) => (
        <option key={entry.value} value={entry.value}>
          {entry.label}
        </option>
      ))}
    </select>
  );
}