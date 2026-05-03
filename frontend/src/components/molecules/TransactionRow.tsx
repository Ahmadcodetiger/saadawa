/**
 * src/components/molecules/TransactionRow.tsx
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  PhoneCall, 
  WifiHigh, 
  Television, 
  Lightning, 
  Wallet,
  ArrowDownLeft,
  ArrowUpRight
} from 'phosphor-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';
import { Badge } from '../atoms/LayoutAtoms';

export type TransactionType = 'airtime' | 'data' | 'cable' | 'electricity' | 'wallet_topup' | 'transfer';

interface TransactionRowProps {
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  status: 'successful' | 'pending' | 'failed';
  onPress?: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  type,
  title,
  subtitle,
  amount,
  status,
  onPress,
}) => {
  const { colors, theme } = useAppTheme();

  const getIcon = () => {
    const size = 20;
    const color = colors.primary;
    
    switch (type) {
      case 'airtime': return <PhoneCall size={size} color={color} weight="duotone" />;
      case 'data': return <WifiHigh size={size} color={color} weight="duotone" />;
      case 'cable': return <Television size={size} color={color} weight="duotone" />;
      case 'electricity': return <Lightning size={size} color={color} weight="duotone" />;
      case 'wallet_topup': return <ArrowDownLeft size={size} color={colors.success} weight="bold" />;
      default: return <Wallet size={size} color={color} weight="duotone" />;
    }
  };

  const isCredit = type === 'wallet_topup';

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.surfaceElevated }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        {getIcon()}
      </View>
      
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text variant="labelLarge" bold numberOfLines={1}>
            {title}
          </Text>
          <Text 
            variant="labelLarge" 
            bold 
            color={isCredit ? 'success' : 'textPrimary'}
          >
            {isCredit ? '+' : '-'}₦{amount.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.bottomRow}>
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
          <Badge 
            label={status} 
            variant={status === 'successful' ? 'success' : status === 'pending' ? 'warning' : 'error'} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
