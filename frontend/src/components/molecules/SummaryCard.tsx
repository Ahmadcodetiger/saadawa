/**
 * src/components/molecules/SummaryCard.tsx
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';
import { Divider } from '../atoms/LayoutAtoms';

interface SummaryItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface SummaryCardProps {
  items: SummaryItem[];
  title?: string;
  style?: ViewStyle;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  items,
  title = 'Transaction Summary',
  style,
}) => {
  const { colors, theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
      {title && (
        <Text variant="labelMedium" color="textSecondary" style={styles.title} bold>
          {title.toUpperCase()}
        </Text>
      )}

      {items.map((item, index) => (
        <View key={index}>
          <View style={styles.row}>
            <Text variant="bodySmall" color="textSecondary">
              {item.label}
            </Text>
            <Text variant="bodyMedium" color={item.highlight ? 'primary' : 'textPrimary'} bold>
              {item.value}
            </Text>
          </View>
          {index < items.length - 1 && (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
  },
  title: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    opacity: 0.5,
  },
});
