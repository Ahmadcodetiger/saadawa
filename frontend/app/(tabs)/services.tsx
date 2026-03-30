import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  PhoneCall, 
  WifiHigh, 
  Television, 
  Lightning,
  ShieldCheck,
  GraduationCap
} from 'phosphor-react-native';

import { useAppTheme } from '../../src/theme/ThemeContext';
import { Text } from '../../src/components/atoms/Text';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';

export default function ServicesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const services = [
    { id: 'airtime', title: 'Airtime', icon: PhoneCall, route: '/buy-airtime', color: '#5B6AF0' },
    { id: 'data', title: 'Data', icon: WifiHigh, route: '/buy-data', color: '#3B9EEB' },
    { id: 'tv', title: 'TV Cable', icon: Television, route: '/pay-bills', color: '#E040A0' },
    { id: 'electric', title: 'Electricity', icon: Lightning, route: '/pay-bills', color: '#F0A030' },
    { id: 'edu', title: 'Education', icon: GraduationCap, route: '/pay-bills', color: '#10B981' },
    { id: 'insurance', title: 'Insurance', icon: ShieldCheck, route: '/pay-bills', color: '#3B82F6' },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Quick Actions</Text>
        <Text variant="bodySmall" color="textSecondary">Access all VTU and Bill payment services here.</Text>
      </View>

      <View style={styles.grid}>
        {services.map((s) => (
          <TouchableOpacity 
            key={s.id} 
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => router.push(s.route as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: `${s.color}15` }]}>
              <s.icon size={28} color={s.color} weight="duotone" />
            </View>
            <Text variant="bodyMedium" bold style={{ textAlign: 'center', marginTop: 12 }}>{s.title}</Text>
          </TouchableOpacity>
        ))}
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
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
