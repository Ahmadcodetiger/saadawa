
import api from './api';

export interface Network {
  network_id: string;
  name: string;
  network_code: string;
  description?: string;
}

export interface DataPlan {
  plan_id: string;
  network: string;
  plan_name: string;
  plan_type: string;
  validity: string;
  price: number;
  data_value: string;
}

export interface AirtimePurchaseData {
  network: string;
  phone: string;
  amount: number;
  airtime_type?: 'VTU' | 'SHARE_AND_SELL';
  ported_number?: boolean;
  pin?: string;
}

export interface DataPurchaseData {
  network: string;
  phone: string;
  plan: string;
  ported_number?: boolean;
  pin?: string;
}

export interface BillPaymentResponse {
  success: boolean;
  message: string;
  data?: any;
  networks?: Network[];
  plans?: DataPlan[];
}

/**
 * Helper to normalize API responses
 * Handles different response shapes from backend
 */
const normalizeResponse = (response: any): BillPaymentResponse => {
  // If response is already in expected format
  if (response && typeof response.success === 'boolean') {
    return response;
  }

  // If response has data wrapper
  if (response?.data && typeof response.data.success === 'boolean') {
    return response.data;
  }

  // Fallback: wrap response as data
  return {
    success: true,
    message: 'Success',
    data: response,
  };
};

/**
 * Helper to normalize error responses
 */
const normalizeError = (error: any, fallbackMessage: string): BillPaymentResponse => {
  const errorData = error?.response?.data;

  // Log error for debugging
  console.error(`❌ Bill Payment Error: ${fallbackMessage}`, {
    status: error?.response?.status,
    data: errorData,
    message: error?.message,
  });

  // If error response has expected structure
  if (errorData && typeof errorData.success === 'boolean') {
    return errorData;
  }

  // If error response has message
  if (errorData?.message) {
    return {
      success: false,
      message: errorData.message,
    };
  }

  // Fallback error
  return {
    success: false,
    message: error?.message || fallbackMessage,
  };
};

export const billPaymentService = {
  /**
   * Get available networks
   */
  getNetworks: async (): Promise<BillPaymentResponse> => {
    try {
      console.log('📡 Fetching networks...');
      const response = await api.get<BillPaymentResponse>('/billpayment/networks');
      console.log('✅ Networks response:', response.data);

      const normalized = normalizeResponse(response.data);

      // Handle networks array in different locations
      if (!normalized.networks) {
        normalized.networks =
          response.data?.networks ||
          response.data?.data?.networks ||
          response.data?.data ||
          (Array.isArray(response.data) ? response.data : undefined);
      }

      return normalized;
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to fetch networks');
      throw normalizedError;
    }
  },

  /**
   * Get data plans
   */
  getDataPlans: async (network?: string): Promise<BillPaymentResponse> => {
    try {
      console.log('📶 Fetching data plans...', { network });
      const response = await api.get<BillPaymentResponse>('/billpayment/data-plans', {
        params: network ? { network } : undefined,
      });
      console.log('✅ Data plans response:', response.data);

      const normalized = normalizeResponse(response.data);

      // Handle plans array in different locations
      if (!normalized.plans) {
        normalized.plans =
          response.data?.plans ||
          response.data?.data?.plans ||
          response.data?.data ||
          (Array.isArray(response.data) ? response.data : undefined);
      }

      return normalized;
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to fetch data plans');
      throw normalizedError;
    }
  },

  /**
   * Purchase airtime
   */
  purchaseAirtime: async (data: AirtimePurchaseData): Promise<BillPaymentResponse> => {
    try {
      console.log('📱 Purchasing airtime:', {
        network: data.network,
        phone: data.phone,
        amount: data.amount,
        airtime_type: data.airtime_type,
      });

      const response = await api.post<BillPaymentResponse>('/billpayment/airtime', data);
      console.log('✅ Airtime purchase response:', response.data);

      return normalizeResponse(response.data);
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to purchase airtime');
      throw normalizedError;
    }
  },

  /**
   * Purchase data
   */
  purchaseData: async (data: DataPurchaseData): Promise<BillPaymentResponse> => {
    try {
      console.log('📶 Purchasing data:', {
        network: data.network,
        phone: data.phone,
        plan: data.plan,
      });

      const response = await api.post<BillPaymentResponse>('/billpayment/data', data);
      console.log('✅ Data purchase response:', response.data);

      return normalizeResponse(response.data);
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to purchase data');
      throw normalizedError;
    }
  },

  /**
   * Verify cable account
   */
  verifyCableAccount: async (
    provider: string,
    iucnumber: string
  ): Promise<BillPaymentResponse> => {
    try {
      console.log('📺 Verifying cable account:', { provider, iucnumber });
      const response = await api.post<BillPaymentResponse>('/billpayment/cable/verify', {
        provider,
        iucnumber,
      });
      console.log('✅ Cable verify response:', response.data);

      return normalizeResponse(response.data);
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to verify cable account');
      throw normalizedError;
    }
  },

  /**
   * Purchase cable TV
   */
  purchaseCableTV: async (data: any): Promise<BillPaymentResponse> => {
    try {
      console.log('📺 Purchasing cable TV:', data);
      const response = await api.post<BillPaymentResponse>('/billpayment/cable/purchase', data);
      console.log('✅ Cable purchase response:', response.data);

      return normalizeResponse(response.data);
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to purchase cable TV');
      throw normalizedError;
    }
  },

  /**
   * Verify electricity meter
   */
  verifyElectricityMeter: async (
    provider: string,
    meternumber: string,
    metertype: string
  ): Promise<BillPaymentResponse> => {
    try {
      console.log('💡 Verifying electricity meter:', { provider, meternumber, metertype });
      const response = await api.post<BillPaymentResponse>('/billpayment/electricity/verify', {
        provider,
        meternumber,
        metertype,
      });
      console.log('✅ Electricity verify response:', response.data);

      return normalizeResponse(response.data);
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to verify meter');
      throw normalizedError;
    }
  },

  /**
   * Purchase electricity
   */
  purchaseElectricity: async (data: any): Promise<BillPaymentResponse> => {
    try {
      console.log('💡 Purchasing electricity:', data);
      const response = await api.post<BillPaymentResponse>('/billpayment/electricity/purchase', data);
      console.log('✅ Electricity purchase response:', response.data);

      return normalizeResponse(response.data);
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to purchase electricity');
      throw normalizedError;
    }
  },

  /**
   * Get transaction status
   */
  getTransactionStatus: async (reference: string): Promise<BillPaymentResponse> => {
    try {
      console.log('🔍 Getting transaction status:', { reference });
      const response = await api.get<BillPaymentResponse>(
        `/billpayment/transaction/${reference}`
      );
      console.log('✅ Transaction status response:', response.data);

      return normalizeResponse(response.data);
    } catch (error: any) {
      const normalizedError = normalizeError(error, 'Failed to get transaction status');
      throw normalizedError;
    }
  },
};
