/**
 * screens/LoginScreen.tsx
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fingerprint } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../src/components/templates/AuthLayout';
import { Input } from '../src/components/atoms/Input';
import { Button } from '../src/components/atoms/Button';
import { Text } from '../src/components/atoms/Text';
import { useAlert } from '../components/AlertContext';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  
  const { showError, showSuccess, showInfo } = useAlert();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
      return;
    }

    const checkBiometrics = async () => {
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      if (enabled === 'true') {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) setIsBiometricEnabled(true);
      }
    };
    checkBiometrics();
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success) {
        await SecureStore.setItemAsync('user_credentials', JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        }));
        router.replace('/(tabs)');
      } else {
        showError(response.message || 'Invalid email or password');
      }
    } catch (error: any) {
      showError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
      });

      if (result.success) {
        setLoading(true);
        const creds = await SecureStore.getItemAsync('user_credentials');
        if (creds) {
          const { email: savedEmail, password: savedPassword } = JSON.parse(creds);
          const response = await login({ email: savedEmail, password: savedPassword });
          if (response.success) {
            router.replace('/(tabs)');
          } else {
            showError(response.message || 'Biometric login failed');
          }
        }
      }
    } catch (error) {
      showError('Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout 
        title="Welcome back" 
        subtitle="Sign in to your account to continue"
        showBack={false}
      >

      <View style={styles.form}>
        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          isPassword
        />

        <TouchableOpacity 
          onPress={() => router.push('/forgot-password')}
          style={styles.forgotBtn}
        >
          <Text variant="labelMedium" color="primary" bold>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.actionContainer}>
          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          {isBiometricEnabled && (
            <TouchableOpacity 
              onPress={handleBiometricLogin}
              style={[styles.biometricBtn, { borderColor: colors.border }]}
            >
              <Fingerprint size={32} color={colors.primary} weight="duotone" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMedium" color="textSecondary">
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text variant="bodyMedium" color="primary" bold>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
    </>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: -8,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  loginBtn: {
    flex: 1,
  },
  biometricBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;
