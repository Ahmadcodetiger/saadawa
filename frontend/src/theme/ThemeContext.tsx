/**
 * src/theme/ThemeContext.tsx
 * 
 * Theme management and persistence.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, Theme, ThemeColors } from './index';

const THEME_KEY = 'app_theme_preference';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: 'light' | 'dark';
  preference: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  theme: Theme;
  colors: ThemeColors;
  // Legacy compatibility
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadPreference = async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) setPreference(saved as ThemeMode);
    };
    loadPreference();
  }, []);

  const mode = preference === 'system' ? systemScheme || 'light' : preference;
  const currentTheme = theme[mode];

  const setTheme = async (newMode: ThemeMode) => {
    setPreference(newMode);
    await AsyncStorage.setItem(THEME_KEY, newMode);
  };

  const contextValue: ThemeContextType = {
    mode,
    preference,
    setTheme,
    theme: currentTheme,
    colors: currentTheme.colors,
    // Legacy compatibility mapping
    themeMode: preference,
    isDark: mode === 'dark',
    setThemeMode: setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('[Saadawa-Theme] useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

// Backward compatibility alias
export const useTheme = useAppTheme;
