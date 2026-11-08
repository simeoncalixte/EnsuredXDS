import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import { xdsThemes, cssVariables, type XdsTheme, type XdsThemeName } from './palette.js';
export { darkTheme, lightTheme, xdsThemes } from './palette.js';
export type { XdsTheme, XdsThemeName, XdsThemeColors } from './palette.js';

export const XDS_THEME_STORAGE_KEY = 'ensured-xds-theme';

type ThemeContextValue = {
  theme: XdsTheme;
  themeName: XdsThemeName;
  setTheme: (theme: XdsThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const initialThemeName = (): XdsThemeName => {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(XDS_THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
};

export function XdsThemeProvider({ children }: React.PropsWithChildren) {
  const [themeName, setTheme] = useState<XdsThemeName>(initialThemeName);
  const theme = xdsThemes[themeName];

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = themeName;
    root.style.colorScheme = themeName;
    Object.entries(cssVariables(theme)).forEach(([name, value]) =>
      root.style.setProperty(name, value),
    );
    window.localStorage.setItem(XDS_THEME_STORAGE_KEY, themeName);
  }, [theme, themeName]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeName,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme, themeName],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useXdsTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useXdsTheme must be used inside XdsThemeProvider');
  return context;
}
