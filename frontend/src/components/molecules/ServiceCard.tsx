/**
 * src/components/molecules/ServiceCard.tsx
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';
import { CaretRight } from 'phosphor-react-native';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: any;
  color: string;
  onPress: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon: Icon,
  color,
  onPress,
}) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={28} color={color} weight="duotone" />
      </View>
      <View style={styles.content}>
        <Text variant="bodyLarge" bold>{title}</Text>
        <Text variant="caption" color="textSecondary">{description}</Text>
      </View>
      <CaretRight size={18} color={colors.textTertiary} weight="bold" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
});
