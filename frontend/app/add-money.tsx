import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PlusCircle,
  Copy,
  ShareNetwork,
  CheckCircle,
  Info,
  IdentificationCard,
  X,
  ArrowsClockwise,
  Check,
  WifiHigh,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { useAlert } from '@/components/AlertContext';
import { authService } from '@/services/auth.service';
import { paymentPointService } from '@/services/paymentpoint.service';

type IdType = 'bvn' | 'nin';

interface NormalizedAccount {
  account_number: string;
  account_name: string;
  bank_name: string;
  status: string;
}

export default function AddMoneyScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [virtualAccounts, setVirtualAccounts] = useState<NormalizedAccount[]>([]);
  const [isLoadingVirtualAccount, setIsLoadingVirtualAccount] = useState(true);
  const [isCreatingVirtualAccount, setIsCreatingVirtualAccount] = useState(false);

  // KYC Modal state
  const [showKycModal, setShowKycModal] = useState(false);
  const [idType, setIdType] = useState<IdType>('bvn');
  const [idNumber, setIdNumber] = useState('');
  const [idNumberError, setIdNumberError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMode, setSyncMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadVirtualAccount();
  }, []);

  const loadVirtualAccount = useCallback(async () => {
    try {
      setIsLoadingVirtualAccount(true);
      const response = await paymentPointService.getVirtualAccount();

      if (!response || (typeof response === 'object' && 'exists' in response && !response.exists)) {
        setVirtualAccounts([]);
        return;
      }

      const responseData = (response as any)?.data?.data || (response as any)?.data || response;

      if (responseData && (!('exists' in responseData) || responseData.exists !== false)) {
        const accounts = responseData?.accounts || [
          {
            accountNumber: responseData?.accountNumber || responseData?.account_number || responseData?.virtualAccountNo,
            accountName: responseData?.accountName || responseData?.account_name || responseData?.customerName,
            bankName: responseData?.bankName || responseData?.bank_name || 'PalmPay',
          }
        ];
        
        const normalizedAccounts = accounts.map((acc: any) => ({
          account_number: (acc.accountNumber || acc.account_number || '').trim(),
          account_name: (acc.accountName || acc.account_name || responseData?.accountName || responseData?.account_name || '').trim(),
          bank_name: (acc.bankName || acc.bank_name || 'PalmPay').replace(/\s*\(mock\)/gi, '').trim(),
          status: acc.status || responseData?.status || 'active',
        }));

        setVirtualAccounts(normalizedAccounts);
      } else {
        setVirtualAccounts([]);
      }
    } catch (error) {
      console.error('Error loading virtual account:', error);
    } finally {
      setIsLoadingVirtualAccount(false);
    }
  }, []);

  const validateIdNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return `${idType.toUpperCase()} is required`;
    if (digits.length !== 11) return `${idType.toUpperCase()} must be exactly 11 digits`;
    return '';
  };

  const handleIdNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setIdNumber(digits);
    if (idNumberError) setIdNumberError('');
  };

  const handleOpenKycModal = () => {
    setSyncMode(false);
    setIdNumber('');
    setIdNumberError('');
    setShowKycModal(true);
  };

  const handleKycSubmit = async () => {
    const error = validateIdNumber(idNumber);
    if (error) {
      setIdNumberError(error);
      return;
    }

    setShowKycModal(false);
    if (syncMode) {
      await handleSync(idType, idNumber.replace(/\D/g, ''));
      setSyncMode(false);
    } else {
      await handleCreateVirtualAccount(idType, idNumber.replace(/\D/g, ''));
    }
  };

  const handleCreateVirtualAccount = async (kycIdType: IdType, kycIdNumber: string) => {
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
        idType: kycIdType,
        idNumber: kycIdNumber,
      });

      showSuccess('Virtual account generated!');
      loadVirtualAccount();
    } catch (error: any) {
      showError(error.message || 'Failed to create account');
    } finally {
      setIsCreatingVirtualAccount(false);
    }
  };

  const handleOpenSyncModal = () => {
    setSyncMode(true);
    setIdNumber('');
    setIdNumberError('');
    setShowKycModal(true);
  };

  const handleSync = async (kycIdType: IdType, kycIdNumber: string) => {
    try {
      setIsSyncing(true);
      const result = await paymentPointService.syncVirtualAccounts({
        idType: kycIdType,
        idNumber: kycIdNumber,
      });

      if (result.data?.errors?.length > 0) {
        showError(result.data.errors.join('\n'));
      } else {
        showSuccess(result.message || 'Accounts synced!');
      }
      loadVirtualAccount();
    } catch (error: any) {
      showError(error.message || 'Failed to sync accounts');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatAccountNumber = (num: string) => {
    if (!num) return '';
    const clean = num.replace(/\s/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 3)}  ${clean.slice(3, 6)}  ${clean.slice(6)}`;
    }
    return clean;
  };

  const copyToClipboard = async (text: string, label: string, index?: number) => {
    await Clipboard.setStringAsync(text);
    
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        console.log('Haptics failed', err);
      }
    }

    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } else {
      showSuccess(`${label} copied!`);
    }
  };

  const copyAllCardDetails = async (acc: NormalizedAccount, index: number) => {
    const text = `Saadawa Wallet Funding:\nBank Name: ${acc.bank_name}\nAccount Number: ${acc.account_number}\nAccount Name: ${acc.account_name}`;
    await Clipboard.setStringAsync(text);
    
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        console.log('Haptics failed', err);
      }
    }
    
    showSuccess('All account details copied!');
  };

  const shareDetails = async (acc: NormalizedAccount) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (err) {
        console.log('Haptics failed', err);
      }
    }
    const message = `Payment Details:\nBank: ${acc.bank_name}\nAcc No: ${acc.account_number}\nName: ${acc.account_name}`;
    await Share.share({ message });
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Add Money</Text>
        <Text variant="bodySmall" color="textSecondary" style={{ marginTop: 4 }}>
          Fund your wallet instantly via direct bank transfer
        </Text>
      </View>

      {/* Virtual Account Section */}
      <View style={styles.section}>
        {isLoadingVirtualAccount ? (
          <View style={[styles.cardPlaceholder, { backgroundColor: colors.surface }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : virtualAccounts.length > 0 ? (
          <View style={styles.cardsContainer}>
            <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
              YOUR DEDICATED ACCOUNTS
            </Text>
            {virtualAccounts.map((acc, index) => {
              const bankLower = acc.bank_name.toLowerCase();
              const isPalmPay = bankLower.includes('palm');
              const isOPay = bankLower.includes('opay') || bankLower.includes('o pay');
              const isWema = bankLower.includes('wema');
              const isProvidus = bankLower.includes('providus');

              // Dynamic gradients for premium look
              let cardColors: [string, string, string] | [string, string];
              let borderStyle = {};
              
              if (isPalmPay) {
                cardColors = ['#4F46E5', '#3B82F6', '#1E3A8A']; // Cobalt Blue to Purple/Navy
              } else if (isOPay) {
                cardColors = ['#03D186', '#059669', '#022C22']; // Bright Teal to Dark Green
              } else if (isWema) {
                cardColors = ['#9C27B0', '#E91E63', '#4A148C']; // Violet/Pink to Deep Wema Purple
              } else if (isProvidus) {
                cardColors = ['#1F2937', '#111827', '#030712']; // Dark charcoal dark grey/black
                borderStyle = { borderWidth: 1.5, borderColor: '#D97706' }; // Gold border accent
              } else {
                cardColors = ['#64748B', '#334155', '#0F172A']; // Sleek metallic slate
              }

              const isCopied = copiedIndex === index;

              return (
                <View key={index} style={[styles.cardOuterContainer, borderStyle]}>
                  <LinearGradient
                    colors={cardColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.atmCard}
                  >
                    {/* Mesh texture & shine overlays */}
                    <View style={styles.radialShine} />
                    <View style={[styles.meshBlob, { top: -20, right: -10, width: 100, height: 100 }]} />
                    <View style={[styles.meshBlob, { bottom: -30, left: 10, width: 140, height: 140 }]} />
                    
                    {/* Glossy overlay effect for premium look */}
                    <View style={styles.cardGloss} />
                    
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {/* Gold Metallic EMV Chip */}
                        <View style={styles.chipContainer}>
                          <LinearGradient
                            colors={['#F5D061', '#E6AF2E', '#CF9911']}
                            style={styles.chipInner}
                          >
                            <View style={styles.chipLineH} />
                            <View style={[styles.chipLineH, { top: '50%' }]} />
                            <View style={[styles.chipLineH, { top: '80%' }]} />
                            <View style={styles.chipLineV} />
                            <View style={[styles.chipLineV, { left: '60%' }]} />
                          </LinearGradient>
                        </View>
                        
                        {/* Wireless Contactless Signal Icon */}
                        <View style={{ transform: [{ rotate: '90deg' }], opacity: 0.7 }}>
                          <WifiHigh size={18} color="#FFFFFF" weight="bold" />
                        </View>
                      </View>

                      <View style={styles.bankNameBadge}>
                        <Text variant="bodyMedium" bold style={{ color: '#FFFFFF', letterSpacing: 0.5 }}>
                          {acc.bank_name}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="caption" style={styles.cardLabel}>ACCOUNT NUMBER</Text>
                        {isCopied && (
                          <Text variant="caption" bold style={styles.copiedBadgeText}>
                            COPIED!
                          </Text>
                        )}
                      </View>
                      <View style={styles.numberRow}>
                        <Text variant="headingMedium" bold style={styles.accountNumberText}>
                          {formatAccountNumber(acc.account_number)}
                        </Text>
                        <TouchableOpacity
                          style={[styles.copyIconBtn, isCopied && { backgroundColor: 'rgba(16, 185, 129, 0.4)' }]}
                          onPress={() => copyToClipboard(acc.account_number, `${acc.bank_name} account number`, index)}
                        >
                          {isCopied ? (
                            <Check size={18} color="#FFFFFF" weight="bold" />
                          ) : (
                            <Copy size={18} color="#FFFFFF" weight="bold" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={{ flex: 1 }}>
                        <Text variant="caption" style={styles.cardLabel}>ACCOUNT NAME</Text>
                        <Text variant="bodyMedium" bold numberOfLines={1} style={{ color: '#FFFFFF' }}>
                          {acc.account_name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => shareDetails(acc)}
                      >
                        <ShareNetwork size={18} color="#FFFFFF" weight="bold" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>

                  {/* Premium Action Row Below Card */}
                  <View style={[styles.cardActionRow, { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <TouchableOpacity 
                      style={styles.actionRowBtn}
                      onPress={() => copyToClipboard(acc.account_number, `${acc.bank_name} account number`, index)}
                    >
                      <Copy size={16} color={colors.textSecondary} />
                      <Text variant="bodySmall" medium color="textSecondary">Copy Number</Text>
                    </TouchableOpacity>
                    <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity 
                      style={styles.actionRowBtn}
                      onPress={() => copyAllCardDetails(acc, index)}
                    >
                      <CheckCircle size={16} color={colors.textSecondary} />
                      <Text variant="bodySmall" medium color="textSecondary">Copy All Info</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Sync Button */}
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleOpenSyncModal}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <ArrowsClockwise size={20} color={colors.primary} weight="bold" />
              )}
              <Text variant="bodySmall" bold color="primary">
                {isSyncing ? 'Syncing...' : 'Sync Missing Banks'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.noAccount, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleOpenKycModal}
            disabled={isCreatingVirtualAccount}
          >
            {isCreatingVirtualAccount ? (
              <>
                <ActivityIndicator color={colors.primary} />
                <Text variant="bodyMedium" bold color="primary">Creating your account…</Text>
              </>
            ) : (
              <>
                <PlusCircle size={32} color={colors.primary} weight="duotone" />
                <Text variant="bodyMedium" bold color="primary">Generate Dedicated Accounts</Text>
                <Text variant="caption" color="textSecondary" style={{ textAlign: 'center', paddingHorizontal: 16 }}>
                  Verify your identity (BVN/NIN) to automatically get your PalmPay and OPay personal accounts
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
        <Info size={20} color={colors.primary} weight="duotone" />
        <Text variant="caption" color="primary" style={{ flex: 1 }}>
          Dedicated account transfers are processed instantly by PaymentPoint. Make a transfer to any of the virtual accounts above to fund your wallet.
        </Text>
      </View>

      <View style={{ height: 100 }} />

      {/* ─── KYC Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={showKycModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKycModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconBg, { backgroundColor: colors.primaryLight }]}>
                  <IdentificationCard size={28} color={colors.primary} weight="duotone" />
                </View>
                <TouchableOpacity onPress={() => setShowKycModal(false)} style={styles.modalClose}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text variant="headingSmall" bold style={{ marginBottom: 4 }}>Identity Verification</Text>
              <Text variant="bodySmall" color="textSecondary" style={{ marginBottom: 24 }}>
                Required by CBN regulations. Your data is encrypted and never shared.
              </Text>

              {/* ID Type Toggle */}
              <Text variant="labelMedium" color="textSecondary" medium style={styles.modalLabel}>ID TYPE</Text>
              <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {(['bvn', 'nin'] as IdType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.toggleBtn,
                      idType === type && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => { setIdType(type); setIdNumber(''); setIdNumberError(''); }}
                  >
                    <Text
                      variant="labelMedium"
                      bold={idType === type}
                      style={{ color: idType === type ? 'white' : colors.textSecondary }}
                    >
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ID Number Input */}
              <View style={{ marginTop: 16 }}>
                <Input
                  label={`Enter your ${idType.toUpperCase()} (11 digits)`}
                  value={idNumber}
                  onChangeText={handleIdNumberChange}
                  keyboardType="number-pad"
                  maxLength={11}
                  rightIcon={
                    idNumber.length === 11
                      ? <CheckCircle size={20} color={colors.success} weight="fill" />
                      : undefined
                  }
                />
                {idNumberError ? (
                  <Text variant="caption" style={{ color: colors.error, marginTop: 4, marginLeft: 4 }}>
                    {idNumberError}
                  </Text>
                ) : (
                  <Text variant="caption" color="textTertiary" style={{ marginTop: 4, marginLeft: 4 }}>
                    {idNumber.length}/11 digits
                  </Text>
                )}
              </View>

              {/* Security note */}
              <View style={[styles.securityNote, { backgroundColor: colors.primaryLight }]}>
                <Info size={16} color={colors.primary} weight="duotone" />
                <Text variant="caption" color="primary" style={{ flex: 1 }}>
                  Your {idType.toUpperCase()} is used only for regulatory compliance and is securely encrypted.
                </Text>
              </View>

              {/* Actions */}
              <Button
                label={syncMode ? "Verify & Sync Accounts" : "Verify & Generate Account"}
                onPress={handleKycSubmit}
                style={{ marginTop: 20 }}
                disabled={idNumber.length !== 11}
              />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowKycModal(false)}>
                <Text variant="bodySmall" color="textSecondary">Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  cardsContainer: {
    gap: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  cardOuterContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  atmCard: {
    padding: 24,
    height: 190,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  radialShine: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  meshBlob: {
    position: 'absolute',
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ skewY: '-10deg' }, { scaleY: 1.5 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipContainer: {
    width: 38,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  chipInner: {
    flex: 1,
    padding: 4,
  },
  chipLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    top: '25%',
  },
  chipLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    left: '30%',
  },
  copiedBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bankNameBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  cardBody: {
    marginTop: 8,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountNumberText: {
    color: '#FFFFFF',
    letterSpacing: 2,
    fontSize: 22,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  actionRowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  actionDivider: {
    width: 1,
    height: 20,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLabel: {
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    margin: 3,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
});