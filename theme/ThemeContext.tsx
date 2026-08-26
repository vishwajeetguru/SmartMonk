import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, Palette } from '../constants/colors';

type Mode = 'light' | 'dark';

const STORAGE_KEY = '@smartmonk_theme_mode';

interface ThemeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggle: () => void;
  colors: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light') setModeState(saved);
      })
      .catch(() => {});
  }, []);

  const setMode = (next: Mode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggle: () => setMode(mode === 'light' ? 'dark' : 'light'),
      colors: mode === 'dark' ? darkColors : lightColors,
      isDark: mode === 'dark',
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
