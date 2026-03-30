import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, Share, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeSlash, Copy, ShareNetwork, Check } from 'phosphor-react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  Easing,
  interpolate
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';

interface WalletCardProps {
  balance: number;
  currency?: string;
  onFund?: () => void;
  style?: ViewStyle;
}

const EMVChip = () => {
  return (
    <View style={styles.chipContainer}>
      <LinearGradient
        colors={['#F5D061', '#E6AF2E', '#CF9911']}
        style={styles.chipInner}
      >
        <View style={styles.chipLineH} />
        <View style={[styles.chipLineH, { top: '50%' }]} />
        <View style={[styles.chipLineH, { top: '80%' }]} />
        <View style={styles.chipLineV} />
        <View style={[styles.chipLineV, { left: '60%' }]} />
      </LinearGradient>
    </View>
  );
};

const AnimatedBalance = ({ value, isHidden, currency }: { value: number, isHidden: boolean, currency: string }) => {
    const animatedValue = useSharedValue(0);
    
    useEffect(() => {
        animatedValue.value = withTiming(value, {
            duration: 1200,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [value]);

    const format = (v: number) => {
        return v.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    if (isHidden) {
        return (
            <Text variant="displayMedium" color="textInverse" bold style={styles.balanceText}>
                ••••••
            </Text>
        );
    }

    return (
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text variant="displayMedium" color="textInverse" bold style={styles.balanceText}>
                {currency}{format(value)}
            </Text>
        </View>
    );
};

export const WalletCard: React.FC<WalletCardProps> = ({
  balance,
  currency = '₦',
  onFund,
  style,
}) => {
  const { colors, theme } = useAppTheme();
  const [isHidden, setIsHidden] = useState(false);

  return (
    <View style={[styles.shadowContainer, style]}>
      <LinearGradient
        colors={['#4F5BD5', '#6B72E8', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { borderRadius: 24 }]}
      >
        {/* Shine highlight */}
        <View style={styles.radialShine} />
        
        {/* Mesh textures */}
        <View style={[styles.meshBlob, { top: -20, right: -10, width: 100, height: 100 }]} />
        <View style={[styles.meshBlob, { bottom: -30, left: 10, width: 140, height: 140 }]} />
        
        {/* Visa-style circles */}
        <View style={styles.visaContainer}>
            <View style={[styles.visaCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            <View style={[styles.visaCircle, { backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: -12 }]} />
        </View>

        {/* Card Header */}
        <View style={styles.cardHeader}>
            <EMVChip />
            <Text variant="overline" bold style={styles.cardBranding}>SAADAWA</Text>
        </View>

        {/* Balance Section */}
        <View style={styles.cardBody}>
            <Text variant="caption" style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <View style={styles.balanceRow}>
                <AnimatedBalance value={balance} isHidden={isHidden} currency={currency} />
                <TouchableOpacity onPress={() => setIsHidden(!isHidden)} style={styles.eyeBtn}>
                    {isHidden ? (
                        <Eye size={22} color="rgba(255,255,255,0.7)" />
                    ) : (
                        <EyeSlash size={22} color="rgba(255,255,255,0.7)" />
                    )}
                </TouchableOpacity>
            </View>
        </View>

        {/* Add Money Button */}
        <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={onFund}
            style={styles.addMoneyBtn}
        >
            <Text bold style={styles.addMoneyText}>Add Money</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: '#4F5BD5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  container: {
    padding: 24,
    height: 210,  // Standard ATM Ratio
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  radialShine: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  meshBlob: {
    position: 'absolute',
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  visaContainer: {
      position: 'absolute',
      top: 24,
      right: 24,
      flexDirection: 'row',
  },
  visaCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  cardBranding: {
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: 2,
      fontSize: 12,
  },
  chipContainer: {
    width: 44,
    height: 34,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  chipInner: {
    flex: 1,
    padding: 4,
  },
  chipLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    top: '25%',
  },
  chipLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    left: '30%',
  },
  cardBody: {
    marginTop: 8,
    zIndex: 1,
  },
  balanceLabel: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
  },
  balanceText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  eyeBtn: {
    marginLeft: 12,
    padding: 8,
  },
  addMoneyBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 12,
    zIndex: 1,
  },
  addMoneyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
