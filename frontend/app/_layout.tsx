import { AlertProvider } from '@/components/AlertContext';
import { ProfileProvider } from '@/components/ProfileContext';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator, Text, Animated, StyleSheet } from 'react-native';
import { AppUpdateChecker } from '@/components/AppUpdateChecker';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// This component will handle the authentication state and routing
function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = ['login', 'signup', 'forgot-password', 'verify-otp'].includes(segments[0] as string);

    if (!isLoading) {
      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to the login page if not authenticated
        router.replace('/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to the home page if authenticated and trying to access auth pages
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'fade',
      contentStyle: { backgroundColor: '#111418' },
    }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="set-pin" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="more" />
      <Stack.Screen name="buy-airtime" />
      <Stack.Screen name="buy-data" />
      <Stack.Screen name="pay-bills" />
      <Stack.Screen name="add-money" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="security" />
      <Stack.Screen name="notifications-settings" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="about" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="admin-users" />
      <Stack.Screen name="admin-notifications" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function AppLoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for logo text — native driver safe for opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Spin animation — useNativeDriver: false avoids warnings on all RN versions
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 1200, useNativeDriver: false })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={loadingStyles.container}>
      {/* StatusBar is already handled by RootLayout — do NOT add it here */}

      {/* Branded spinner ring */}
      <View style={loadingStyles.spinnerWrapper}>
        <Animated.View style={[loadingStyles.spinnerRing, { transform: [{ rotate: spin }] }]} />
        <View style={loadingStyles.spinnerInner}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      </View>

      {/* App name */}
      <Animated.Text style={[loadingStyles.brandText, { opacity: pulseAnim }]}>
        SAADAWA
      </Animated.Text>

      <Text style={loadingStyles.subText}>Loading your account...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
    justifyContent: 'center',
    alignItems: 'center',
    // NOTE: 'gap' is not used here — not supported in older React Native versions
  },
  spinnerWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  spinnerRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#5B6AF0',
    borderRightColor: '#8B5CF6',
  },
  spinnerInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(91,106,240,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(91,106,240,0.3)',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: 8,
  },
  subText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the splash screen after the fonts have loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AlertProvider>
        <AuthProvider>
          <ProfileProvider>
            <StatusBar style="light" />
            <AuthLayout />
            <AppUpdateChecker />
          </ProfileProvider>
        </AuthProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
