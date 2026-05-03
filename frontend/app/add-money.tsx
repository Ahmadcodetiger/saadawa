import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { 
  PlusCircle, 
  Copy, 
  ShareNetwork, 
  Info 
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { useAlert } from '@/components/AlertContext';
import { authService } from '@/services/auth.service';
import { paymentPointService } from '@/services/paymentpoint.service';

export default function AddMoneyScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { showSuccess, showError, showInfo } = useAlert();

  const [virtualAccount, setVirtualAccount] = useState<any | null>(null);
  const [isLoadingVirtualAccount, setIsLoadingVirtualAccount] = useState(true);
  const [isCreatingVirtualAccount, setIsCreatingVirtualAccount] = useState(false);

  useEffect(() => {
    loadVirtualAccount();
  }, []);

  const loadVirtualAccount = useCallback(async () => {
    try {
      setIsLoadingVirtualAccount(true);
      const response = await paymentPointService.getVirtualAccount();
      
      if (!response || (typeof response === 'object' && 'exists' in response && !response.exists)) {
        setVirtualAccount(null);
        return;
      }
      
      const responseData = (response as any)?.data?.data || (response as any)?.data || response;
      
      if (responseData && (!('exists' in responseData) || responseData.exists !== false)) {
        const accNo = responseData?.accountNumber || responseData?.account_number || responseData?.virtualAccountNo;
        setVirtualAccount({
          account_number: accNo || 'Processing...',
          account_name: responseData?.accountName || responseData?.account_name || responseData?.customerName || 'Processing...',
          bank_name: responseData?.bankName || responseData?.bank_name || 'PALMPAY',
          status: responseData?.status || 'active',
        });
      } else {
        setVirtualAccount(null);
      }
    } catch (error) {
      console.error('Error loading virtual account:', error);
    } finally {
      setIsLoadingVirtualAccount(false);
    }
  }, []);

  const handleCreateVirtualAccount = async () => {
    try {
      setIsCreatingVirtualAccount(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        showError('Please login again');
        return;
      }

      await paymentPointService.createVirtualAccount({
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phoneNumber: user.phone_number,
      });

      showSuccess('Virtual account generated!');
      loadVirtualAccount();
    } catch (error: any) {
      showError(error.message || 'Failed to create account');
    } finally {
      setIsCreatingVirtualAccount(false);
    }
  };



  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    showSuccess(`${label} copied!`);
  };

  const shareDetails = async () => {
    if (!virtualAccount) return;
    const message = `Payment Details:\nBank: ${virtualAccount.bank_name}\nAcc No: ${virtualAccount.account_number}\nName: ${virtualAccount.account_name}`;
    await Share.share({ message });
  };



  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Add Money</Text>
        <Text variant="bodySmall" color="textSecondary">Choose how you want to fund your wallet</Text>
      </View>

      {/* ATM Card Section */}
      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>YOUR VIRTUAL ACCOUNT</Text>
        {isLoadingVirtualAccount ? (
            <View style={[styles.cardPlaceholder, { backgroundColor: colors.surface }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        ) : virtualAccount ? (
            <View style={[styles.atmCard, { backgroundColor: colors.primary }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.chip} />
                    <Text variant="bodyMedium" bold style={{ color: 'white' }}>{virtualAccount.bank_name}</Text>
                </View>
                
                <View style={styles.cardBody}>
                    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>ACCOUNT NUMBER</Text>
                    <View style={styles.numberRow}>
                        <Text variant="headingMedium" bold style={{ color: 'white', letterSpacing: 2 }}>
                            {virtualAccount.account_number}
                        </Text>
                        <TouchableOpacity onPress={() => copyToClipboard(virtualAccount.account_number, 'Account Number')}>
                            <Copy size={20} color="white" weight="bold" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>ACCOUNT NAME</Text>
                        <Text variant="bodyMedium" bold style={{ color: 'white' }}>{virtualAccount.account_name}</Text>
                    </View>
                    <TouchableOpacity style={styles.shareBtn} onPress={shareDetails}>
                        <ShareNetwork size={18} color="white" weight="bold" />
                    </TouchableOpacity>
                </View>
            </View>
        ) : (
            <TouchableOpacity 
                style={[styles.noAccount, { borderColor: colors.border, backgroundColor: colors.surface }]} 
                onPress={handleCreateVirtualAccount}
                disabled={isCreatingVirtualAccount}
            >
                {isCreatingVirtualAccount ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <>
                        <PlusCircle size={32} color={colors.primary} weight="duotone" />
                        <Text variant="bodyMedium" bold color="primary">Generate Dedicated Account</Text>
                        <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
                            Receive instant deposits through your personal account number
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        )}
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
         <Info size={20} color={colors.primary} weight="duotone" />
         <Text variant="caption" color="primary" style={{ flex: 1 }}>
            Any transfer made to this account number will automatically fund your wallet instantly.
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
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  atmCard: {
    padding: 24,
    borderRadius: 24,
    height: 200,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  cardBody: {
    marginTop: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPlaceholder: {
    height: 200,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccount: {
    height: 200,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  amtChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodList: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    marginTop: 12,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
});