import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { updateUserTheme } from '../utils/api';
import { auth } from '../firebase';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'thieponl_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.warn('Could not read theme from localStorage', e);
  }
  return 'system';
}

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  userTheme?: ThemeMode;
}> = ({ children, userTheme }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const init = getInitialTheme();
    return init === 'system' ? resolveSystemTheme() : init;
  });

  // Apply dark class to documentElement
  const applyThemeToDOM = useCallback((activeTheme: ThemeMode) => {
    if (typeof document === 'undefined') return;
    try {
      const isDark =
        activeTheme === 'dark' ||
        (activeTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        document.documentElement.classList.remove('dark');
        setResolvedTheme('light');
      }
    } catch (e) {
      console.warn('Failed to apply theme to DOM:', e);
    }
  }, []);

  // Update theme function
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {
        console.warn('Could not save theme to localStorage:', e);
      }
      applyThemeToDOM(newTheme);

      // Persist to Firestore if user is authenticated
      if (auth.currentUser) {
        updateUserTheme(newTheme).catch((err) => {
          console.warn('Could not sync theme with Firestore:', err);
        });
      }
    },
    [applyThemeToDOM]
  );

  // Toggle quick switch (light -> dark -> system)
  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  // Sync if userTheme from Firestore changes on login
  useEffect(() => {
    if (userTheme && (userTheme === 'light' || userTheme === 'dark' || userTheme === 'system')) {
      const currentStored = getInitialTheme();
      // If no explicit local override or matching
      if (currentStored !== userTheme) {
        setThemeState(userTheme);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, userTheme);
        } catch {}
        applyThemeToDOM(userTheme);
      }
    }
  }, [userTheme, applyThemeToDOM]);

  // Listen for system theme change when theme is 'system'
  useEffect(() => {
    applyThemeToDOM(theme);

    if (theme !== 'system' || typeof window === 'undefined') return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyThemeToDOM('system');
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleChange);
        return () => (mediaQuery as any).removeListener(handleChange);
      }
    } catch (e) {
      console.warn('matchMedia listener error:', e);
    }
  }, [theme, applyThemeToDOM]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
