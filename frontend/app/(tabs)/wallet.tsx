import React from 'react';
import { View } from 'react-native';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';
import { Text } from '../../src/components/atoms/Text';

export default function WalletScreen() {
  return (
    <ScreenWrapper>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="headingMedium" bold>My Wallet</Text>
        <Text variant="bodyMedium" color="textSecondary">Manage your cards and accounts here.</Text>
      </View>
    </ScreenWrapper>
  );
}
