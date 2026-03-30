import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, Key, Info, CheckCircle } from 'phosphor-react-native';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { useAlert } from '@/components/AlertContext';
import { userService } from '@/services/user.service';

export default function SetPinScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetPin = async () => {
    if (pin.length !== 4) {
      showError('PIN must be 4 digits'); return;
    }
    if (pin !== confirmPin) {
      showError('PINs do not match'); return;
    }
    setIsLoading(true);
    try {
      const res = await userService.setTransactionPin(pin);
      if (res.success) {
        showSuccess('Transaction PIN set successfully!');
        setTimeout(() => router.replace('/(tabs)'), 1500);
      } else showError(res.message || 'Failed to set PIN');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Secure your Payments</Text>
        <Text variant="bodySmall" color="textSecondary">Set your 4-digit transaction PIN</Text>
      </View>

      <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                  <Key size={32} color="white" weight="duotone" />
              </View>
              <Text variant="bodyMedium" bold style={{ marginTop: 24 }}>Create Transaction PIN</Text>
              <Text variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
                  This PIN will be required for all transfers, bill payments and withdrawals.
              </Text>

              <View style={styles.form}>
                  <Input 
                      label="New PIN"
                      value={pin}
                      onChangeText={setPin}
                      maxLength={4}
                      keyboardType="number-pad"
                      secureTextEntry
                      placeholder="****"
                      style={styles.pinInput}
                  />
                  <Input 
                      label="Confirm PIN"
                      value={confirmPin}
                      onChangeText={setConfirmPin}
                      maxLength={4}
                      keyboardType="number-pad"
                      secureTextEntry
                      placeholder="****"
                      style={styles.pinInput}
                  />
              </View>
          </View>

          <Button 
            label="Set Transaction PIN"
            onPress={handleSetPin}
            loading={isLoading}
            style={styles.btn}
            icon={<ShieldCheck size={20} color="white" weight="bold" />}
          />

          <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
             <Info size={20} color={colors.primary} weight="duotone" />
             <Text variant="caption" color="primary" style={{ flex: 1 }}>
                Do not share your PIN with anyone. Saadawa staff will never ask for your PIN.
             </Text>
          </View>
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
  content: {
    paddingHorizontal: 4,
  },
  card: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 32,
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '100%',
    marginTop: 32,
  },
  pinInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 12,
  },
  btn: {
    marginTop: 12,
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
