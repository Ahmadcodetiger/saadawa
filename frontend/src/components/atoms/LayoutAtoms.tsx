/**
 * src/components/atoms/Badge.tsx
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from './Text';
import { ThemeColors } from '../../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const { colors, theme } = useAppTheme();

  const getVariantStyles = () => {
    const config: Record<BadgeVariant, { bg: string; text: keyof ThemeColors }> = {
      success: { bg: colors.success + '15', text: 'success' },
      warning: { bg: colors.warning + '15', text: 'warning' },
      error: { bg: colors.error + '15', text: 'error' },
      info: { bg: colors.info + '15', text: 'info' },
      neutral: { bg: colors.surface, text: 'textSecondary' },
    };

    return config[variant];
  };

  const { bg, text } = getVariantStyles();

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      <Text variant="overline" color={text} bold>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});

/**
 * src/components/atoms/Divider.tsx
 */
export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }, style]} />;
};

/**
 * src/components/atoms/Skeleton.tsx
 */
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useAppTheme();
  const shimmerValue = useSharedValue(0);

  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(shimmerValue.value, [0, 1], [-width as any, width as any])
    }]
  }));

  return (
    <View 
      style={[
        style, 
        { 
          width: width as any, 
          height: height as any, 
          borderRadius, 
          backgroundColor: colors.border,
          overflow: 'hidden'
        }
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', colors.surfaceElevated, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};
