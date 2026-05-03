import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, RefreshControl, Switch, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { 
  User, 
  Lock, 
  Bell, 
  Question, 
  Info, 
  SignOut,
  Moon,
  CaretRight,
  ShieldCheck,
  Wallet
} from 'phosphor-react-native';

import { useAppTheme } from '../../src/theme/ThemeContext';
import { Text } from '../../src/components/atoms/Text';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';
import { Badge, Divider } from '../../src/components/atoms/LayoutAtoms';

import { userService } from '@/services/user.service';
import { walletService } from '@/services/wallet.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, mode, setTheme } = useAppTheme();
  const { logout } = useAuth();
  
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserProfile(),
        loadWalletData(),
      ]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
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
      console.error('Error loading wallet:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const MenuItem = ({ icon: Icon, label, onPress, rightContent }: any) => (
    <TouchableOpacity 
      style={[styles.menuItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
          <Icon size={22} color={colors.primary} weight="duotone" />
        </View>
        <Text variant="bodyMedium" medium>{label}</Text>
      </View>
      {rightContent || <CaretRight size={18} color={colors.textTertiary} weight="bold" />}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Profile</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={styles.profileInfo}>
            <Image
                source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=12' }}
                style={styles.avatar}
            />
            <View style={styles.profileText}>
                <Text variant="headingSmall" color="textInverse" bold>{user?.first_name} {user?.last_name}</Text>
                <Text variant="bodySmall" color="textInverse" style={{ opacity: 0.8 }}>{user?.email}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <Badge 
                        label={user?.kyc_status?.toUpperCase() || 'LVL 1'} 
                        variant="success" 
                    />
                </View>
            </View>
        </View>
      </View>

      <View style={styles.statsRow}>
         <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Wallet size={20} color={colors.primary} weight="duotone" />
            <Text variant="bodySmall" color="textSecondary" style={{ marginTop: 4 }}>Balance</Text>
            <Text variant="bodyLarge" bold>₦{wallet?.balance?.toLocaleString() || '0'}</Text>
         </View>
         <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <ShieldCheck size={20} color={colors.success} weight="duotone" />
            <Text variant="bodySmall" color="textSecondary" style={{ marginTop: 4 }}>Security</Text>
            <Text variant="bodyLarge" bold>Verified</Text>
         </View>
      </View>

      <View style={styles.menuSection}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
        <MenuItem 
            icon={User} 
            label="Personal Information" 
            onPress={() => router.push('/edit-profile' as any)} 
        />
        <MenuItem 
            icon={Lock} 
            label="Security & PIN" 
            onPress={() => router.push('/security' as any)} 
        />
        <MenuItem 
            icon={Bell} 
            label="Notifications" 
            onPress={() => router.push('/notifications-settings' as any)} 
        />
      </View>

      <View style={styles.menuSection}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>PREFERENCES</Text>
        <MenuItem 
            icon={Moon} 
            label="Dark Mode" 
            rightContent={
                <Switch 
                    value={mode === 'dark'} 
                    onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="white"
                />
            }
        />
      </View>

      <View style={styles.menuSection}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>SUPPORT</Text>
        <MenuItem 
            icon={Question} 
            label="Help & Support" 
            onPress={() => router.push('/help-support' as any)} 
        />
        <MenuItem 
            icon={Info} 
            label="About Saadawa" 
            onPress={() => router.push('/about' as any)} 
        />
      </View>

      <TouchableOpacity 
        style={[styles.logoutBtn, { borderColor: colors.error }]} 
        onPress={handleLogout}
      >
        <SignOut size={22} color={colors.error} weight="bold" />
        <Text variant="bodyLarge" bold color="error">Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  profileCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingRight: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
  },
});
