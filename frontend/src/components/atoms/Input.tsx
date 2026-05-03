/**
 * src/components/atoms/Input.tsx
 * 
 * High-quality form input with floating label animation.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label: string;
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
  
  // Floating label animation
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // React to value changes (e.g. async data loading)
  useEffect(() => {
    if (value && !isFocused) {
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (!value && !isFocused) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [value, isFocused]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    if (onBlur) onBlur(e);
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: leftIcon ? 40 : 16,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 8],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 11],
    }),
    color: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textTertiary, isFocused ? colors.primary : colors.textSecondary],
    }),
    fontFamily: theme.fonts.medium,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon ? (
          <View style={styles.leftIcon}>{leftIcon}</View>
        ) : null}

        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: theme.fonts.regular,
              paddingTop: 18, // Make room for floating label
              paddingLeft: leftIcon ? 8 : 0,
            },
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            {showPassword ? (
              <Eye size={20} color={colors.textSecondary} />
            ) : (
              <EyeSlash size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
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
    height: 58,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  rightIcon: {
    marginLeft: 8,
  },
  leftIcon: {
    marginRight: 4,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
});
