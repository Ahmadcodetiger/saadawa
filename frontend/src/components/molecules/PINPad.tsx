/**
 * src/components/molecules/PINPad.tsx
 * 
 * Large circular PIN entry pad.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Backspace } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PINPadProps {
  onPress: (digit: string) => void;
  onBackspace: () => void;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

export const PINPad: React.FC<PINPadProps> = ({ onPress, onBackspace }) => {
  const { colors, theme } = useAppTheme();

  const PINButton = ({ item }: { item: string }) => {
    const scale = useSharedValue(1);
    
    const handlePressIn = () => (scale.value = withSpring(0.9));
    const handlePressOut = () => (scale.value = withSpring(1));
    
    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (item === 'backspace') {
        onBackspace();
      } else if (item !== '') {
        onPress(item);
      }
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    if (item === '') return <View style={styles.buttonPlaceholder} />;

    return (
      <AnimatedTouchable
        style={[styles.button, animatedStyle, { backgroundColor: colors.surface }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {item === 'backspace' ? (
          <Backspace size={28} color={colors.textPrimary} weight="bold" />
        ) : (
          <Text variant="displayMedium" bold>{item}</Text>
        )}
      </AnimatedTouchable>
    );
  };

  return (
    <View style={styles.container}>
      {DIGITS.map((digit, index) => (
        <View key={index} style={styles.buttonContainer}>
          <PINButton item={digit} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  buttonContainer: {
    width: '33%',
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPlaceholder: {
    width: 72,
    height: 72,
  },
});
