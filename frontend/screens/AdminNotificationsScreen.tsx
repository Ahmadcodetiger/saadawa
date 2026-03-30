import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Bell, 
  PaperPlaneTilt, 
  Info, 
  Tag, 
  Warning, 
  CloudArrowDown, 
  Link 
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { useAlert } from '@/components/AlertContext';
import { adminService } from '@/services/admin.service';

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('system'); 
  const [actionUrl, setActionUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      showError('Check title and message'); return;
    }
    setIsSubmitting(true);
    try {
      const res = await adminService.sendBroadcastNotification({
        title, message, type, action_url: actionUrl,
        priority: (type === 'app_update' || type === 'alert') ? 'high' : 'medium'
      });
      if (res?.success) {
        showSuccess('Broadcast sent!');
        setTitle(''); setMessage(''); setActionUrl(''); setType('system');
      } else showError(res?.message || 'Send failed');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const types = [
    { id: 'system', label: 'System', icon: Info, color: colors.primary },
    { id: 'promotion', label: 'Promotion', icon: Tag, color: colors.accent },
    { id: 'alert', label: 'Alert', icon: Warning, color: colors.error },
    { id: 'app_update', label: 'Update', icon: CloudArrowDown, color: colors.primary },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Send Broadcast</Text>
        <Text variant="bodySmall" color="textSecondary">Push notification to all users</Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>NOTIFICATION TYPE</Text>
        <View style={styles.typeGrid}>
            {types.map((t) => (
                <TouchableOpacity 
                    key={t.id}
                    style={[
                        styles.typeCard, 
                        { backgroundColor: type === t.id ? t.color : colors.surface, borderColor: type === t.id ? t.color : colors.border }
                    ]}
                    onPress={() => setType(t.id)}
                >
                    <t.icon size={20} color={type === t.id ? 'white' : colors.textPrimary} weight="duotone" />
                    <Text variant="caption" bold style={{ color: type === t.id ? 'white' : colors.textPrimary, marginTop: 4 }}>
                        {t.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>MESSAGE CONTENT</Text>
        <Input 
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Main heading..."
            leftIcon={<Bell size={18} color={colors.textTertiary} />}
        />
        <Input 
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Keep it concise and clear..."
            multiline
            style={{ height: 120, paddingTop: 16 }}
        />
        <Input 
            label="Action URL (Optional)"
            value={actionUrl}
            onChangeText={setActionUrl}
            placeholder="https://saadawa.com/update"
            leftIcon={<Link size={18} color={colors.textTertiary} />}
        />
      </View>

      <Button 
        label="Send Broadcast Now"
        onPress={handleSend}
        loading={isSubmitting}
        icon={<PaperPlaneTilt size={20} color="white" weight="bold" />}
        style={styles.sendBtn}
      />

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
         <Warning size={20} color={colors.primary} weight="duotone" />
         <Text variant="caption" color="primary" style={{ flex: 1 }}>
            This message will be sent to all registered users. Please verify information before sending.
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
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 1,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  sendBtn: {
    marginTop: 12,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 24,
  },
});
