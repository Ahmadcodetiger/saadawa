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

      // If bank accounts are empty, the customer likely already exists on PaymentPoint.
      // Attempt to fetch their existing reserved accounts.
      if (!data.bankAccounts || data.bankAccounts.length === 0) {
        console.warn('⚠️ bankAccounts empty — customer may already exist. Fetching existing accounts...');

        const customerId = data.customer?.customer_id;
        const email = userData.email;

        if (customerId || email) {
          const existingAccounts = await this.fetchExistingAccounts({ customerId, email });
          if (existingAccounts && existingAccounts.length > 0) {
            console.log('✅ Fetched existing bank accounts:', existingAccounts);
            data.bankAccounts = existingAccounts;
          } else {
            console.error('❌ Could not fetch existing accounts. Manual intervention may be needed.');
          }
        }
      }

      return { success: true, data };
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
   * Try multiple PaymentPoint endpoints to fetch existing reserved accounts
   * for a customer that was already registered.
   */
  async fetchExistingAccounts({
    customerId,
    email,
  }: {
    customerId?: string;
    email?: string;
  }): Promise<any[]> {
    // Endpoint candidates based on common PaymentPoint API patterns
    const endpoints: string[] = [];

    if (customerId) {
      endpoints.push(
        `${this.baseURL}/getCustomerAccounts/${customerId}`,
        `${this.baseURL}/customer/${customerId}/accounts`,
        `${this.baseURL}/customer/${customerId}`,
        `${this.baseURL}/virtualAccount/customer/${customerId}`,
        `${this.baseURL}/reservedAccount/${customerId}`,
      );
    }
    if (email) {
      endpoints.push(
        `${this.baseURL}/getCustomerByEmail?email=${encodeURIComponent(email)}`,
        `${this.baseURL}/customer?email=${encodeURIComponent(email)}`,
      );
    }

    for (const url of endpoints) {
      try {
        console.log(`🔍 Trying: GET ${url}`);
        const response = await axios.get(url, { headers: this.headers });
        const d = response.data;

        // Accept any shape that has an accounts array
        const accounts =
          d?.bankAccounts ||
          d?.data?.bankAccounts ||
          d?.accounts ||
          d?.data?.accounts ||
          d?.reservedAccounts;

        if (accounts && accounts.length > 0) {
          console.log(`✅ Found accounts at: ${url}`);
          return accounts;
        }
      } catch (e: any) {
        const status = e.response?.status;
        const msg = e.response?.data?.message || e.message;
        console.warn(`  ↳ ${url} → ${status ?? 'ERR'}: ${msg}`);
      }
    }

    return [];
  }
}

export default new PaymentPointService();
