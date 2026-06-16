
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Phone, Coins, Key, Info } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { NetworkSelector, Network } from '../src/components/molecules/NetworkSelector';
import { useAlert } from '@/components/AlertContext';
import { billPaymentService } from '@/services/billpayment.service';

const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

const FALLBACK_NETWORKS: Network[] = [
  { id: '1', name: 'MTN', color: '#FFCC00' },
  { id: '2', name: 'Glo', color: '#00A95C' },
  { id: '3', name: 'Airtel', color: '#FF0000' },
  { id: '4', name: '9mobile', color: '#00693E' },
];

export default function BuyAirtimeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; amount?: string }>();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [netLoading, setNetLoading] = useState(true);

  useEffect(() => {
    if (params?.phone) setPhoneNumber(params.phone);
    if (params?.amount) {
      const amt = Number(params.amount);
      if (!Number.isNaN(amt) && amt > 0) setSelectedAmount(amt);
    }
  }, [params]);

  useEffect(() => {
    loadNetworks();
  }, []);

  const loadNetworks = async () => {
    try {
      setNetLoading(true);
      const res = await billPaymentService.getNetworks();

      // FIX: Handle multiple possible response shapes from backend
      // Backend may return: { success: true, networks: [...] }
      // Or service may return: response.data which could be the above
      // Or it could be wrapped: { data: { networks: [...] } }
      const networksData =
        res?.networks ||           // Direct: { networks: [...] }
        res?.data?.networks ||     // Wrapped: { data: { networks: [...] } }
        res?.data?.data ||         // Double wrapped
        res?.data ||               // Just data array
        (Array.isArray(res) ? res : null); // Direct array

      if (Array.isArray(networksData) && networksData.length > 0) {
        const mapped: Network[] = networksData.map((n: any) => {
          let color = '#0A2540';
          const rawName = n.name || n.network_name || n.network || n.title || '';
          const nameStr = typeof n === 'string' ? n : rawName;
          const lowerName = nameStr.toLowerCase();

          if (lowerName.includes('mtn')) color = '#FFCC00';
          else if (lowerName.includes('glo')) color = '#00A95C';
          else if (lowerName.includes('airtel')) color = '#FF0000';
          else if (lowerName.includes('9mobile') || lowerName.includes('etisalat')) color = '#00693E';

          return {
            id: String(n.id || n.network_code || n.network_id || nameStr || Math.random()),
            name: nameStr || 'Network',
            color,
          };
        });
        setNetworks(mapped);
      } else {
        console.warn('No networks data received, using fallback');
        setNetworks(FALLBACK_NETWORKS);
      }
    } catch (e: any) {
      console.error('Failed to load networks:', e?.message || e);
      setNetworks(FALLBACK_NETWORKS);
    } finally {
      setNetLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!phoneNumber || !selectedNetworkId || (!selectedAmount && !customAmount) || !pin) {
      showError('Please fill all required fields');
      return;
    }

    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount < 50) {
      showError('Minimum airtime amount is ₦50');
      return;
    }

    setIsLoading(true);
    try {
      const response = await billPaymentService.purchaseAirtime({
        network: selectedNetworkId,
        phone: phoneNumber.replace(/\D/g, ''),
        amount,
        airtime_type: 'VTU',
        ported_number: true,
        pin,
      });

      // FIX: Handle multiple possible response shapes
      // Service returns response.data, so check for success in various places
      const isSuccess =
        response?.success === true ||
        response?.data?.success === true ||
        response?.status === 'success' ||
        response?.data?.status === 'success';

      const errorMessage =
        response?.message ||
        response?.data?.message ||
        response?.error ||
        'Failed to purchase airtime';

      if (isSuccess) {
        showSuccess(`Airtime purchase successful! ₦${amount} sent to ${phoneNumber}`);
        setTimeout(() => router.back(), 2000);
      } else {
        showError(errorMessage);
      }
    } catch (error: any) {
      // FIX: Better error extraction from API errors
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to purchase airtime. Please try again.';
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentAmount = selectedAmount || parseFloat(customAmount) || 0;

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Buy Airtime</Text>
        <Text variant="bodySmall" color="textSecondary">Top up any phone number instantly</Text>
      </View>

      <View style={styles.section}>
        <NetworkSelector
          networks={networks}
          selectedId={selectedNetworkId}
          onSelect={setSelectedNetworkId}
          label="Service Provider"
        />
        {netLoading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginTop: -12, marginBottom: 12 }}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          DESTINATION
        </Text>
        <Input
          label="Receiver phone number"
          value={phoneNumber}
          onChangeText={(v: string) => setPhoneNumber(v.replace(/\D/g, '').slice(0, 11))}
          keyboardType="phone-pad"
          maxLength={11}
          rightIcon={<Phone size={20} color={colors.textTertiary} />}
        />
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          AMOUNT
        </Text>
        <View style={styles.quickAmounts}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[
                styles.amtChip,
                { backgroundColor: selectedAmount === amt ? colors.primary : colors.surface },
              ]}
              onPress={() => {
                setSelectedAmount(amt);
                setCustomAmount('');
              }}
            >
              <Text
                variant="bodyMedium"
                bold
                style={{ color: selectedAmount === amt ? 'white' : colors.textPrimary }}
              >
                ₦{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input
          label="Other Amount"
          value={customAmount}
          onChangeText={(v: string) => {
            setCustomAmount(v);
            setSelectedAmount(null);
          }}
          keyboardType="numeric"
          rightIcon={<Coins size={20} color={colors.textTertiary} />}
        />
      </View>

      <View style={styles.section}>
        <Input
          label="Transaction PIN"
          value={pin}
          onChangeText={(v: string) => setPin(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          rightIcon={<Key size={20} color={colors.textTertiary} />}
        />
      </View>

      {currentAmount > 0 && selectedNetworkId && (
        <View style={[styles.summary, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Network</Text>
            <Text variant="bodyMedium" bold>
              {networks.find((n) => n.id === selectedNetworkId)?.name}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Recipient</Text>
            <Text variant="bodyMedium" bold>{phoneNumber || '-'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Total Cost</Text>
            <Text variant="headingSmall" color="primary" bold>
              ₦{currentAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      <Button
        label="Purchase Airtime"
        onPress={handleBuy}
        loading={isLoading}
        style={styles.buyBtn}
        disabled={!phoneNumber || !selectedNetworkId || !currentAmount || pin.length < 4}
      />

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
        <Info size={20} color={colors.primary} weight="duotone" />
        <Text variant="caption" color="primary" style={{ flex: 1 }}>
          Airtime is delivered instantly. Please confirm the phone number before proceeding.
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
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  amtChip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: '28%',
    alignItems: 'center',
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
