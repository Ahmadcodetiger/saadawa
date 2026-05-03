/**
 * screens/ResetPasswordScreen.tsx
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Key, CheckCircle } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../src/components/templates/AuthLayout';
import { Input } from '../src/components/atoms/Input';
import { Button } from '../src/components/atoms/Button';
import { Text } from '../src/components/atoms/Text';

const ResetPasswordScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();
  
  const phone_number = typeof params.phone === 'string' ? params.phone : '';
  
  const [formData, setFormData] = useState({
    otp_code: '',
    new_password: '',
    confirm_password: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = async () => {
    const { otp_code, new_password, confirm_password } = formData;

    if (!otp_code || !new_password || !confirm_password) {
      Alert.alert("❌ Missing Info", "Please fill in all fields.");
      return;
    }

    if (new_password !== confirm_password) {
      Alert.alert("❌ Mismatch", "Passwords do not match.");
      return;
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(new_password)) {
      Alert.alert("❌ Weak Password", "Password must be 8+ chars with uppercase, lowercase, number and symbol.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        phone_number,
        otp_code: otp_code.trim(),
        new_password,
      });

      if (response.success) {
        Alert.alert(
          "✅ Success", 
          "Your password has been reset successfully. You can now log in.",
          [{ text: "Log In", onPress: () => router.replace("/login") }]
        );
      } else {
        Alert.alert("❌ Error", response.message || "Failed to reset password.");
      }
    } catch (error: any) {
      Alert.alert("❌ Error", error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Enter the OTP sent and your new secure password."
    >
      <View style={styles.form}>
        <Input
          label="OTP Code"
          value={formData.otp_code}
          onChangeText={(v) => updateForm('otp_code', v)}
          keyboardType="number-pad"
          maxLength={6}
          rightIcon={<Key size={20} color={colors.textTertiary} />}
        />

        <Input
          label="New Password"
          value={formData.new_password}
          onChangeText={(v) => updateForm('new_password', v)}
          isPassword
        />

        {formData.new_password.length > 0 && (
          <View style={styles.hint}>
            <Text variant="caption" color={/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.new_password) ? "success" : "textSecondary"}>
              • 8+ chars with Upper, Lower, Number & Symbol
            </Text>
          </View>
        )}

        <Input
          label="Confirm New Password"
          value={formData.confirm_password}
          onChangeText={(v) => updateForm('confirm_password', v)}
          isPassword
        />

        <Button
          label="Reset Password"
          onPress={handleReset}
          loading={isLoading}
          style={styles.btn}
        />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '100%',
    marginTop: 20,
  },
  btn: {
    marginTop: 24,
  },
  hint: {
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  }
});

export default ResetPasswordScreen;
