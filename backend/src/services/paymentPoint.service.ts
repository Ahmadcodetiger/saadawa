import axios from 'axios';

class PaymentPointService {
  private baseURL = 'https://api.paymentpoint.co/api/v1';
  private apiKey = process.env.PAYMENTPOINT_API_KEY || '';
  private apiSecret = process.env.PAYMENTPOINT_API_SECRET || '';
  private businessId = process.env.PAYMENTPOINT_BUSINESS_ID || '';

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiSecret}`,
      'api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async createVirtualAccount(userData: {
    email: string;
    name: string;
    phoneNumber: string;
    idType?: 'bvn' | 'nin';
    idNumber?: string;
  }) {
    try {
      let formattedPhone = userData.phoneNumber.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = '0' + formattedPhone;
      }

      const requestData: any = {
        email: userData.email,
        name: userData.name,
        phoneNumber: formattedPhone,
        bankCode: ['20946', '20897'],
        businessId: this.businessId,
      };

      // optional identity fields
      if (userData.idType && userData.idNumber) {
        requestData.idType = userData.idType;
        requestData.idNumber = userData.idNumber;
      }

      console.log('🏦 PaymentPoint Request:', requestData);

      const response = await axios.post(
        `${this.baseURL}/createVirtualAccount`,
        requestData,
        { headers: this.headers }
      );

      console.log('✅ PaymentPoint Response:', response.data);

      const data = response.data;

      // If bank accounts are empty, log and try fetching existing accounts
      if (!data.bankAccounts || data.bankAccounts.length === 0) {
        console.warn('⚠️ PaymentPoint returned empty bankAccounts. Errors:', data.errors);
        console.warn('⚠️ Attempting to fetch existing accounts for customer:', data.customer?.customer_id);

        if (data.customer?.customer_id) {
          const existingAccounts = await this.getCustomerAccounts(data.customer.customer_id);
          if (existingAccounts && existingAccounts.length > 0) {
            console.log('✅ Found existing bank accounts via fallback fetch:', existingAccounts);
            data.bankAccounts = existingAccounts;
          } else {
            console.error('❌ No existing accounts found either. Bank codes may not be enabled on this merchant account.');
          }
        }
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.log('❌ PaymentPoint Error:', error.response?.data || error.message);

      return {
        success: false,
        message: error.response?.data?.message || 'Request failed',
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Attempt to fetch existing bank accounts for a customer who was already registered.
   * Called as a fallback when createVirtualAccount returns bankAccounts: [].
   */
  async getCustomerAccounts(customerId: string): Promise<any[]> {
    try {
      // Try common PaymentPoint endpoints for fetching customer accounts
      const endpoints = [
        `${this.baseURL}/getCustomerAccounts/${customerId}`,
        `${this.baseURL}/customer/${customerId}/accounts`,
        `${this.baseURL}/virtualAccount/${customerId}`,
      ];

      for (const url of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${url}`);
          const response = await axios.get(url, { headers: this.headers });
          const accounts = response.data?.bankAccounts || response.data?.data?.bankAccounts || response.data?.accounts;
          if (accounts && accounts.length > 0) {
            return accounts;
          }
        } catch (e: any) {
          // Endpoint doesn't exist or returned error — try next
          console.warn(`  ↳ ${url} failed: ${e.response?.status} ${e.response?.data?.message || e.message}`);
        }
      }

      return [];
    } catch (error: any) {
      console.error('❌ getCustomerAccounts error:', error.message);
      return [];
    }
  }
}

export default new PaymentPointService();
