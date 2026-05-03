import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Lock, 
  Fingerprint, 
  ShieldCheck, 
  BellRinging, 
  Devices, 
  SignOut,
  Key
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { SettingRow } from '../src/components/molecules/SettingRow';
import { useAlert } from '@/components/AlertContext';
import { userService } from '@/services/user.service';

export default function SecurityScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  // State
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedBio = await AsyncStorage.getItem('biometricEnabled');
    setBiometricEnabled(savedBio === 'true');
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricSupported(compatible);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      showError('Check password fields'); return;
    }
    setIsChangingPassword(true);
    try {
      const res = await userService.updatePassword(currentPassword, newPassword);
      if (res?.success) showSuccess('Password updated!');
      else showError(res?.message || 'Update failed');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdatePin = async () => {
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      showError('PIN must be 4 digits'); return;
    }
    setIsUpdatingPin(true);
    try {
      const res = await userService.updateTransactionPin(currentPin, newPin);
      if (res?.success) showSuccess('PIN updated!');
      else showError(res?.message || 'Update failed');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Security</Text>
        <Text variant="bodySmall" color="textSecondary">Manage your account protection</Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>AUTHENTICATION</Text>
        <Input 
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            isPassword
        />
        <Input 
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
        />
        <Input 
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
        />
        <Button 
            label="Update Password"
            onPress={handleChangePassword}
            loading={isChangingPassword}
            variant="outline"
            style={{ marginTop: 8 }}
        />
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>PIN & BIOMETRICS</Text>
        <Input 
            label="Current 4-digit PIN"
            value={currentPin}
            onChangeText={setCurrentPin}
            maxLength={4}
            keyboardType="number-pad"
            secureTextEntry
        />
        <Input 
            label="New 4-digit PIN"
            value={newPin}
            onChangeText={setNewPin}
            maxLength={4}
            keyboardType="number-pad"
            secureTextEntry
        />
        <Button 
            label="Update PIN"
            onPress={handleUpdatePin}
            loading={isUpdatingPin}
            variant="outline"
            style={{ marginTop: 8, marginBottom: 24 }}
        />

        <SettingRow 
            label="Biometric Login"
            description="Use fingerprint or face recognition"
            icon={Fingerprint}
            rightContent={
                <Switch 
                    value={biometricEnabled} 
                    onValueChange={async (v) => {
                        if (v) {
                            const res = await LocalAuthentication.authenticateAsync();
                            if (res.success) {
                                setBiometricEnabled(true);
                                await AsyncStorage.setItem('biometricEnabled', 'true');
                            }
                        } else {
                            setBiometricEnabled(false);
                            await AsyncStorage.setItem('biometricEnabled', 'false');
                        }
                    }}
                    disabled={!isBiometricSupported}
                />
            }
        />
        <SettingRow 
            label="2-Step Verification"
            description="Protect with an extra layer"
            icon={ShieldCheck}
            rightContent={<Switch value={twoFactorEnabled} onValueChange={setTwoFactorEnabled} />}
        />
        <SettingRow 
            label="Login Notifications"
            description="Alerts for new sign-ins"
            icon={BellRinging}
            rightContent={<Switch value={loginNotifications} onValueChange={setLoginNotifications} />}
            hideBorder
        />
      </View>

      <View style={styles.section}>
          <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>SESSIONS</Text>
          <SettingRow 
            label="Active Devices"
            description="3 devices currently logged in"
            icon={Devices}
            onPress={() => {}}
          />
          <SettingRow 
            label="Logout All Devices"
            description="Sign out from everywhere else"
            icon={SignOut}
            color={colors.error}
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
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 1,
  },
});