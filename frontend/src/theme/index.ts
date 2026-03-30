/**
 * src/theme/index.ts
 */

export * from './colors';
export * from './typography';
export * from './layout';

import { lightTheme, darkTheme } from './colors';
import { typeScale, typography as typographyTokens } from './typography';
import { spacing, borderRadius, shadows } from './layout';

export const theme = {
  light: {
    colors: lightTheme,
    typography: typeScale,
    fonts: typographyTokens.fontFamily,
    spacing,
    borderRadius,
    shadows,
  },
  dark: {
    colors: darkTheme,
    typography: typeScale,
    fonts: typographyTokens.fontFamily,
    spacing,
    borderRadius,
    shadows,
  },
};

export type Theme = typeof theme.light;
