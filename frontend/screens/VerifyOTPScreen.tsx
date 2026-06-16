/**
 * screens/VerifyOTPScreen.tsx
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Key } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../src/components/templates/AuthLayout';
import { Input } from '../src/components/atoms/Input';
import { Button } from '../src/components/atoms/Button';
import { Text } from '../src/components/atoms/Text';
import CustomAlert from '../components/CustomAlert';

const VerifyOTPScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  
  const emailParam = useMemo(() => (typeof params.email === 'string' ? params.email : ''), [params.email]);

  const [email] = useState(emailParam);
  const [otp, setOtp] = useState('');
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

  const onVerify = async () => {
    if (!email) {
      showAlert('Missing email. Please go back and enter your email.', 'error');
      return;
    }
    if (!otp || otp.length < 4) {
      showAlert('Enter the 4-6 digit OTP sent to your email.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.verifyEmailOTP({ email: email.trim().toLowerCase(), otp_code: otp.trim() });
      if (res?.success) {
        showAlert('OTP verified successfully.', 'success');
        setTimeout(() => {
          router.replace('/login' as any);
        }, 1500);
      } else {
        showAlert(res?.message || 'Invalid OTP. Please try again.', 'error');
      }
    } catch (e: any) {
      const msg = e?.message || 'OTP verification failed. Please try again.';
      showAlert(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!email) return;
    try {
      const res = await authService.resendOTP('', email.trim().toLowerCase());
      if (res?.success) {
        showAlert('A new OTP has been sent to your email.', 'success');
      } else {
        showAlert(res?.message || 'Failed to resend OTP.', 'error');
      }
    } catch (e: any) {
      showAlert(e?.message || 'Failed to resend OTP.', 'error');
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the OTP sent to ${email || 'your email'}`}
    >
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />

      <View style={styles.form}>
        <Input
          label="OTP Code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          autoCapitalize="none"
          maxLength={6}
          style={styles.otpInput}
          rightIcon={<Key size={20} color={colors.textTertiary} />}
        />

        <View style={styles.actionContainer}>
          <Button
            label="Verify OTP"
            onPress={onVerify}
            loading={submitting}
            disabled={!otp || submitting}
            style={styles.btn}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border, marginBottom: 12 }]} onPress={onResend}>
            <Text variant="bodyMedium" color="primary" bold>Resend OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => router.replace('/login' as any)}>
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
  otpInput: {
    letterSpacing: 8,
    textAlign: 'center',
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
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default VerifyOTPScreen;
