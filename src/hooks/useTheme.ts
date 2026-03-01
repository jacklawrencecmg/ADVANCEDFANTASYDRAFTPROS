import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('fdp_theme') as Theme | null) ?? 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fdp_theme', theme);
  }, [theme]);

  const toggle = () => setThemeState(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
