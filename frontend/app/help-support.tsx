import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChatTeardropDots, 
  PhoneCall, 
  Envelope, 
  WhatsappLogo, 
  CaretDown, 
  CaretUp, 
  Info,
  Question,
  Note
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { SettingRow } from '../src/components/molecules/SettingRow';
import { useAlert } from '@/components/AlertContext';
import { supportService } from '@/services/support.service';

export default function HelpSupportScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [selectedFAQ, setSelectedFAQ] = useState<number | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [supportContent, setSupportContent] = useState<any>(null);

  useEffect(() => {
    fetchSupportContent();
  }, []);

  const fetchSupportContent = async () => {
    try {
      const response = await supportService.getSupportContent();
      if (response.success) setSupportContent(response.data);
    } catch (e) {
      console.error('Failed to fetch support content:', e);
    }
  };

  const faqData = [
    { q: 'How do I buy airtime or data?', a: 'Go to the home screen and select "Buy Airtime" or "Buy Data". Choose your network, enter the phone number, select the amount, and confirm.' },
    { q: 'How long do transactions take?', a: 'Most are instant. Some may take up to 5 minutes. If it takes longer, contact support.' },
    { q: 'How do I fund my wallet?', a: 'Tap "Add Money" on the home screen. Choose a method and follow the prompts.' },
    { q: 'What if a transaction fails?', a: 'Failed transactions are automatically refunded within 24 hours.' },
  ];

  const contactOptions = [
    { title: 'Live Chat', desc: 'Chat with our support team', icon: ChatTeardropDots, action: () => Alert.alert('Soon', 'Coming soon!') },
    { title: 'Call Support', desc: supportContent?.phoneNumber || 'Loading...', icon: PhoneCall, action: () => supportContent?.phoneNumber && Linking.openURL(`tel:${supportContent.phoneNumber}`) },
    { title: 'Email Support', desc: supportContent?.email || 'Loading...', icon: Envelope, action: () => supportContent?.email && Linking.openURL(`mailto:${supportContent.email}`) },
    { title: 'WhatsApp', desc: supportContent?.whatsappNumber || 'Loading...', icon: WhatsappLogo, action: () => supportContent?.whatsappNumber && Linking.openURL(`https://wa.me/${supportContent.whatsappNumber}`) },
  ];

  const handleSubmitTicket = async () => {
    if (!supportMessage.trim()) {
      showError('Please enter your message'); return;
    }
    setIsSubmittingTicket(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Ticket submitted!');
      setSupportMessage('');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Help & Support</Text>
        <Text variant="bodySmall" color="textSecondary">How can we help you today?</Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>CONTACT CHANNELS</Text>
        <View style={styles.grid}>
          {contactOptions.map((opt, i) => (
            <SettingRow 
              key={i}
              label={opt.title}
              description={opt.desc}
              icon={opt.icon}
              onPress={opt.action}
              hideBorder={i === contactOptions.length - 1}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>SUBMIT A TICKET</Text>
        <Input 
            label="Message"
            value={supportMessage}
            onChangeText={setSupportMessage}
            placeholder="Describe your issue..."
            multiline
            style={{ height: 120, paddingTop: 16 }}
        />
        <Button 
            label="Submit Support Ticket"
            onPress={handleSubmitTicket}
            loading={isSubmittingTicket}
            style={{ marginTop: 16 }}
        />
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
        {faqData.map((faq, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[styles.faqItem, { borderBottomColor: colors.border }]}
            onPress={() => setSelectedFAQ(selectedFAQ === idx ? null : idx)}
          >
            <View style={styles.faqHeader}>
              <Question size={20} color={colors.primary} weight="duotone" />
              <Text variant="bodyMedium" bold style={{ flex: 1, marginLeft: 12 }}>{faq.q}</Text>
              {selectedFAQ === idx ? <CaretUp size={16} color={colors.textTertiary} /> : <CaretDown size={16} color={colors.textTertiary} />}
            </View>
            {selectedFAQ === idx && (
              <Text variant="caption" color="textSecondary" style={styles.faqBody}>
                {faq.a}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
         <Info size={20} color={colors.primary} weight="duotone" />
         <Text variant="caption" color="primary" style={{ flex: 1 }}>
            Our support team is available 24/7 to assist you. Responses typically take less than 30 minutes.
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
  grid: {
    backgroundColor: 'transparent',
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqBody: {
    marginTop: 12,
    marginLeft: 32,
    lineHeight: 18,
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