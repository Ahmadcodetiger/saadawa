import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Sun, 
  Moon, 
  DeviceMobile, 
  Lock, 
  Users, 
  Bell, 
  CheckCircle,
  Gear,
  Info
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { SettingRow } from '../src/components/molecules/SettingRow';
import { useAlert } from '@/components/AlertContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { themeMode, isDark, setThemeMode, colors } = useAppTheme();
  const { showSuccess } = useAlert();
  const { user } = useAuth();

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    showSuccess(`Theme updated to ${mode}`);
  };

  const isAdmin = user?.role === 'admin' || user?.role_id === 'admin';

  const themeOptions = [
    { id: 'light', title: 'Light', icon: Sun },
    { id: 'dark', title: 'Dark', icon: Moon },
    { id: 'system', title: 'System', icon: DeviceMobile },
  ] as const;

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Settings</Text>
        <Text variant="bodySmall" color="textSecondary">Customize your app experience</Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>APPEARANCE</Text>
        <View style={styles.themeGrid}>
            {themeOptions.map((opt) => (
                <TouchableOpacity 
                    key={opt.id}
                    style={[
                        styles.themeCard, 
                        { 
                            backgroundColor: themeMode === opt.id ? colors.primary : colors.surface,
                            borderColor: themeMode === opt.id ? colors.primary : colors.border
                        }
                    ]}
                    onPress={() => handleThemeChange(opt.id)}
                >
                    <opt.icon size={24} color={themeMode === opt.id ? 'white' : colors.textPrimary} weight="duotone" />
                    <Text variant="bodySmall" bold style={{ color: themeMode === opt.id ? 'white' : colors.textPrimary, marginTop: 8 }}>
                        {opt.title}
                    </Text>
                    {themeMode === opt.id && (
                        <View style={styles.check}>
                            <CheckCircle size={16} color="white" weight="fill" />
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>ACCOUNT & SECURITY</Text>
        <SettingRow 
            label="Security & PIN"
            description="Manage Password and Transaction PIN"
            icon={ShieldCheck}
            onPress={() => router.push('/security')}
        />
        <SettingRow 
            label="Notifications"
            description="Manage alerts and push notifications"
            icon={Bell}
            onPress={() => router.push('/notifications')}
            hideBorder
        />
      </View>

      {isAdmin && (
          <View style={styles.section}>
            <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>ADMINISTRATION</Text>
            <SettingRow 
                label="User Management"
                description="View and manage user accounts"
                icon={Users}
                onPress={() => router.push('/admin-users')}
            />
            <SettingRow 
                label="Push Broadcast"
                description="Send notifications to all users"
                icon={Bell}
                onPress={() => router.push('/admin-notifications')}
                hideBorder
            />
          </View>
      )}

      <View style={styles.section}>
          <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>SUPPORT</Text>
          <SettingRow 
            label="Help & Support"
            description="Get help or report an issue"
            icon={Info}
            onPress={() => router.push('/help-support')}
          />
          <SettingRow 
            label="Legal & Terms"
            description="Our policies and user agreement"
            icon={ShieldCheck}
            onPress={() => {}}
            hideBorder
          />
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
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 1,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  themeCard: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

import { ShieldCheck } from 'phosphor-react-native';