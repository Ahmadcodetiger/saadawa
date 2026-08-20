import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Lightning, Key, Info, IdentificationCard, Phone, CheckCircle, Coins } from 'phosphor-react-native';

import { useAppTheme } from '../../src/theme/ThemeContext';
import { Text } from '../../src/components/atoms/Text';
import { Button } from '../../src/components/atoms/Button';
import { Input } from '../../src/components/atoms/Input';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';
import { NetworkSelector, Network } from '../../src/components/molecules/NetworkSelector';
import { SelectInput } from '../../src/components/molecules/SelectInput';
import { useAlert } from '@/components/AlertContext';
import { billPaymentService } from '@/services/billpayment.service';

export default function BuyElectricityScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  
  const [providers, setProviders] = useState<Network[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setProvidersLoading(true);
      const res = await billPaymentService.getElectricityProviders();
      const rawProviders = res?.data || res;
      
      if (Array.isArray(rawProviders) && rawProviders.length > 0) {
        const mapped = rawProviders.map((p: any) => {
          let name = String(p.provider || p.name || p.title || p || '');
          let id = String(p.id || p.code || name.toLowerCase());
          let color = '#F0A030'; // default orange/amber

          return { id, name, color };
        });
        setProviders(mapped);
      } else {
        // Fallbacks
        setProviders([
          { id: 'ikeja-electric', name: 'Ikeja Electric (IKEDC)', color: '#F0A030' },
          { id: 'eko-electric', name: 'Eko Electric (EKEDC)', color: '#F0D030' },
          { id: 'abuja-electric', name: 'Abuja Electric (AEDC)', color: '#F09030' },
        ]);
      }
    } catch (e: any) {
      console.warn('Failed to load electricity providers, using fallback:', e.message);
      setProviders([
        { id: 'ikeja-electric', name: 'Ikeja Electric (IKEDC)', color: '#F0A030' },
        { id: 'eko-electric', name: 'Eko Electric (EKEDC)', color: '#F0D030' },
        { id: 'abuja-electric', name: 'Abuja Electric (AEDC)', color: '#F09030' },
      ]);
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedProviderId || !meterNumber) {
      showError('Please select a provider and enter your Meter Number');
      return;
    }

    setIsVerifying(true);
    setVerifiedName(null);
    try {
      const res = await billPaymentService.verifyElectricityMeter(selectedProviderId, meterNumber, meterType);
      const name = (res as any)?.Customer_Name || res?.data?.Customer_Name || res?.data?.customer_name || (res as any)?.response?.Customer_Name;
      if (name) {
        setVerifiedName(name);
        showSuccess(`Meter verified successfully: ${name}`);
      } else {
        showError('Could not verify owner. Please confirm Meter number.');
      }
    } catch (e: any) {
      showError(e.message || 'Meter verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedProviderId || !meterNumber || !amount || !phoneNumber || !pin) {
      showError('Please fill all required fields');
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum < 500) {
      showError('Minimum purchase amount is ₦500');
      return;
    }

    setIsLoading(true);
    try {
      const response = await billPaymentService.purchaseElectricity({
        provider: selectedProviderId,
        meternumber: meterNumber,
        amount: amtNum,
        metertype: meterType,
        phone: phoneNumber.replace(/\D/g, ''),
        pin,
      });

      if (response.success) {
        // If provider returned a token, display it nicely
        const token = (response as any)?.token || response?.data?.token || (response as any)?.provider_response?.token;
        if (token) {
          showSuccess(`Purchase successful! Token: ${token}`);
        } else {
          showSuccess(`Electricity purchase request submitted successfully!`);
        }
        setTimeout(() => router.back(), 3000);
      } else {
        showError(response.message || 'Purchase failed');
      }
    } catch (error: any) {
      const ref = error?.errors?.reference || error?.reference || error?.data?.reference || error?.errors?.transaction?.reference_number;
      const refMsg = ref ? ` (Ref: ${ref})` : '';
      showError((error.message || 'Electricity purchase failed. Please try again.') + refMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentAmount = parseFloat(amount) || 0;

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Electricity Bills</Text>
        <Text variant="bodySmall" color="textSecondary">Buy prepaid & postpaid electricity tokens instantly</Text>
      </View>

      <View style={styles.section}>
        {providersLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <NetworkSelector
            networks={providers}
            selectedId={selectedProviderId}
            onSelect={setSelectedProviderId}
            label="Select Disco Provider"
          />
        )}
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          METER TYPE
        </Text>
        <View style={styles.typeChips}>
          <TouchableOpacity
            style={[
              styles.typeChip,
              { backgroundColor: meterType === 'prepaid' ? colors.primary : colors.surface }
            ]}
            onPress={() => {
              setMeterType('prepaid');
              setVerifiedName(null);
            }}
          >
            <Text variant="bodyMedium" bold style={{ color: meterType === 'prepaid' ? 'white' : colors.textPrimary }}>
              Prepaid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeChip,
              { backgroundColor: meterType === 'postpaid' ? colors.primary : colors.surface }
            ]}
            onPress={() => {
              setMeterType('postpaid');
              setVerifiedName(null);
            }}
          >
            <Text variant="bodyMedium" bold style={{ color: meterType === 'postpaid' ? 'white' : colors.textPrimary }}>
              Postpaid
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          METER NUMBER
        </Text>
        <View style={styles.verifyContainer}>
          <View style={{ flex: 1 }}>
            <Input
              label="Enter Meter Number"
              value={meterNumber}
              onChangeText={(v) => {
                setMeterNumber(v.replace(/\D/g, ''));
                setVerifiedName(null);
              }}
              keyboardType="numeric"
              rightIcon={<IdentificationCard size={20} color={colors.textTertiary} />}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              { backgroundColor: meterNumber.length > 5 ? colors.primary : colors.surfaceElevated }
            ]}
            onPress={handleVerify}
            disabled={isVerifying || meterNumber.length <= 5}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text variant="bodyMedium" bold style={{ color: meterNumber.length > 5 ? 'white' : colors.textTertiary }}>
                Verify
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {verifiedName && (
          <View style={[styles.verifiedCard, { backgroundColor: colors.success + '10', borderColor: colors.success }]}>
            <CheckCircle size={20} color={colors.success} weight="fill" />
            <Text variant="bodyMedium" bold style={{ color: colors.success, flex: 1 }}>
              {verifiedName}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          AMOUNT
        </Text>
        <Input
          label="Enter Amount (₦500 minimum)"
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
          keyboardType="numeric"
          rightIcon={<Coins size={20} color={colors.textTertiary} />}
        />
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          ALERT PHONE NUMBER
        </Text>
        <Input
          label="Phone number for token delivery"
          value={phoneNumber}
          onChangeText={(v) => setPhoneNumber(v.replace(/\D/g, '').slice(0, 11))}
          keyboardType="phone-pad"
          maxLength={11}
          rightIcon={<Phone size={20} color={colors.textTertiary} />}
        />
      </View>

      <View style={styles.section}>
        <Input
          label="Transaction PIN"
          value={pin}
          onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          rightIcon={<Key size={20} color={colors.textTertiary} />}
        />
      </View>

      {currentAmount > 0 && selectedProviderId && (
        <View style={[styles.summary, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">disco Provider</Text>
            <Text variant="bodyMedium" bold>{providers.find(p => p.id === selectedProviderId)?.name}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Customer Name</Text>
            <Text variant="bodyMedium" bold>{verifiedName || '-'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Meter Type</Text>
            <Text variant="bodyMedium" bold style={{ textTransform: 'capitalize' }}>{meterType}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Total Charged</Text>
            <Text variant="headingSmall" color="primary" bold>₦{currentAmount.toLocaleString()}</Text>
          </View>
        </View>
      )}

      <Button
        label="Purchase Token"
        onPress={handleBuy}
        loading={isLoading}
        style={styles.buyBtn}
        disabled={!selectedProviderId || !meterNumber || !amount || !phoneNumber || pin.length < 4 || !verifiedName}
      />

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
        <Info size={20} color={colors.primary} weight="duotone" />
        <Text variant="caption" color="primary" style={{ flex: 1 }}>
          Always verify the meter details before buying. Prepaid tokens will be sent to the alert phone number.
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
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  typeChips: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  typeChip: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  verifyBtn: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    gap: 12,
  },
  summary: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
    marginTop: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buyBtn: {
    marginBottom: 24,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
});
