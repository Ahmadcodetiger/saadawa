import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Receipt, Key, Info, Coins, Plus, Minus, Copy, Check } from 'phosphor-react-native';

import { useAppTheme } from '../../src/theme/ThemeContext';
import { Text } from '../../src/components/atoms/Text';
import { Button } from '../../src/components/atoms/Button';
import { Input } from '../../src/components/atoms/Input';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';
import { NetworkSelector, Network } from '../../src/components/molecules/NetworkSelector';
import { useAlert } from '@/components/AlertContext';
import { billPaymentService } from '@/services/billpayment.service';

export default function BuyExamPinScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pin, setPin] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<Network[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [rawProvidersData, setRawProvidersData] = useState<any[]>([]);

  const [purchasedPins, setPurchasedPins] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setProvidersLoading(true);
      const res = await billPaymentService.getExamPinProviders();
      const rawProviders = res?.data || (res as any)?.response || res;
      
      if (Array.isArray(rawProviders) && rawProviders.length > 0) {
        setRawProvidersData(rawProviders);
        const mapped = rawProviders.map((p: any) => {
          let name = String(p.provider || p.name || p.title || p || '');
          let id = String(p.id || p.code || name.toLowerCase());
          let color = '#F43F5E'; // default rose/pink

          if (name.toLowerCase().includes('waec')) color = '#0A2540';
          else if (name.toLowerCase().includes('neco')) color = '#4F46E5';
          else if (name.toLowerCase().includes('nabteb')) color = '#10B981';

          return { id, name, color };
        });
        setProviders(mapped);
      } else {
        // Fallbacks
        setProviders([
          { id: 'waec', name: 'WAEC Result Checker', color: '#0A2540' },
          { id: 'neco', name: 'NECO Token', color: '#4F46E5' },
          { id: 'nabteb', name: 'NABTEB Pin', color: '#10B981' },
        ]);
      }
    } catch (e: any) {
      console.warn('Failed to load exam pin providers, using fallback:', e.message);
      setProviders([
        { id: 'waec', name: 'WAEC Result Checker', color: '#0A2540' },
        { id: 'neco', name: 'NECO Token', color: '#4F46E5' },
        { id: 'nabteb', name: 'NABTEB Pin', color: '#10B981' },
      ]);
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedProviderId || !pin) {
      showError('Please select a provider and enter your transaction PIN');
      return;
    }

    setIsLoading(true);
    setPurchasedPins([]);
    try {
      const response = await billPaymentService.purchaseExamPin({
        provider: selectedProviderId,
        quantity: quantity,
        pin,
      });

      if (response.success) {
        showSuccess('Purchase successful! Scroll down to copy your PINs.');
        
        // Handle variations of pin return format:
        // response.pins || response.pin || response.data?.pins || response.data?.pin
        const returned = (response as any)?.pins || (response as any)?.pin || response?.data?.pins || response?.data?.pin || (response as any)?.provider_response?.pins || (response as any)?.provider_response?.pin;
        let pinArray: any[] = [];
        
        if (Array.isArray(returned)) {
          pinArray = returned;
        } else if (typeof returned === 'string') {
          pinArray = [{ pin: returned }];
        } else if (returned && typeof returned === 'object') {
          pinArray = [returned];
        } else {
          // Fallback if no pins returned inside direct structure
          pinArray = [{ pin: 'Transaction Successful (Check dashboard transactions list for pins)' }];
        }
        
        setPurchasedPins(pinArray);
        setPin('');
      } else {
        showError(response.message || 'Exam PIN purchase failed');
      }
    } catch (error: any) {
      const ref = error?.errors?.reference || error?.reference || error?.data?.reference || error?.errors?.transaction?.reference_number;
      const refMsg = ref ? ` (Ref: ${ref})` : '';
      showError((error.message || 'Exam PIN purchase failed. Please try again.') + refMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProvider = rawProvidersData.find(p => String(p.id) === String(selectedProviderId));
  const singlePrice = selectedProvider ? parseFloat(selectedProvider.price || 0) : 0;
  const totalPrice = singlePrice * quantity;

  const copyToClipboard = (text: string, index: number) => {
    Clipboard.setString(text);
    setCopiedId(index);
    showSuccess('PIN copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Exam Result Checkers</Text>
        <Text variant="bodySmall" color="textSecondary">Purchase WAEC, NECO, and NABTEB pins instantly</Text>
      </View>

      <View style={styles.section}>
        {providersLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <NetworkSelector
            networks={providers}
            selectedId={selectedProviderId}
            onSelect={setSelectedProviderId}
            label="Select Exam Type"
          />
        )}
      </View>

      {selectedProvider && (
        <View style={[styles.priceTag, { backgroundColor: colors.primaryLight }]}>
          <Coins size={22} color={colors.primary} weight="duotone" />
          <View>
            <Text variant="bodyMedium" bold color="primary">₦{singlePrice.toLocaleString()} per PIN</Text>
            <Text variant="caption" color="textSecondary">Official provider cost rate</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          QUANTITY
        </Text>
        <View style={[styles.qtySelector, { borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.qtyBtn, { borderRightWidth: 1, borderRightColor: colors.border }]}
            onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
            disabled={quantity <= 1}
          >
            <Minus size={20} color={quantity <= 1 ? colors.textTertiary : colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.qtyValue}>
            <Text variant="headingSmall" bold>{quantity}</Text>
          </View>
          <TouchableOpacity
            style={[styles.qtyBtn, { borderLeftWidth: 1, borderLeftColor: colors.border }]}
            onPress={() => setQuantity(prev => Math.min(5, prev + 1))}
            disabled={quantity >= 5}
          >
            <Plus size={20} color={quantity >= 5 ? colors.textTertiary : colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text variant="caption" color="textSecondary" style={{ marginTop: 6, marginLeft: 4 }}>
          Maximum of 5 PINs per single purchase order.
        </Text>
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

      {totalPrice > 0 && selectedProviderId && (
        <View style={[styles.summary, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Exam Board</Text>
            <Text variant="bodyMedium" bold>{providers.find(p => p.id === selectedProviderId)?.name}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Quantity Selected</Text>
            <Text variant="bodyMedium" bold>{quantity}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Total Cost</Text>
            <Text variant="headingSmall" color="primary" bold>₦{totalPrice.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {purchasedPins.length === 0 && (
        <Button
          label={`Purchase ${quantity} PIN(s)`}
          onPress={handleBuy}
          loading={isLoading}
          style={styles.buyBtn}
          disabled={!selectedProviderId || pin.length < 4}
        />
      )}

      {purchasedPins.length > 0 && (
        <View style={styles.pinsSection}>
          <Text variant="labelMedium" color="success" bold style={styles.sectionTitle}>
            YOUR PURCHASED PINS:
          </Text>
          {purchasedPins.map((item, idx) => {
            const pinStr = typeof item === 'string' ? item : (item.pin || item.token || item.pin_code || '');
            const serialStr = item.serial || item.serial_number || item.serialNo || '';
            
            return (
              <View key={idx} style={[styles.pinCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  {serialStr ? (
                    <Text variant="caption" color="textSecondary">SERIAL: {serialStr}</Text>
                  ) : null}
                  <Text variant="headingSmall" bold style={{ color: colors.primary, marginTop: 4 }}>
                    {pinStr}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyBtn, { backgroundColor: colors.primaryLight }]}
                  onPress={() => copyToClipboard(pinStr, idx)}
                >
                  {copiedId === idx ? (
                    <Check size={20} color={colors.primary} weight="bold" />
                  ) : (
                    <Copy size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
          
          <Button
            label="Buy Another PIN"
            onPress={() => setPurchasedPins([])}
            style={{ marginTop: 16 }}
          />
        </View>
      )}

      <View style={[styles.info, { backgroundColor: colors.primaryLight, marginTop: 8 }]}>
        <Info size={20} color={colors.primary} weight="duotone" />
        <Text variant="caption" color="primary" style={{ flex: 1 }}>
          Exam checker cards are generated and delivered online instantly. Make sure to copy them down or check your transaction history logs.
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
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 16,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    height: 52,
    backgroundColor: 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    flex: 1,
    justifyContent: 'center',
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
  pinsSection: {
    marginVertical: 20,
    gap: 12,
  },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  copyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
});
