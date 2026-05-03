import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Flashlight, 
  Television, 
  Globe, 
  Drop, 
  Trash, 
  Receipt, 
  Clock, 
  PlusCircle, 
  ShieldCheck, 
  CaretRight 
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { ServiceCard } from '../src/components/molecules/ServiceCard';

export default function PayBillsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const billCategories = [
    { id: 1, title: 'Electricity', desc: 'Prepaid & Postpaid', icon: Flashlight, color: '#EAB308' },
    { id: 2, title: 'Cable TV', desc: 'DSTV, GOTV & Startimes', icon: Television, color: '#9333EA' },
    { id: 3, title: 'Internet', desc: 'Smile, Spectranet & more', icon: Globe, color: '#06B6D4' },
    { id: 4, title: 'Water', desc: 'State Water Boards', icon: Drop, color: '#0EA5E9' },
    { id: 5, title: 'Waste', desc: 'State Waste Management', icon: Trash, color: '#10B981' },
    { id: 6, title: 'Tax', desc: 'State & Federal Tax', icon: Receipt, color: '#6366F1' },
  ];

  const recentBills = [
    { id: 1, title: 'EKEDC (Electricity)', price: 5000, date: 'Oct 28', color: '#EAB308' },
    { id: 2, title: 'DSTV (Cable TV)', price: 8500, date: 'Oct 25', color: '#9333EA' },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <View>
          <Text variant="headingMedium" bold>Pay Bills</Text>
          <Text variant="bodySmall" color="textSecondary">Fast & secure bill payments</Text>
        </View>
        <TouchableOpacity style={[styles.historyBtn, { backgroundColor: colors.surface }]}>
           <Clock size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.stats, { backgroundColor: colors.primary }]}>
          <View style={styles.statItem}>
              <Text variant="headingSmall" bold style={{ color: 'white' }}>₦45,500</Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Total Paid This Month</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          <View style={styles.statItem}>
              <Text variant="headingSmall" bold style={{ color: 'white' }}>12</Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Active Bills</Text>
          </View>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>CATEGORIES</Text>
        <View style={styles.grid}>
            {billCategories.map(cat => (
                <ServiceCard 
                    key={cat.id}
                    title={cat.title}
                    description={cat.desc}
                    icon={cat.icon}
                    color={cat.color}
                    onPress={() => console.log('Press', cat.title)}
                />
            ))}
        </View>
      </View>

      <View style={styles.section}>
          <View style={styles.sectionHeader}>
              <Text variant="labelMedium" color="textSecondary" medium>RECENT PAYMENTS</Text>
              <TouchableOpacity><Text variant="caption" color="primary" bold>SEE ALL</Text></TouchableOpacity>
          </View>
          {recentBills.map(bill => (
              <TouchableOpacity key={bill.id} style={[styles.recentCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.recentIcon, { backgroundColor: `${bill.color}15` }]}>
                      <Receipt size={20} color={bill.color} weight="duotone" />
                  </View>
                  <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" bold>{bill.title}</Text>
                      <Text variant="caption" color="textSecondary">{bill.date} • Paid Successful</Text>
                  </View>
                  <Text variant="bodyMedium" bold>₦{bill.price.toLocaleString()}</Text>
              </TouchableOpacity>
          ))}
      </View>

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
         <ShieldCheck size={20} color={colors.primary} weight="duotone" />
         <Text variant="caption" color="primary" style={{ flex: 1 }}>
            All payments are encrypted and secure. Confirmation tokens are sent to your email.
         </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  historyBtn: {
    padding: 12,
    borderRadius: 16,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 1,
  },
  grid: {
    gap: 4,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 16,
  },
  recentIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
});
