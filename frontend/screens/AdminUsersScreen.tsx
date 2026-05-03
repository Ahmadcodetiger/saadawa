import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MagnifyingGlass, XCircle, User, Bell, CaretRight, Users } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Input } from '../src/components/atoms/Input';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { useAlert } from '@/components/AlertContext';
import { adminService } from '@/services/admin.service';

interface AdminUserItem {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended' | string;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showError } = useAlert();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const pageSize = 20;
  const debouncedQuery = useDebounce(query, 500);

  const loadUsers = useCallback(async (reset = false) => {
    try {
      if (reset) setIsLoading(true);
      const currentPage = reset ? 1 : page;
      const res = await adminService.getAllUsers(currentPage, pageSize, debouncedQuery || undefined);
      
      if (res?.success) {
        const list = res.data?.users || res.data?.items || [];
        const totalCount = res.data?.total || list.length;
        setUsers(prev => (reset ? list : [...prev, ...list]));
        setTotal(totalCount);
        if (reset) setPage(1);
      }
    } catch (e: any) {
      showError(e.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedQuery]);

  useEffect(() => { loadUsers(true); }, [debouncedQuery]);

  useEffect(() => { if (page > 1) loadUsers(false); }, [page]);

  const renderItem = ({ item }: { item: AdminUserItem }) => (
    <TouchableOpacity style={[styles.userCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text variant="bodySmall" bold style={{ color: 'white' }}>
          {`${(item.first_name || '').charAt(0)}${(item.last_name || '').charAt(0)}`.toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text variant="bodyMedium" bold>{`${item.first_name} ${item.last_name}`}</Text>
        <Text variant="caption" color="textSecondary">{item.email}</Text>
      </View>
      <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) + '15' }]}>
        <Text variant="caption" bold style={{ color: getStatusColor(item.status), fontSize: 10 }}>
            {item.status.toUpperCase()}
        </Text>
      </View>
      <CaretRight size={16} color={colors.textTertiary} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper noScroll>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
            <Text variant="headingMedium" bold>Users</Text>
            <Text variant="bodySmall" color="textSecondary">Manage system accounts ({total})</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/admin-notifications')}>
            <Bell size={22} color={colors.textPrimary} weight="duotone" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Input 
            placeholder="Search name or email..."
            value={query}
            onChangeText={setQuery}
            leftIcon={<MagnifyingGlass size={18} color={colors.textTertiary} />}
            rightIcon={query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery('')}>
                    <XCircle size={18} color={colors.textTertiary} weight="fill" />
                </TouchableOpacity>
            ) : null}
        />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReached={() => users.length < total && setPage(p => p + 1)}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUsers(true)} tintColor={colors.primary} />}
        ListEmptyComponent={!isLoading ? (
            <View style={styles.empty}>
                <Users size={48} color={colors.textTertiary} weight="thin" />
                <Text variant="bodyMedium" color="textSecondary" style={{ marginTop: 12 }}>No users found</Text>
            </View>
        ) : null}
        ListFooterComponent={isLoading && users.length > 0 ? <ActivityIndicator color={colors.primary} style={{ margin: 20 }} /> : null}
      />
    </ScreenWrapper>
  );
}

const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
        case 'active': return '#10B981';
        case 'suspended': return '#EF4444';
        default: return '#6B7280';
    }
};

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<any>(null);
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeoutRef.current);
  }, [value, delay]);
  return debounced;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  searchBox: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
});
