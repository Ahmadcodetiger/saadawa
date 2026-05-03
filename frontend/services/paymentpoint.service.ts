import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentPointCreateData {
  email: string;
  name: string;
  phoneNumber: string;
}

export interface PaymentPointAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  customerId: string;
  reference: string;
  provider: string;
  status: string;
}

export interface PaymentPointResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const paymentPointService = {
  /**
   * Create a new PaymentPoint virtual account
   */
  createVirtualAccount: async (data: PaymentPointCreateData): Promise<PaymentPointAccount> => {
    try {
      console.log('🏦 Creating PaymentPoint virtual account...');
      const response = await api.post<PaymentPointResponse<PaymentPointAccount>>('/payment-point/create-virtual-account', data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create virtual account');
    } catch (error: any) {
      console.error('❌ Failed to create virtual account:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get user's PaymentPoint virtual account details (uses cache if available)
   */
  getVirtualAccount: async (): Promise<PaymentPointAccount | { exists: boolean } | null> => {
    try {
      const cached = await AsyncStorage.getItem('virtualAccountData');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.log('Error reading virtual account cache', e);
    }
    
    return paymentPointService.fetchAndCacheVirtualAccount();
  },

  /**
   * Fetch user's PaymentPoint virtual account details from server and cache it
   */
  fetchAndCacheVirtualAccount: async (): Promise<PaymentPointAccount | { exists: boolean } | null> => {
    try {
      console.log('🔍 Fetching PaymentPoint virtual account...');
      const response = await api.get<PaymentPointResponse<PaymentPointAccount | { exists: boolean }>>('/payment-point/virtual-account');
      
      let result: any = { exists: false };
      
      if (response.data.success && response.data.data) {
        result = response.data.data;
      }
      
      // Cache the result
      await AsyncStorage.setItem('virtualAccountData', JSON.stringify(result));
      return result;
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        const notFoundResult = { exists: false };
        await AsyncStorage.setItem('virtualAccountData', JSON.stringify(notFoundResult));
        return notFoundResult;
      }
      console.error('❌ Failed to fetch virtual account:', error);
      throw error.response?.data || { message: error.message };
    }
  },
};
