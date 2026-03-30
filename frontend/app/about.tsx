import React from 'react';
import { View, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
import { 
  Globe, 
  TwitterLogo, 
  InstagramLogo, 
  FacebookLogo, 
  ShieldCheck, 
  Info,
  TextDivider
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';

export default function AboutScreen() {
  const { colors } = useAppTheme();

  const socialLinks = [
    { icon: Globe, url: 'https://saadawa.com' },
    { icon: TwitterLogo, url: 'https://twitter.com/saadawa' },
    { icon: InstagramLogo, url: 'https://instagram.com/saadawa' },
    { icon: FacebookLogo, url: 'https://facebook.com/saadawa' },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>About Saadawa</Text>
        <Text variant="bodySmall" color="textSecondary">Version 2.1.0 (Stable)</Text>
      </View>

      <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text variant="headingLarge" bold style={{ color: 'white' }}>S</Text>
          </View>
          <Text variant="headingSmall" bold style={{ marginTop: 16 }}>Saadawa VTU</Text>
          <Text variant="caption" color="textSecondary">Fintech services, redefined.</Text>
      </View>

      <View style={styles.content}>
          <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>OUR MISSION</Text>
          <Text variant="bodyMedium" color="textPrimary" style={styles.missionText}>
              Providing seamless, secure, and affordable financial and utility services to millions of Nigerians. Our goal is to bridge the gap between technology and accessibility in the fintech space.
          </Text>

          <Text variant="labelMedium" color="textSecondary" medium style={[styles.sectionTitle, { marginTop: 32 }]}>CONNECT WITH US</Text>
          <View style={styles.socialGrid}>
              {socialLinks.map((s, i) => (
                  <TouchableOpacity key={i} style={[styles.socialBtn, { backgroundColor: colors.surface }]} onPress={() => Linking.openURL(s.url)}>
                    <s.icon size={24} color={colors.primary} weight="duotone" />
                  </TouchableOpacity>
              ))}
          </View>

          <View style={[styles.legalCard, { backgroundColor: colors.primaryLight }]}>
              <ShieldCheck size={28} color={colors.primary} weight="duotone" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text variant="bodyMedium" bold color="primary">Protected & Verified</Text>
                  <Text variant="caption" color="primary">Saadawa is a registered entity with CAC under RC: 1234567. We are PCI-DSS compliant.</Text>
              </View>
          </View>
      </View>

      <View style={styles.footer}>
          <Text variant="caption" color="textTertiary">© 2026 Saadawa Ltd. All rights reserved.</Text>
      </View>

      <View style={{ height: 100 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  content: {
    paddingHorizontal: 4,
  },
  sectionTitle: {
    marginBottom: 16,
    letterSpacing: 1,
  },
  missionText: {
    lineHeight: 24,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  socialBtn: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 64,
  },
});