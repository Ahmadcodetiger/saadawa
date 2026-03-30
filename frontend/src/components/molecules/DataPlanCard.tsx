/**
 * src/components/molecules/DataPlanCard.tsx
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';
import { WifiHigh } from 'phosphor-react-native';

interface DataPlanCardProps {
  data: string;
  validity: string;
  price: number;
  isSelected: boolean;
  onPress: () => void;
}

export const DataPlanCard: React.FC<DataPlanCardProps> = ({
  data,
  validity,
  price,
  isSelected,
  onPress,
}) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <WifiHigh 
            size={20} 
            color={isSelected ? 'white' : colors.primary} 
            weight={isSelected ? 'fill' : 'bold'} 
        />
        <Text 
            variant="bodyMedium" 
            bold 
            style={{ color: isSelected ? 'white' : colors.textPrimary }}
        >
            {data}
        </Text>
      </View>
      <Text 
        variant="caption" 
        style={[styles.validity, { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}
      >
        {validity}
      </Text>
      <Text 
        variant="bodyLarge" 
        bold 
        style={{ color: isSelected ? 'white' : colors.primary }}
      >
        ₦{price.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  validity: {
    marginBottom: 12,
  },
});
