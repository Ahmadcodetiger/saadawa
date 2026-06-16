import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ServiceItemProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  color?: string;
}

export const ServiceItem: React.FC<ServiceItemProps> = ({
  label,
  icon,
  onPress,
  color,
}) => {
  const { colors, theme } = useAppTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Extract color for shadow
  const iconColor = (icon as any)?.props?.color || colors.primary;

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <View style={[
        styles.iconWrapper, 
        { 
            backgroundColor: color || colors.surface,
            shadowColor: iconColor,
        }
      ]}>
        {icon}
      </View>
      <Text variant="labelMedium" style={[styles.label, { color: colors.textPrimary }]}>
        {label}
      </Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '25%', // 4 items per row
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    // Subtle inner shadow
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  label: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
