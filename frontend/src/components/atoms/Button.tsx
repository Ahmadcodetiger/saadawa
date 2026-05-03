/**
 * src/components/atoms/Button.tsx
 * 
 * Premium interactive buttons for Fintech UI.
 */

import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode; // Alias for leftIcon
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  leftIcon,
  rightIcon,
  icon,
  style,
}) => {
  const { colors, theme } = useAppTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyles = (): ViewStyle[] => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.lg,
    };

    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: { height: 40, paddingHorizontal: theme.spacing.md },
      md: { height: 52, paddingHorizontal: theme.spacing.lg },
      lg: { height: 60, paddingHorizontal: theme.spacing.xxl },
    };

    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.primaryLight },
      outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
      ghost: { backgroundColor: 'transparent' },
      danger: { backgroundColor: colors.error + '20' },
    };

    return [base, sizeStyles[size], variantStyles[variant], style || {}];
  };

  const getLabelColor = (): keyof typeof colors => {
    if (variant === 'primary') return 'textInverse';
    if (variant === 'danger') return 'error';
    if (variant === 'secondary') return 'primary';
    return 'primary';
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.primary} />
      ) : (
        <>
          {(leftIcon || icon) && <Animated.View style={styles.iconLeft}>{leftIcon || icon}</Animated.View>}
          <Text
            variant={size === 'sm' ? 'labelMedium' : 'labelLarge'}
            color={getLabelColor()}
            bold
          >
            {label}
          </Text>
          {rightIcon && <Animated.View style={styles.iconRight}>{rightIcon}</Animated.View>}
        </>
      )}
    </>
  );

  if (variant === 'primary' && !disabled && !loading) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[animatedStyle, style]}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[getContainerStyles(), { backgroundColor: undefined }]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getContainerStyles(), animatedStyle, disabled && styles.disabled]}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
