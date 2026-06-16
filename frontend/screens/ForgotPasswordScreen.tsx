/**
 * screens/ForgotPasswordScreen.tsx
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Envelope } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../src/components/templates/AuthLayout';
import { Input } from '../src/components/atoms/Input';
import { Button } from '../src/components/atoms/Button';
import { Text } from '../src/components/atoms/Text';
import CustomAlert from '../components/CustomAlert';

const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
  });

  const showAlert = useCallback((message: string, type: any = 'info') => {
    setAlert({ visible: true, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, visible: false }));
  }, []);

  const onSubmit = async () => {
    if (!email) {
      showAlert('Please enter your email address', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.requestPasswordReset({ email: email.trim().toLowerCase() });
      if (res?.success) {
        showAlert('Password reset OTP has been sent to your email.', 'success');
        setTimeout(() => {
          router.push({
            pathname: '/reset-password' as any,
            params: { phone: res.data?.phone_number || '' }
          });
        }, 1500);
      } else {
        showAlert(res?.message || 'Failed to send OTP. Please try again.', 'error');
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to send OTP. Please try again.';
      showAlert(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset OTP"
    >
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />

      <View style={styles.form}>
        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          rightIcon={<Envelope size={20} color={colors.textTertiary} />}
        />

        <View style={styles.actionContainer}>
          <Button
            label="Send OTP"
            onPress={onSubmit}
            loading={submitting}
            disabled={!email || submitting}
            style={styles.btn}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => router.replace('/login' as any)}>
            <Text variant="bodyMedium" color="textSecondary" bold>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  btn: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default ForgotPasswordScreen;
