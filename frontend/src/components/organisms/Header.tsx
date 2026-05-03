/**
 * src/components/organisms/Header.tsx
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { CaretLeft } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  onBack,
  rightComponent,
  transparent = false,
  style,
}) => {
  const { colors, theme } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top || 16,
          backgroundColor: transparent ? 'transparent' : colors.background,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity 
              onPress={handleBack} 
              style={[styles.backBtn, { backgroundColor: colors.surface }]}
            >
              <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.center}>
          {title && (
            <Text variant="headingSmall" color="textPrimary" bold style={styles.title}>
              {title}
            </Text>
          )}
        </View>

        <View style={styles.right}>
          {rightComponent || <View style={{ width: 44 }} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  left: {
    width: '20%',
    alignItems: 'flex-start',
  },
  center: {
    width: '60%',
    alignItems: 'center',
  },
  right: {
    width: '20%',
    alignItems: 'flex-end',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
});
