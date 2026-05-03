import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { 
  PhoneCall, 
  WifiHigh, 
  Television, 
  Lightning, 
  Bell,
  Eye,
  EyeSlash,
  RocketLaunch
} from 'phosphor-react-native';

import { useAppTheme } from '../../src/theme/ThemeContext';
import { Text } from '../../src/components/atoms/Text';
import { Button } from '../../src/components/atoms/Button';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';
import { WalletCard } from '../../src/components/molecules/WalletCard';
import { ServiceItem } from '../../src/components/molecules/ServiceItem';
import { TransactionRow } from '../../src/components/molecules/TransactionRow';
import { Skeleton } from '../../src/components/atoms/LayoutAtoms';

import { userService } from '@/services/user.service';
import { walletService, WalletData } from '@/services/wallet.service';
import { authService } from '@/services/auth.service';
import { notificationsService } from '@/services/notifications.service';
import { paymentPointService } from '@/services/paymentpoint.service';
import { transactionService, Transaction as ApiTransaction } from '@/services/transaction.service';

import AdminInfoModal from '../../src/components/organisms/AdminInfoModal';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, theme, mode, isDark } = useAppTheme();
  
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [virtualAccount, setVirtualAccount] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<ApiTransaction[]>([]);
  const [adminInfo, setAdminInfo] = useState<{ id: string; title: string; message: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        await Promise.all([
          loadUserProfile(),
          loadWalletData(),
          loadNotificationsData(),
          loadVirtualAccount(),
          loadRecentTransactions(),
        ]);
      } else {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const response = await transactionService.getTransactions(1, 4);
      if (response.success && Array.isArray(response.data)) {
        setRecentTransactions(response.data);
      }
    } catch (error) {
      console.log('Error loading recent transactions:', error);
    }
  };

  const loadVirtualAccount = async () => {
    try {
      const response = await paymentPointService.getVirtualAccount();
      if (response) {
        const responseData = (response as any)?.data?.data || response;
        if (responseData && (responseData.accountNumber || responseData.account_number)) {
            setVirtualAccount({
                account_number: responseData.accountNumber || responseData.account_number || responseData.virtualAccountNo,
                account_name: responseData.accountName || responseData.account_name || responseData.customerName,
                bank_name: responseData.bankName || responseData.bank_name || 'PALMPAY',
            });
        }
      }
    } catch (error) {
      console.log('Error loading virtual account on dashboard:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await userService.getProfile();
      if (response.success) setUser(response.data);
    } catch (error) {
       const userData = await authService.getCurrentUser();
       setUser(userData);
    }
  };

  const loadWalletData = async () => {
    try {
      const response = await walletService.getWallet();
      if (response.success) setWallet(response.data);
    } catch (error) {
      setWallet(null);
    }
  };

  const loadNotificationsData = async () => {
    try {
      const response = await notificationsService.getNotifications(1, 20);
      const notifs = response?.data || [];
      const unread = notifs.filter(n => !n.is_read);
      setUnreadCount(unread.length);

      const dismissedRaw = await AsyncStorage.getItem('dismissedAlerts');
      const dismissedAlerts = dismissedRaw ? JSON.parse(dismissedRaw) : [];

      const unreadAlert = unread.find(n => 
         (n.type === 'system' || n.type === 'alert' || n.type === 'promotion' || (n.type as string) === 'broadcast') 
         && !dismissedAlerts.includes(n._id)
      );
      if (unreadAlert) {
        setAdminInfo({
          id: unreadAlert._id,
          title: unreadAlert.title,
          message: unreadAlert.message
        });
      }
    } catch (error) {
      console.log('Error loading notifications data:', error);
    }
  };

  const handleCloseAdminInfo = async () => {
    if (adminInfo?.id) {
       try {
         const dismissedRaw = await AsyncStorage.getItem('dismissedAlerts');
         const dismissedAlerts = dismissedRaw ? JSON.parse(dismissedRaw) : [];
         dismissedAlerts.push(adminInfo.id);
         await AsyncStorage.setItem('dismissedAlerts', JSON.stringify(dismissedAlerts));

         await notificationsService.markAsRead(adminInfo.id);
         setUnreadCount(prev => Math.max(0, prev - 1));
       } catch (error) {
         // Soft fail on api
       }
    }
    setAdminInfo(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const services = [
    { 
      id: 'airtime', 
      label: 'Airtime', 
      icon: <PhoneCall size={28} color="#5B6AF0" weight="duotone" />, 
      route: '/buy-airtime', 
      color: isDark ? 'rgba(91, 106, 240, 0.15)' : '#EEF0FF' 
    },
    { 
      id: 'data', 
      label: 'Data', 
      icon: <WifiHigh size={28} color="#3B9EEB" weight="duotone" />, 
      route: '/buy-data', 
      color: isDark ? 'rgba(59, 158, 235, 0.15)' : '#E8F5FF' 
    },
    { 
      id: 'tv', 
      label: 'TV Cable', 
      icon: <Television size={28} color="#E040A0" weight="duotone" />, 
      route: '/pay-bills', 
      color: isDark ? 'rgba(224, 64, 160, 0.15)' : '#FFF0F8' 
    },
    { 
      id: 'electricity', 
      label: 'Electricity', 
      icon: <Lightning size={28} color="#F0A030" weight="duotone" />, 
      route: '/pay-bills', 
      color: isDark ? 'rgba(240, 160, 48, 0.15)' : '#FFF8E8' 
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning ☀️', color: '#6B7280' };
    if (hour < 17) return { text: 'Good afternoon 🌤️', color: '#6B7280' };
    return { text: 'Good evening 🌙', color: '#6B7280' };
  };

  const greetingEffect = getGreeting();

  const mapType = (type: string): any => {
    switch (type) {
      case 'airtime_topup': return 'airtime';
      case 'data_purchase': return 'data';
      case 'bill_payment': return 'cable';
      case 'wallet_topup': return 'wallet_topup';
      default: return 'transfer';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Image
            source={{ uri: user?.profile_image || user?.avatar || 'https://i.pravatar.cc/150?img=12' }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.greeting}>
          <Text variant="bodySmall" style={{ color: greetingEffect.color }} medium>{greetingEffect.text}</Text>
          <Text variant="headingSmall" bold style={{ color: colors.textPrimary, fontSize: 22 }}>{user?.first_name || 'Guest'}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.iconBtn, { backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6' }]}
        onPress={() => router.push('/notifications')}
      >
        <Bell size={22} color={colors.textPrimary} weight="duotone" />
        {unreadCount > 0 && <View style={[styles.badge, { backgroundColor: '#FF3B30' }]} />}
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper
      padding={false}
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={{ paddingHorizontal: 20 }}>
        {renderHeader()}

        <View style={styles.walletSection}>
          <WalletCard 
            balance={wallet?.balance || 0}
            onFund={() => router.push('/add-money')}
          />
        </View>

        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text variant="headingSmall" bold style={{ fontSize: 18, color: colors.textPrimary }}>Our Services</Text>
            <TouchableOpacity onPress={() => router.push('/more')}>
              <Text variant="labelMedium" color="primary" bold style={{ fontSize: 14 }}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.servicesGrid}>
            {services.map(service => (
              <ServiceItem
                key={service.id}
                label={service.label}
                icon={service.icon}
                color={service.color}
                onPress={() => router.push(service.route as any)}
              />
            ))}
          </View>
        </View>

        <View style={styles.promoSection}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => Linking.openURL('https://wa.me/2349165913821')}
          >
            <LinearGradient
              colors={['#1F2937', '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.promoCard}
            >
              <View style={[styles.promoBlob, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
              
              <View style={styles.promoTextGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <RocketLaunch size={20} color="#60A5FA" weight="duotone" style={{ marginRight: 8 }} />
                  <Text variant="bodyLarge" bold style={{ color: '#FFFFFF', fontSize: 17 }}>Get Your Own VTU App</Text>
                </View>
                <Text variant="caption" style={{ color: '#FFFFFF', opacity: 0.8, fontSize: 13 }}>Click here to start your VTU business today.</Text>
              </View>
              
              <View style={[styles.promoButton, { backgroundColor: '#3B82F6' }]}>
                <Text bold style={{ color: '#FFFFFF', fontSize: 12 }}>Contact Us</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.promoSection}>
          <LinearGradient
            colors={['#5B6AF0', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoCard}
          >
             {/* Decorative abstract blob */}
             <View style={styles.promoBlob} />
             
             <View style={styles.promoTextGroup}>
                <Text variant="bodyLarge" bold style={{ color: '#FFFFFF', fontSize: 18 }}>Refer & Earn ₦500</Text>
                <Text variant="caption" style={{ color: '#FFFFFF', opacity: 0.8, fontSize: 13 }}>Share with friends and get paid instantly.</Text>
             </View>
             
             <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {}}
                style={styles.promoButton}
             >
                <Text bold style={{ color: '#5B6AF0', fontWeight: '700' }}>Share</Text>
             </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.transactionSection}>
           <View style={styles.sectionHeader}>
              <Text variant="headingSmall" bold>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text variant="labelMedium" color="primary" bold>See All</Text>
              </TouchableOpacity>
           </View>
           
           {recentTransactions.length > 0 ? (
             recentTransactions.map(t => (
                <TransactionRow 
                   key={t._id}
                   type={mapType(t.type)}
                   title={t.type.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                   subtitle={`${formatDate(t.created_at)} • Ref: ${t.reference_number.slice(-6)}`}
                   amount={t.amount}
                   status={['success', 'successful'].includes(t.status as string) ? 'successful' : t.status === 'failed' ? 'failed' : 'pending'}
                />
             ))
           ) : (
             <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 24 }}>
                <Text variant="bodyMedium" color="textTertiary">No recent activity found</Text>
             </View>
           )}
        </View>

        <View style={{ height: 100 }} />
      </View>

      <AdminInfoModal 
        visible={!!adminInfo}
        title={adminInfo?.title}
        message={adminInfo?.message}
        onClose={handleCloseAdminInfo}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  greeting: {
    justifyContent: 'center',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  walletSection: {
    marginBottom: 28,
  },
  servicesSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  promoSection: {
    marginBottom: 28,
  },
  promoCard: {
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  promoBlob: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  promoButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  promoTextGroup: {
    flex: 1,
    marginRight: 16,
  },
  transactionSection: {
    marginBottom: 28,
  },
});

