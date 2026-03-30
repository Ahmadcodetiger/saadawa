import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  CheckCircle, 
  Wallet, 
  XCircle, 
  Gift, 
  Bell, 
  CaretRight,
  Info
} from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { useAlert } from '@/components/AlertContext';
import { notificationsService, Notification } from '@/services/notifications.service';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsService.getNotifications(1, 50);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      showSuccess('All marked as read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      showError('Failed to mark all as read');
    }
  };

  const handleReadNotification = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await notificationsService.markAsRead(notification._id);
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        // Soft fail
      }
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'transaction': return CheckCircle;
      case 'system': return Bell;
      case 'promotion': return Gift;
      case 'alert': return Info;
      default: return Bell;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'transaction': return colors.success;
      case 'system': return colors.primary;
      case 'promotion': return colors.secondary;
      case 'alert': return colors.warning;
      default: return colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && notifications.length === 0) {
    return (
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper 
       scroll 
       refreshControl={
         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
       }
    >
      <View style={styles.header}>
        <View>
          <Text variant="headingMedium" bold>Notifications</Text>
          <Text variant="bodySmall" color="textSecondary">Stay updated on your activities</Text>
        </View>
        <TouchableOpacity onPress={handleMarkAllRead}>
           <Text variant="caption" color="primary" bold>MARK ALL READ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
          {notifications.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text variant="bodyMedium" color="textTertiary">No notifications yet</Text>
            </View>
          ) : (
            notifications.map((n) => {
                const IconComp = getIconForType(n.type);
                const iconColor = getColorForType(n.type);
                
                return (
                  <TouchableOpacity 
                    key={n._id} 
                    style={[
                        styles.item, 
                        { backgroundColor: !n.is_read ? colors.primaryLight : colors.surface }
                    ]}
                    onPress={() => handleReadNotification(n)}
                  >
                      <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
                          <IconComp size={24} color={iconColor} weight="duotone" />
                      </View>
                      <View style={{ flex: 1 }}>
                          <View style={styles.row}>
                              <Text variant="bodyMedium" bold style={{ color: !n.is_read ? colors.primary : colors.textPrimary }}>
                                  {n.title}
                              </Text>
                              {!n.is_read && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
                          </View>
                          <Text variant="caption" color="textSecondary" numberOfLines={2}>
                              {n.message}
                          </Text>
                          <Text variant="caption" color="textTertiary" style={{ marginTop: 4 }}>
                              {formatDate(n.created_at)}
                          </Text>
                      </View>
                  </TouchableOpacity>
                );
            })
          )}
      </View>

      <View style={[styles.info, { backgroundColor: colors.primaryLight }]}>
         <Bell size={20} color={colors.primary} weight="duotone" />
         <Text variant="caption" color="primary" style={{ flex: 1 }}>
            Notification settings can be managed in the Settings menu.
         </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
