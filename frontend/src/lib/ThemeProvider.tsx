'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // On mount: only apply dark if the user has EXPLICITLY saved 'dark' before.
  // Never read system preference — default is always light.
  useEffect(() => {
    const saved = localStorage.getItem('lp_theme');
    if (saved === 'dark') {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    // If nothing saved (first visit) or saved === 'light', do nothing —
    // the HTML element has no data-theme so CSS variables keep their light defaults.
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';

      // Suppress transition flash during the swap
      document.documentElement.classList.add('no-transition');

      if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      localStorage.setItem('lp_theme', next);

      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transition');
      });

      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
