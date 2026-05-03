import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Television, 
  Flashlight, 
  Globe, 
  GraduationCap, 
  SoccerBall, 
  ShieldCheck, 
  Bus, 
  Gift, 
  Cards, 
  Flag, 
  Heart, 
  Drop,
  RocketLaunch
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';

export default function MoreScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const services = [
    { id: 1, title: 'Cable TV', icon: Television, color: '#9333EA' },
    { id: 2, title: 'Electricity', icon: Flashlight, color: '#EAB308' },
    { id: 3, title: 'Internet', icon: Globe, color: '#06B6D4' },
    { id: 4, title: 'Education', icon: GraduationCap, color: '#10B981' },
    { id: 5, title: 'Betting', icon: SoccerBall, color: '#F59E0B' },
    { id: 6, title: 'Insurance', icon: ShieldCheck, color: '#3B82F6' },
    { id: 7, title: 'Transport', icon: Bus, color: '#8B5CF6' },
    { id: 8, title: 'Gift Cards', icon: Gift, color: '#EC4899' },
    { id: 9, title: 'Vouchers', icon: Cards, color: '#14B8A6' },
    { id: 10, title: 'Government', icon: Flag, color: '#6366F1' },
    { id: 11, title: 'Donations', icon: Heart, color: '#EF4444' },
    { id: 12, title: 'Utilities', icon: Drop, color: '#0EA5E9' },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Other Services</Text>
        <Text variant="bodySmall" color="textSecondary">Explore more ways to use Saadawa</Text>
      </View>

      <View style={styles.grid}>
        {services.map((s) => (
          <TouchableOpacity 
            key={s.id} 
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => console.log('Press', s.title)}
          >
            <View style={[styles.iconBox, { backgroundColor: `${s.color}15` }]}>
              <s.icon size={26} color={s.color} weight="duotone" />
            </View>
            <Text variant="caption" bold style={{ textAlign: 'center', marginTop: 8 }}>{s.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.comingSoon, { backgroundColor: colors.primary }]}>
          <RocketLaunch size={40} color="white" weight="duotone" />
          <Text variant="bodyLarge" bold style={{ color: 'white', marginTop: 12 }}>New Services Loading...</Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 }}>
              We are constantly adding more partners to give you the best experience.
          </Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '30.5%',
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    marginTop: 32,
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
  },
});
