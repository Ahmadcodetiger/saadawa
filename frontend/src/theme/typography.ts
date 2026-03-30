/**
 * src/theme/typography.ts
 * 
 * Complete typography system using DM Sans (Fintech standards).
 */

export const typography = {
  fontFamily: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    bold: 'DMSans_700Bold',
  },
  size: {
    displayLarge: 40,
    displayMedium: 32,
    headingLarge: 24,
    headingMedium: 20,
    headingSmall: 18,
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 12,
    labelLarge: 14,
    labelMedium: 12,
    caption: 11,
    overline: 10,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export type TypographyToken = {
  fontFamily: string;
  fontSize: number;
  fontWeight: '400' | '500' | '700' | 'normal' | 'bold';
  lineHeight: number;
  letterSpacing: number;
};

const createTypeToken = (
  size: keyof typeof typography.size,
  weight: keyof typeof typography.fontFamily = 'regular'
): TypographyToken => ({
  fontFamily: typography.fontFamily[weight],
  fontSize: typography.size[size],
  fontWeight: weight === 'bold' ? '700' : weight === 'medium' ? '500' : '400',
  lineHeight: typography.size[size] * typography.lineHeight.normal,
  letterSpacing: typography.letterSpacing.normal,
});

export const typeScale = {
  displayLarge: createTypeToken('displayLarge', 'bold'),
  displayMedium: createTypeToken('displayMedium', 'bold'),
  headingLarge: createTypeToken('headingLarge', 'bold'),
  headingMedium: createTypeToken('headingMedium', 'bold'),
  headingSmall: createTypeToken('headingSmall', 'bold'),
  bodyLarge: createTypeToken('bodyLarge', 'regular'),
  bodyMedium: createTypeToken('bodyMedium', 'regular'),
  bodySmall: createTypeToken('bodySmall', 'regular'),
  labelLarge: createTypeToken('labelLarge', 'medium'),
  labelMedium: createTypeToken('labelMedium', 'medium'),
  caption: createTypeToken('caption', 'regular'),
  overline: createTypeToken('overline', 'medium'),
};
