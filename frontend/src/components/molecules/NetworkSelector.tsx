/**
 * src/components/molecules/NetworkSelector.tsx
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';
import { CheckCircle } from 'phosphor-react-native';

export interface Network {
  id: string;
  name: string;
  color: string;
  logo?: any;
}

interface NetworkSelectorProps {
  networks: Network[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label?: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  networks,
  selectedId,
  onSelect,
  label = "Select Network",
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelMedium" color="textSecondary" medium style={styles.label}>
          {label.toUpperCase()}
        </Text>
      )}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {networks.map((network) => {
          const isSelected = selectedId === network.id;
          return (
            <TouchableOpacity
              key={network.id}
              style={[
                styles.networkCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? network.color : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                }
              ]}
              onPress={() => onSelect(network.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.logoContainer, { backgroundColor: `${network.color}15` }]}>
                 {/* Placeholder for actual logo if available, else initial */}
                 <Text variant="headingSmall" bold style={{ color: network.color }}>
                    {network.name.charAt(0)}
                 </Text>
              </View>
              <Text 
                variant="bodySmall" 
                bold={isSelected} 
                color={isSelected ? 'textPrimary' : 'textSecondary'}
                style={styles.networkName}
              >
                {network.name}
              </Text>
              {isSelected && (
                <View style={[styles.badge, { backgroundColor: network.color }]}>
                  <CheckCircle size={14} color="white" weight="bold" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingLeft: 4,
    paddingRight: 16,
    gap: 12,
  },
  networkCard: {
    width: 90,
    height: 110,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkName: {
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
});
