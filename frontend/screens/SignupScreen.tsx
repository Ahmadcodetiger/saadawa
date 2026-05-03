/**
 * screens/SignupScreen.tsx
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Envelope, Phone, Lock, Key, Tag } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../src/components/templates/AuthLayout';
import { Input } from '../src/components/atoms/Input';
import { Button } from '../src/components/atoms/Button';
import { Text } from '../src/components/atoms/Text';

const SignupScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    pin: '',
    confirmPin: '',
    referral_code: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const updateForm = (key: keyof typeof formData, value: string) => {
    if (key === 'pin' || key === 'confirmPin') {
        value = value.replace(/\D/g, '').slice(0, 4);
    }
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSignup = async () => {
    const { first_name, last_name, email, phone_number, password, confirmPassword, pin, confirmPin, referral_code } = formData;

    // Validation
    if (!email || !password || !confirmPassword || !first_name || !last_name || !phone_number || !pin || !confirmPin) {
      Alert.alert("❌ Missing Information", "Please fill in all required fields to continue.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("❌ Password Mismatch", "The passwords you entered do not match.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "❌ Weak Password", 
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&)."
      );
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("❌ PIN Mismatch", "The transaction PINs do not match.");
      return;
    }

    if (pin.length !== 4) {
      Alert.alert("❌ Invalid PIN", "Transaction PIN must be exactly 4 digits.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({
        email: email.trim().toLowerCase(),
        phone_number,
        password,
        first_name,
        last_name,
        referral_code: referral_code || undefined,
        pin,
      });

      if (response.success) {
        Alert.alert("🎉 Welcome Aboard!", `Your account has been created successfully, ${first_name}!`, [
          { text: "Get Started", onPress: () => router.replace("/(tabs)") }
        ]);
      }
    } catch (error: any) {
      Alert.alert("❌ Registration Failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join Saadawa and start managing your finances better."
      scroll
    >
      <View style={styles.form}>
        <View style={styles.section}>
            <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
            <Input
                label="First Name"
                value={formData.first_name}
                onChangeText={(v) => updateForm('first_name', v)}
                autoCapitalize="words"
                rightIcon={<User size={20} color={colors.textTertiary} />}
            />
            <Input
                label="Last Name"
                value={formData.last_name}
                onChangeText={(v) => updateForm('last_name', v)}
                autoCapitalize="words"
                rightIcon={<User size={20} color={colors.textTertiary} />}
            />
            <Input
                label="Email Address"
                value={formData.email}
                onChangeText={(v) => updateForm('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                rightIcon={<Envelope size={20} color={colors.textTertiary} />}
            />
            <Input
                label="Phone Number"
                value={formData.phone_number}
                onChangeText={(v) => updateForm('phone_number', v)}
                keyboardType="phone-pad"
                rightIcon={<Phone size={20} color={colors.textTertiary} />}
            />
        </View>

        <View style={styles.section}>
            <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>SECURITY</Text>
            <Input
                label="Create Password"
                value={formData.password}
                onChangeText={(v) => updateForm('password', v)}
                isPassword
            />
            {formData.password.length > 0 && (
              <View style={styles.passwordHint}>
                <Text variant="caption" color={/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password) ? "success" : "textSecondary"}>
                  • Must be 8+ chars with Upper, Lower, Number & Symbol
                </Text>
              </View>
            )}
            <Input
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(v) => updateForm('confirmPassword', v)}
                isPassword
            />
            <Input
                label="Transaction PIN (4 digits)"
                value={formData.pin}
                onChangeText={(v) => updateForm('pin', v)}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                rightIcon={<Key size={20} color={colors.textTertiary} />}
            />
             <Input
                label="Confirm Transaction PIN"
                value={formData.confirmPin}
                onChangeText={(v) => updateForm('confirmPin', v)}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                rightIcon={<Key size={20} color={colors.textTertiary} />}
            />
        </View>

        <View style={styles.section}>
            <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>REFERRAL (OPTIONAL)</Text>
            <Input
                label="Referral Code"
                value={formData.referral_code}
                onChangeText={(v) => updateForm('referral_code', v)}
                autoCapitalize="characters"
                rightIcon={<Tag size={20} color={colors.textTertiary} />}
            />
        </View>

        <Button
          label="Create Account"
          onPress={handleSignup}
          loading={isLoading}
          style={styles.signupBtn}
        />

        <View style={styles.footer}>
          <Text variant="bodyMedium" color="textSecondary">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text variant="bodyMedium" color="primary" bold>Log In</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    letterSpacing: 1,
  },
  signupBtn: {
    marginTop: 16,
    marginBottom: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordHint: {
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
});

export default SignupScreen;
