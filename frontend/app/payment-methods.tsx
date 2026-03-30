import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard, Bank, PlusCircle, CheckCircle, Trash, Wallet } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Button } from '../src/components/atoms/Button';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';

export default function PaymentMethodsScreen() {
  const { colors } = useAppTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const methods = [
    { id: '1', title: 'Stanbic IBTC Bank', desc: '0012****89', type: 'bank', color: colors.primary },
    { id: '2', title: 'Visa Classic', desc: '4352 **** **** 1290', type: 'card', color: colors.secondary },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Payment Methods</Text>
        <Text variant="bodySmall" color="textSecondary">Manage how you fund your account</Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>SAVED METHODS</Text>
        {methods.map((m) => (
          <TouchableOpacity 
            key={m.id} 
            style={[styles.methodCard, { backgroundColor: colors.surface }]}
            onPress={() => setSelectedId(m.id)}
          >
            <View style={[styles.iconBox, { backgroundColor: `${m.color}15` }]}>
              {m.type === 'bank' ? <Bank size={24} color={m.color} /> : <CreditCard size={24} color={m.color} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" bold>{m.title}</Text>
              <Text variant="caption" color="textSecondary">{m.desc}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.deleteBtn}>
                    <Trash size={18} color={colors.error} />
                </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Button 
        label="Add New Payment Method"
        onPress={() => {}}
        variant="outline"
        icon={<PlusCircle size={20} color={colors.primary} weight="bold" />}
      />

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
         <Wallet size={20} color={colors.primary} weight="duotone" />
         <Text variant="caption" color="primary" style={{ flex: 1 }}>
            Your payment details are encrypted and stored securely using bank-grade encryption technologies.
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 1,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    padding: 8,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 32,
  },
});