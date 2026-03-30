import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Funnel } from 'phosphor-react-native';

import { useAppTheme } from '../../src/theme/ThemeContext';
import { Text } from '../../src/components/atoms/Text';
import { ScreenWrapper } from '../../src/components/templates/ScreenWrapper';
import { TransactionRow, TransactionType } from '../../src/components/molecules/TransactionRow';
import { Skeleton } from '../../src/components/atoms/LayoutAtoms';

import { transactionService, Transaction as ApiTransaction } from '@/services/transaction.service';
import TransactionFilter, { FilterOptions } from '@/components/TransactionFilter';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';

export default function TransactionsScreen() {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allTransactions, setAllTransactions] = useState<ApiTransaction[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    type: [],
    dateRange: 'all',
    amountRange: 'all',
  });
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactions(1, 50);
      if (response.success && Array.isArray(response.data)) {
        setAllTransactions(response.data);
      } else {
        setAllTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;
    if (filters.status.length > 0) {
      filtered = filtered.filter(t => filters.status.includes(t.status.charAt(0).toUpperCase() + t.status.slice(1)));
    }
    return filtered;
  }, [allTransactions, filters]);

  const mapType = (type: string): TransactionType => {
    switch (type) {
      case 'airtime_topup': return 'airtime';
      case 'data_purchase': return 'data';
      case 'bill_payment': return 'cable'; // Map generic bill to cable icon for now
      case 'wallet_topup': return 'wallet_topup';
      default: return 'transfer';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScreenWrapper
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text variant="headingMedium" bold>Activity</Text>
          <Text variant="bodySmall" color="textSecondary">All your transactions in one place</Text>
        </View>
        <View style={styles.filterBtn}>
           {/* Action here if needed */}
        </View>
      </View>

      {loading && allTransactions.length === 0 ? (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
          ))}
        </View>
      ) : filteredTransactions.length > 0 ? (
        <View style={styles.list}>
          {filteredTransactions.map((t) => (
             <TransactionRow 
                key={t._id}
                type={mapType(t.type)}
                title={t.type.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                subtitle={`${formatDate(t.created_at)} • Ref: ${t.reference_number.slice(-6)}`}
                amount={t.amount}
                status={(['success', 'successful'].includes(t.status as string)) ? 'successful' : t.status === 'failed' ? 'failed' : 'pending' as any}
                onPress={() => {
                   setSelectedTransactionId(t._id);
                   setDetailsModalVisible(true);
                }}
             />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
           <Text variant="bodyLarge" color="textSecondary">No transactions found</Text>
        </View>
      )}

      <TransactionDetailsModal
        visible={detailsModalVisible}
        transactionId={selectedTransactionId}
        onClose={() => setDetailsModalVisible(false)}
      />

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
  filterBtn: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  empty: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

