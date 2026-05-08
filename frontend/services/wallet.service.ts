import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLET_CACHE_KEY = 'walletData'; // shared with api.ts

export interface WalletData {
  _id: string;
  user_id: string;
  balance: number;
  currency: string;
  last_transaction_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WalletResponse {
  success: boolean;
  data: WalletData;
  message: string;
}

export const walletService = {
  /**
   * Get wallet — reads from AsyncStorage cache first, falls back to API.
   * This makes the dashboard instant on revisit.
   */
  getWallet: async (): Promise<WalletResponse> => {
    try {
      // 1. Try cache first — return instantly if available
      const cached = await AsyncStorage.getItem(WALLET_CACHE_KEY);
      if (cached) {
        const walletObj = JSON.parse(cached);
        // api.ts caches just the wallet object; wrap it in WalletResponse shape
        const walletData: WalletData = walletObj?.balance !== undefined
          ? walletObj
          : walletObj?.data ?? walletObj;
        return { success: true, data: walletData, message: 'from cache' };
      }
    } catch (e) {
      console.log('Wallet cache read error:', e);
    }
    // 2. No cache — fetch from API and cache result
    return walletService.fetchAndCache();
  },

  /**
   * Force-fetch from backend and update cache. Call on pull-to-refresh.
   */
  fetchAndCache: async (): Promise<WalletResponse> => {
    try {
      const response = await api.get<WalletResponse>('/wallet');
      const data = response.data;
      // Cache the wallet object (same key/format api.ts uses)
      const walletObj = (data as any)?.data ?? data;
      await AsyncStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(walletObj));
      // Normalise to WalletResponse
      if ((data as any)?.data) {
        return { success: true, data: (data as any).data, message: '' };
      }
      return data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Failed to fetch wallet' };
    }
  },

  /**
   * Fund wallet (initiate payment)
   */
  fundWallet: async (amount: number, gateway?: string): Promise<any> => {
    try {
      const response = await api.post('/wallet/fund', {
        amount,
        gateway,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Wallet funding failed' };
    }
  },

  /**
   * Get wallet transactions
   */
  getWalletTransactions: async (page: number = 1, limit: number = 20): Promise<any> => {
    try {
      const response = await api.get('/wallet/transactions', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Failed to fetch wallet transactions' };
    }
  },

  /**
   * Transfer funds to another user
   */
  transferFunds: async (recipient: string, amount: number, note?: string): Promise<any> => {
    try {
      const response = await api.post('/wallet/transfer', {
        recipient,
        amount,
        note,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Transfer failed' };
    }
  },

  /**
   * Adjust balance (admin only)
   */
  adjustBalance: async (userId: string, amount: number, reason: string): Promise<any> => {
    try {
      const response = await api.put('/wallet/adjust', {
        user_id: userId,
        amount,
        reason,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Balance adjustment failed' };
    }
  },
};
