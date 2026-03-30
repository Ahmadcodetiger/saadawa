/**
 * src/components/molecules/SettingRow.tsx
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';
import { CaretRight } from 'phosphor-react-native';

interface SettingRowProps {
  label: string;
  description?: string;
  icon: any;
  color?: string;
  onPress?: () => void;
  rightContent?: React.ReactNode;
  hideBorder?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  label,
  description,
  icon: Icon,
  color,
  onPress,
  rightContent,
  hideBorder = false,
}) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.primary;

  const Content = (
    <View style={[styles.container, !hideBorder && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
        <Icon size={22} color={iconColor} weight="duotone" />
      </View>
      <View style={styles.textContainer}>
        <Text variant="bodyMedium" bold>{label}</Text>
        {description && (
          <Text variant="caption" color="textSecondary">{description}</Text>
        )}
      </View>
      {rightContent ? (
        <View>{rightContent}</View>
      ) : (
        onPress && <CaretRight size={18} color={colors.textTertiary} weight="bold" />
      )}
    </View>
  );

  if (onPress && !rightContent) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
});
