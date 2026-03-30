/**
 * src/components/atoms/Text.tsx
 * 
 * Standardizing typography across the app.
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { typeScale, ThemeColors } from '../../theme';

type Variant = keyof typeof typeScale;

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: keyof ThemeColors;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  medium?: boolean;
  italic?: boolean;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'bodyMedium',
  color = 'textPrimary',
  align = 'left',
  bold,
  medium,
  italic,
  style,
  children,
  ...props
}) => {
  const { theme, colors } = useAppTheme();
  
  const textStyle: TextStyle = {
    ...theme.typography[variant],
    color: colors[color],
    textAlign: align,
  };

  // Override weight if explicitly provided
  if (bold) textStyle.fontFamily = theme.fonts.bold;
  if (medium) textStyle.fontFamily = theme.fonts.medium;
  if (italic) textStyle.fontStyle = 'italic';

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
};
