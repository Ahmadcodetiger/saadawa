import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Modal, FlatList, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, Key, Info, WifiHigh, AddressBook } from 'phosphor-react-native';
import * as Contacts from 'expo-contacts';

import { useAppTheme } from '../../src/theme/ThemeContext';
import { Text } from '../../src/components/atoms/Text';
import { Button } from '../../src/components/atoms/Button';
import { Input } from '../../src/components/atoms/Input';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';
import { NetworkSelector, Network } from '../../src/components/molecules/NetworkSelector';
import { SelectInput } from '../../src/components/molecules/SelectInput';
import { useAlert } from '@/components/AlertContext';
import { billPaymentService } from '@/services/billpayment.service';

export default function BuyDataScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Contact Picker States
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [contactsLoading, setContactsLoading] = useState(false);

  const handlePickContact = async () => {
    if (Platform.OS === 'web') {
      showError('Contact picker is only supported on mobile devices.');
      return;
    }
    
    setContactsLoading(true);
    setContactsError('');
    setContactsModalVisible(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        
        if (data && data.length > 0) {
          const formatted = data.map((c: any) => {
            const rawPhone = c.phoneNumbers?.[0]?.number || '';
            return {
              id: c.id,
              name: c.name || 'No Name',
              phoneNumber: rawPhone,
            };
          }).filter(c => !!c.phoneNumber);
          
          setContacts(formatted);
        } else {
          setContacts([]);
          setContactsError('No contacts found on your device.');
        }
      } else {
        setContactsError('Permission to access contacts was denied.');
        showError('Permission to access contacts was denied.');
      }
    } catch (e: any) {
      console.warn('Failed to load contacts:', e);
      setContactsError('Failed to load contacts from your device.');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleSelectContact = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('234') && clean.length > 10) {
      clean = '0' + clean.slice(3);
    }
    setPhoneNumber(clean.slice(0, 11));
    setContactsModalVisible(false);
    setSearchQuery('');
  };

  const filteredContacts = contacts.filter(c => {
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.phoneNumber.replace(/\D/g, '').includes(query);
  });
  
  const [networks, setNetworks] = useState<Network[]>([
    { id: 'mtn', name: 'MTN', color: '#FFCC00' },
    { id: 'glo', name: 'Glo', color: '#00A95C' },
    { id: 'airtel', name: 'Airtel', color: '#FF0000' },
    { id: '9mobile', name: '9mobile', color: '#00693E' },
  ]);
  
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Auto-fetch plans when network changes
  useEffect(() => {
    if (selectedNetworkId) {
      loadPlans(selectedNetworkId);
    } else {
      setPlans([]);
    }
  }, [selectedNetworkId]);

  const loadPlans = async (network: string) => {
    try {
      setPlansLoading(true);
      setPlans([]);
      const res = await billPaymentService.getDataPlans(network);
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((p: any) => ({
          id: String(p.id),
          name: p.name || p.data_amount || 'Data Plan',
          validity: p.validity || '30 Days',
          price: Number(p.price || 0),
        })).filter(p => p.price > 0); // only show plans with a price
        setPlans(mapped);
      } else {
        console.warn('No plans returned for network:', network);
      }
    } catch (e: any) {
      console.error('Failed to load plans:', e.message);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!phoneNumber || !selectedNetworkId || !selectedPlanId || !pin) {
      showError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await billPaymentService.purchaseData({
        network: selectedNetworkId,
        phone: phoneNumber.replace(/\D/g, ''),
        plan: selectedPlanId,
        ported_number: true,
        pin,
      });

      if (response.success) {
        showSuccess(`Data purchase successful!`);
        setTimeout(() => router.back(), 2000);
      } else {
        showError(response.message || 'Failed to purchase data');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to purchase data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Buy Data</Text>
        <Text variant="bodySmall" color="textSecondary">Cheap and fast data for all networks</Text>
      </View>

      <View style={styles.section}>
        <NetworkSelector 
            networks={networks}
            selectedId={selectedNetworkId}
            onSelect={setSelectedNetworkId}
            label="Service Provider"
        />
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>DESTINATION</Text>
        <Input 
            label="Receiver phone number"
            value={phoneNumber}
            onChangeText={(v: string) => setPhoneNumber(v.replace(/\D/g, '').slice(0, 11))}
            keyboardType="phone-pad"
            maxLength={11}
            rightIcon={
              <TouchableOpacity onPress={handlePickContact} style={{ padding: 4 }}>
                <AddressBook size={22} color={colors.primary} weight="duotone" />
              </TouchableOpacity>
            }
        />
      </View>

      {selectedNetworkId && (
        <View style={styles.section}>
            <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>SELECT DATA PLAN</Text>
            {plansLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
            ) : plans.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <WifiHigh size={40} color={colors.textTertiary} />
                    <Text variant="bodySmall" color="textSecondary" style={{ marginTop: 8 }}>No data plans available for this network</Text>
                </View>
            ) : (
                <SelectInput
                    label="Data Plan"
                    placeholder="Select a data plan"
                    value={selectedPlanId}
                    options={plans.map(p => ({
                        label: `${p.name} - ${p.validity}`,
                        value: p.id,
                        description: `Price: ₦${p.price.toLocaleString()}`
                    }))}
                    onSelect={setSelectedPlanId}
                    leftIcon={<WifiHigh size={20} color={colors.textTertiary} />}
                />
            )}
        </View>
      )}

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

      {selectedPlan && (
          <View style={[styles.summary, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.summaryItem}>
                  <Text variant="bodySmall" color="textSecondary">Network</Text>
                  <Text variant="bodyMedium" bold>{networks.find(n => n.id === selectedNetworkId)?.name}</Text>
              </View>
              <View style={styles.summaryItem}>
                  <Text variant="bodySmall" color="textSecondary">Package</Text>
                  <Text variant="bodyMedium" bold>{selectedPlan.name}</Text>
              </View>
              <View style={styles.summaryItem}>
                  <Text variant="bodySmall" color="textSecondary">Recipient</Text>
                  <Text variant="bodyMedium" bold>{phoneNumber || '-'}</Text>
              </View>
              <View style={styles.summaryItem}>
                  <Text variant="bodySmall" color="textSecondary">Total Cost</Text>
                  <Text variant="headingSmall" color="primary" bold>₦{selectedPlan.price.toLocaleString()}</Text>
              </View>
          </View>
      )}

      <Button 
        label="Purchase Data"
        onPress={handleBuy}
        loading={isLoading}
        style={styles.buyBtn}
        disabled={!phoneNumber || !selectedNetworkId || !selectedPlanId || pin.length < 4}
      />

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
         <Info size={20} color={colors.primary} weight="duotone" />
         <Text variant="caption" color="primary" style={{ flex: 1 }}>
            Data is delivered instantly to the phone number provided. No refunds for wrong numbers.
         </Text>
      </View>

      <Modal
        visible={contactsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text variant="headingSmall" bold>Select Contact</Text>
              <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
                <Text variant="bodyMedium" color="primary" bold>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={{ marginBottom: 16 }}
            />

            {contactsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
            ) : contactsError ? (
              <View style={styles.emptyContainer}>
                <Text variant="bodyMedium" color="textSecondary">{contactsError}</Text>
              </View>
            ) : filteredContacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text variant="bodyMedium" color="textSecondary">No contacts found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.contactItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectContact(item.phoneNumber)}
                  >
                    <View style={[styles.contactAvatar, { backgroundColor: colors.primaryLight }]}>
                      <Text variant="bodyMedium" bold color="primary">
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" bold>{item.name}</Text>
                      <Text variant="caption" color="textSecondary">{item.phoneNumber}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 350 }}
              />
            )}
          </View>
        </View>
      </Modal>

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
  plansContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    minHeight: '60%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 16,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});
