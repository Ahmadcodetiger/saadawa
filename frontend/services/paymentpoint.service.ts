import api from './api';

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
   * Get user's PaymentPoint virtual account details
   */
  getVirtualAccount: async (): Promise<PaymentPointAccount | { exists: boolean } | null> => {
    try {
      console.log('🔍 Fetching PaymentPoint virtual account...');
      const response = await api.get<PaymentPointResponse<PaymentPointAccount | { exists: boolean }>>('/payment-point/virtual-account');
      
      if (response.data.success && response.data.data) {
        return response.data.data as any; // The UI handles { exists: false }
      }
      
      return { exists: false };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      console.error('❌ Failed to fetch virtual account:', error);
      throw error.response?.data || { message: error.message };
    }
  },
};
