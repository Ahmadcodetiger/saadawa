import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Television, Key, Info, IdentificationCard, Phone, CheckCircle } from 'phosphor-react-native';

import { useAppTheme } from '../../src/theme/ThemeContext';
import { Text } from '../../src/components/atoms/Text';
import { Button } from '../../src/components/atoms/Button';
import { Input } from '../../src/components/atoms/Input';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';
import { NetworkSelector, Network } from '../../src/components/molecules/NetworkSelector';
import { SelectInput } from '../../src/components/molecules/SelectInput';
import { useAlert } from '@/components/AlertContext';
import { billPaymentService } from '@/services/billpayment.service';

export default function BuyCableScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [iucNumber, setIucNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  
  const [providers, setProviders] = useState<Network[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (selectedProviderId) {
      loadPlans();
      // Reset verification and plan when provider changes
      setVerifiedName(null);
      setSelectedPlanId(null);
    } else {
      setFilteredPlans([]);
    }
  }, [selectedProviderId]);

  const loadProviders = async () => {
    try {
      setProvidersLoading(true);
      const res = await billPaymentService.getCableProviders();
      const rawProviders = res?.data || res;
      
      if (Array.isArray(rawProviders) && rawProviders.length > 0) {
        const mapped = rawProviders.map((p: any) => {
          let name = String(p.provider || p.name || p.title || p || '');
          let id = String(p.id || p.code || name.toLowerCase());
          let color = '#7DC242'; // default green

          if (name.toLowerCase().includes('dstv')) color = '#009FDF';
          else if (name.toLowerCase().includes('gotv')) color = '#7DC242';
          else if (name.toLowerCase().includes('startimes')) color = '#E50012';

          return { id, name, color };
        });
        setProviders(mapped);
      } else {
        // Fallbacks
        setProviders([
          { id: 'dstv', name: 'DSTV', color: '#009FDF' },
          { id: 'gotv', name: 'GOtv', color: '#7DC242' },
          { id: 'startimes', name: 'Startimes', color: '#E50012' },
        ]);
      }
    } catch (e: any) {
      console.warn('Failed to load cable providers, using fallback:', e.message);
      setProviders([
        { id: 'dstv', name: 'DSTV', color: '#009FDF' },
        { id: 'gotv', name: 'GOtv', color: '#7DC242' },
        { id: 'startimes', name: 'Startimes', color: '#E50012' },
      ]);
    } finally {
      setProvidersLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await billPaymentService.getCableTVPlans();
      const rawPlans = res?.data || (res as any)?.response || res;

      if (Array.isArray(rawPlans)) {
        setAllPlans(rawPlans);
        filterPlansForProvider(rawPlans, selectedProviderId!);
      }
    } catch (e: any) {
      console.error('Failed to load cable plans:', e.message);
    } finally {
      setPlansLoading(false);
    }
  };

  const filterPlansForProvider = (plans: any[], providerId: string) => {
    const searchKey = providerId.toLowerCase();
    const filtered = plans.map((p: any) => {
      // Topupmate cable plans have: { id, name, price, description }
      return {
        id: String(p.id),
        name: p.name || 'Cable Plan',
        price: Number(p.price || 0),
        operator: String(p.operator || p.provider || p.category || '').toLowerCase(),
      };
    }).filter((p: any) => {
      return p.operator.includes(searchKey) || p.name.toLowerCase().includes(searchKey) || p.id.toLowerCase().includes(searchKey);
    });
    setFilteredPlans(filtered);
  };

  const handleVerify = async () => {
    if (!selectedProviderId || !iucNumber) {
      showError('Please select a provider and enter Smartcard/IUC number');
      return;
    }

    setIsVerifying(true);
    setVerifiedName(null);
    try {
      const res = await billPaymentService.verifyCableAccount(selectedProviderId, iucNumber);
      // Backend returns Customer_Name or response.Customer_Name
      const name = (res as any)?.Customer_Name || res?.data?.Customer_Name || res?.data?.customer_name || (res as any)?.response?.Customer_Name;
      if (name) {
        setVerifiedName(name);
        showSuccess(`Account verified successfully: ${name}`);
      } else {
        showError('Could not verify owner. Please confirm IUC number.');
      }
    } catch (e: any) {
      showError(e.message || 'Account verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedProviderId || !iucNumber || !selectedPlanId || !phoneNumber || !pin) {
      showError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await billPaymentService.purchaseCableTV({
        provider: selectedProviderId,
        iucnumber: iucNumber,
        plan: selectedPlanId,
        subtype: 'renew',
        phone: phoneNumber.replace(/\D/g, ''),
        pin,
      });

      if (response.success) {
        showSuccess(`Cable subscription successful!`);
        setTimeout(() => router.back(), 2000);
      } else {
        showError(response.message || 'Subscription purchase failed');
      }
    } catch (error: any) {
      const ref = error?.errors?.reference || error?.reference || error?.data?.reference || error?.errors?.transaction?.reference_number;
      const refMsg = ref ? ` (Ref: ${ref})` : '';
      showError((error.message || 'Subscription failed. Please try again.') + refMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = filteredPlans.find(p => p.id === selectedPlanId);

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Cable TV Subscription</Text>
        <Text variant="bodySmall" color="textSecondary">Renew DSTV, GOtv, Startimes & more instantly</Text>
      </View>

      <View style={styles.section}>
        {providersLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <NetworkSelector
            networks={providers}
            selectedId={selectedProviderId}
            onSelect={setSelectedProviderId}
            label="Select Provider"
          />
        )}
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          SMARTCARD / IUC NUMBER
        </Text>
        <View style={styles.verifyContainer}>
          <View style={{ flex: 1 }}>
            <Input
              label="Enter Account / IUC Number"
              value={iucNumber}
              onChangeText={(v) => {
                setIucNumber(v.replace(/\D/g, ''));
                setVerifiedName(null);
              }}
              keyboardType="numeric"
              rightIcon={<IdentificationCard size={20} color={colors.textTertiary} />}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              { backgroundColor: iucNumber.length > 5 ? colors.primary : colors.surfaceElevated }
            ]}
            onPress={handleVerify}
            disabled={isVerifying || iucNumber.length <= 5}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text variant="bodyMedium" bold style={{ color: iucNumber.length > 5 ? 'white' : colors.textTertiary }}>
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

      {selectedProviderId && (
        <View style={styles.section}>
          <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
            SELECT PACKAGE
          </Text>
          {plansLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
          ) : filteredPlans.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Television size={36} color={colors.textTertiary} />
              <Text variant="bodySmall" color="textSecondary" style={{ marginTop: 8 }}>
                No packages found for this provider.
              </Text>
            </View>
          ) : (
            <SelectInput
              label="Cable Package"
              placeholder="Choose a plan"
              value={selectedPlanId}
              options={filteredPlans.map(p => ({
                label: p.name,
                value: p.id,
                description: `Price: ₦${p.price.toLocaleString()}`
              }))}
              onSelect={setSelectedPlanId}
              leftIcon={<Television size={20} color={colors.textTertiary} />}
            />
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          ALERT PHONE NUMBER
        </Text>
        <Input
          label="Phone number for receipt"
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

      {selectedPlan && (
        <View style={[styles.summary, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Provider</Text>
            <Text variant="bodyMedium" bold>{providers.find(p => p.id === selectedProviderId)?.name}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Customer Name</Text>
            <Text variant="bodyMedium" bold>{verifiedName || '-'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Plan Package</Text>
            <Text variant="bodyMedium" bold>{selectedPlan.name}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall" color="textSecondary">Total Charged</Text>
            <Text variant="headingSmall" color="primary" bold>₦{selectedPlan.price.toLocaleString()}</Text>
          </View>
        </View>
      )}

      <Button
        label="Subscribe Now"
        onPress={handleBuy}
        loading={isLoading}
        style={styles.buyBtn}
        disabled={!selectedProviderId || !iucNumber || !selectedPlanId || !phoneNumber || pin.length < 4 || !verifiedName}
      />

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
        <Info size={20} color={colors.primary} weight="duotone" />
        <Text variant="caption" color="primary" style={{ flex: 1 }}>
          Verify the smartcard holder's name before subscribing. Payments are irreversible once dispatched.
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
