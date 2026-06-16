/**
 * src/components/atoms/Input.tsx
 *
 * Clean floating-label input with no overlap issues.
 * The label always lives ABOVE the input row — no absolute positioning
 * tricks that can collide with typed text or icons.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  rightIcon,
  leftIcon,
  isPassword,
  containerStyle,
  onFocus,
  onBlur,
  value,
  ...props
}) => {
  const { colors, theme } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // True when the label should be in the "up" (small) position
  const isFloating = isFocused || !!(value && String(value).length > 0);

  const labelAnim = useRef(new Animated.Value(isFloating ? 1 : 0)).current;

  // Keep animation in sync with external value changes (e.g. pre-filled fields)
  useEffect(() => {
    if (!label) return;
    const shouldFloat = isFocused || !!(value && String(value).length > 0);
    Animated.timing(labelAnim, {
      toValue: shouldFloat ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [value, isFocused, label]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Animated label: shrinks and moves to the top of the box
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 7],   // centre → top
  });
  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 11],
  });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      colors.textTertiary,
      isFocused ? colors.primary : colors.textSecondary,
    ],
  });

  // Left offset accounts for leftIcon + padding
  const labelLeft = leftIcon ? 44 : 16;

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderWidth: isFocused || !!error ? 1.5 : 1,
          },
        ]}
      >
        {/* Left icon — sits independently to the left */}
        {leftIcon && (
          <View style={styles.leftIconWrapper}>{leftIcon}</View>
        )}

        {/* Floating label — absolutely positioned inside the wrapper */}
        {label ? (
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.floatingLabel,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: labelColor,
                left: labelLeft,
                fontFamily: theme.fonts.medium,
              },
            ]}
          >
            {label}
          </Animated.Text>
        ) : null}

        {/* The actual TextInput — paddingTop pushes text below the floated label */}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: theme.fonts.regular,
              paddingLeft: leftIcon ? 44 : 16,
              paddingTop: label ? 20 : 0,
              paddingBottom: label ? 4 : 0,
            },
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          {...props}
          placeholderTextColor={label ? (isFloating ? colors.textTertiary : 'transparent') : colors.textTertiary}
        />

        {/* Right icon / password toggle */}
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconWrapper}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword
              ? <Eye size={20} color={colors.textSecondary} />
              : <EyeSlash size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconWrapper}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText} variant="caption" color="error">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  inputWrapper: {
    height: 60,
    borderRadius: 14,
    // NO alignItems:center — children are positioned manually
    position: 'relative',
    overflow: 'visible',
  },
  floatingLabel: {
    position: 'absolute',
    right: 16,          // prevent overflow on very long labels
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  leftIconWrapper: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 3,
  },
  rightIconWrapper: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 3,
  },
  input: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    // Push text down so it sits below the floated label
    paddingTop: 20,
    paddingBottom: 4,
    paddingRight: 44,   // room for right icon
    fontSize: 15,
    zIndex: 1,
  },
  errorText: {
    marginTop: 5,
    marginLeft: 4,
  },
});
