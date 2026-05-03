/**
 * src/components/templates/AuthLayout.tsx
 */

import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';
import { Header } from '../organisms/Header';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  scroll?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showBack = true,
}) => {
  const { colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack={showBack} transparent />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Text variant="displayMedium" bold style={styles.title}>
              {title}
            </Text>
            {subtitle && (
              <Text variant="bodyLarge" color="textSecondary" style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>

          <View style={styles.formSection}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    lineHeight: 24,
  },
  formSection: {
    flex: 1,
  },
});
