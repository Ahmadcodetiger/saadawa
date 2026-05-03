import React, { useState } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { Bell, Envelope, DeviceMobile, Megaphone, ShieldCheck, Info } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { SettingRow } from '../src/components/molecules/SettingRow';

export default function NotificationSettingsScreen() {
  const { colors } = useAppTheme();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [marketingAlerts, setMarketingAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Notification Settings</Text>
        <Text variant="bodySmall" color="textSecondary">Customize how you receive updates</Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>CHANNELS</Text>
        <SettingRow 
          label="Push Notifications"
          description="Instant alerts on your device"
          icon={DeviceMobile}
          rightContent={<Switch value={pushAlerts} onValueChange={setPushAlerts} />}
        />
        <SettingRow 
          label="Email Alerts"
          description="Summaries and confirmations via email"
          icon={Envelope}
          rightContent={<Switch value={emailAlerts} onValueChange={setEmailAlerts} />}
        />
        <SettingRow 
          label="SMS Notifications"
          description="Critical updates via text message"
          icon={Megaphone}
          rightContent={<Switch value={smsAlerts} onValueChange={setSmsAlerts} />}
          hideBorder
        />
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>PREFERENCES</Text>
        <SettingRow 
          label="Security & Privacy"
          description="Alerts for login and password changes"
          icon={ShieldCheck}
          rightContent={<Switch value={securityAlerts} onValueChange={setSecurityAlerts} />}
        />
        <SettingRow 
          label="Offers & Promotions"
          description="New features and discount alerts"
          icon={Info}
          rightContent={<Switch value={marketingAlerts} onValueChange={setMarketingAlerts} />}
          hideBorder
        />
      </View>

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
         <Bell size={20} color={colors.primary} weight="duotone" />
         <Text variant="caption" color="primary" style={{ flex: 1 }}>
            Note: Mandatory transaction confirmations will always be sent via email for security purposes.
         </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
});