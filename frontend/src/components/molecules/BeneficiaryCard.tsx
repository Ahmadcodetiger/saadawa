/**
 * src/components/molecules/BeneficiaryCard.tsx
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';

interface Beneficiary {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
}

interface BeneficiaryCardProps {
  beneficiaries: Beneficiary[];
  onSelect: (beneficiary: Beneficiary) => void;
}

export const BeneficiaryCard: React.FC<BeneficiaryCardProps> = ({
  beneficiaries,
  onSelect,
}) => {
  const { colors, theme } = useAppTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" color="textSecondary" style={styles.title} bold>
        Recent Beneficiaries
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {beneficiaries.map(beneficiary => (
          <TouchableOpacity
            key={beneficiary.id}
            style={styles.item}
            onPress={() => onSelect(beneficiary)}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text color="primary" bold>{getInitials(beneficiary.name)}</Text>
            </View>
            <Text variant="caption" numberOfLines={1} style={styles.name}>
              {beneficiary.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    marginLeft: 16,
    marginBottom: 12,
  },
  scroll: {
    paddingHorizontal: 12,
  },
  item: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 64,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    textAlign: 'center',
  },
});
