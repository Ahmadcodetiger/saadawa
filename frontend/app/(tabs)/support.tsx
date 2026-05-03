import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { 
  ChatTeardropDots, 
  PhoneCall, 
  Envelope, 
  WhatsappLogo, 
  CaretDown, 
  CaretUp, 
  Question 
} from 'phosphor-react-native';

import { useAppTheme } from "@/src/theme/ThemeContext";
import { Text } from "@/src/components/atoms/Text";
import { ScreenWrapper } from "@/src/components/templates/ScreenWrapper";
import { supportService, SupportContent } from "@/services/support.service";

export default function SupportScreen() {
  const { colors, isDark } = useAppTheme();
  const [selectedFAQ, setSelectedFAQ] = useState<number | null>(null);
  const [supportContent, setSupportContent] = useState<SupportContent | null>(null);

  useEffect(() => {
    fetchSupportContent();
  }, []);

  const fetchSupportContent = async () => {
    try {
      const response = await supportService.getSupportContent();
      if (response.success) {
        setSupportContent(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch support content:', error);
    }
  };

  const supportOptions = [
    {
      icon: ChatTeardropDots,
      label: "Live Chat",
      description: "Chat with our support team",
      color: "#5B6AF0"
    },
    {
      icon: PhoneCall,
      label: "Call Us",
      description: supportContent?.phoneNumber || "Loading...",
      color: "#3B9EEB"
    },
    {
      icon: Envelope,
      label: "Email Support",
      description: supportContent?.email || "Loading...",
      color: "#E040A0"
    },
    {
      icon: WhatsappLogo,
      label: "WhatsApp",
      description: supportContent?.whatsappNumber || "Loading...",
      color: "#25D366"
    },
  ];

  const faqData = [
    {
      question: 'How do I buy airtime or data?',
      answer: 'To buy airtime or data, go to the home screen and select either "Buy Airtime" or "Buy Data". Choose your network provider, enter the phone number, select the amount, and confirm your purchase.'
    },
    {
      question: 'How long does it take for transactions to be processed?',
      answer: 'Most transactions are processed instantly. However, in some cases, it may take up to 5 minutes. If your transaction takes longer than expected, please contact our support team.'
    },
    {
      question: 'How do I add money to my wallet?',
      answer: 'You can add money to your wallet by tapping "Add Money" on the home screen. Choose your preferred payment method (bank transfer, card payment, or USSD) and follow the instructions.'
    },
    {
      question: 'What should I do if a transaction fails?',
      answer: 'If a transaction fails, the amount will be automatically refunded to your wallet within 24 hours. If you don\'t receive your refund, please contact our support team with your transaction reference.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Profile > Security > Change Password. Enter your current password and your new password. Make sure your new password is at least 8 characters long and includes letters and numbers.'
    },
    {
      question: 'Is my money safe in the app?',
      answer: 'Yes, your money is completely safe. We use bank-level security encryption and comply with all financial regulations. Your wallet funds are held in secure escrow accounts.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setSelectedFAQ(selectedFAQ === index ? null : index);
  };

  return (
    <ScreenWrapper scroll>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Support</Text>
        <Text variant="bodySmall" color="textSecondary">How can we help you today?</Text>
      </View>

      {/* Contact Options */}
      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          CONTACT US
        </Text>
        <View style={styles.optionsGrid}>
          {supportOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionCard, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => {
                if (option.label === "Call Us") {
                  if (supportContent?.phoneNumber) {
                    Linking.openURL(`tel:${supportContent.phoneNumber.replace(/\s+/g, "")}`);
                  }
                } else if (option.label === "Email Support") {
                  if (supportContent?.email) {
                    Linking.openURL(`mailto:${supportContent.email}`);
                  }
                } else if (option.label === "Live Chat") {
                  Alert.alert("Live Chat", "Live chat feature coming soon!");
                } else if (option.label === "WhatsApp") {
                  if (supportContent?.whatsappNumber) {
                    const cleanNumber = supportContent.whatsappNumber.replace(/[^0-9]/g, '');
                    const message = "Hello! I need some help regarding your app.";
                    const whatsappURL = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;

                    Linking.canOpenURL(whatsappURL)
                      .then((supported) => {
                        if (!supported) {
                          return Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`);
                        } else {
                          return Linking.openURL(whatsappURL);
                        }
                      })
                      .catch((err) => console.error("An error occurred", err));
                  }
                }
              }}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDark
                      ? `${option.color}20`
                      : `${option.color}10`,
                  },
                ]}
              >
                <option.icon
                  size={24}
                  color={option.color}
                  weight="duotone"
                />
              </View>
              <Text variant="bodyMedium" bold style={{ marginBottom: 4 }}>
                {option.label}
              </Text>
              <Text
                variant="caption"
                color="textSecondary"
                style={{ textAlign: "center" }}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* FAQs */}
      <View style={styles.section}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>
          FREQUENTLY ASKED QUESTIONS
        </Text>
        <View style={styles.faqList}>
          {faqData.map((faq, index) => (
            <View key={index} style={[styles.faqItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(index)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Question size={20} color={colors.primary} weight="duotone" />
                  <Text variant="bodyMedium" bold style={{ flex: 1, marginLeft: 12 }}>
                    {faq.question}
                  </Text>
                </View>
                {selectedFAQ === index ? 
                  <CaretUp size={16} color={colors.textTertiary} /> : 
                  <CaretDown size={16} color={colors.textTertiary} />
                }
              </TouchableOpacity>

              {selectedFAQ === index && (
                <View style={styles.faqAnswer}>
                  <Text variant="caption" color="textSecondary" style={styles.faqAnswerText}>
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 120 }} />
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
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  faqList: {
    gap: 0,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqAnswer: {
    paddingTop: 12,
    paddingRight: 32,
  },
  faqAnswerText: {
    lineHeight: 20,
    marginLeft: 32,
  },
});
