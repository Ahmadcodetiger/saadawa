import axios from 'axios';
import https from 'https';

// Force IPv4 — the PaymentPoint host advertises IPv6 (64:ff9b::a2f6:fd30)
// which is unreachable from this server, causing Node.js AggregateError timeouts.
const ipv4Agent = new https.Agent({ family: 4 });

class PaymentPointService {
  private baseURL = 'https://api.paymentpoint.co/api/v1';
  private apiKey = process.env.PAYMENTPOINT_API_KEY || '';
  private apiSecret = process.env.PAYMENTPOINT_API_SECRET || '';
  private businessId = process.env.PAYMENTPOINT_BUSINESS_ID || '';

  constructor() {
    this.baseURL = process.env.PAYMENTPOINT_BASE_URL || 'https://api.paymentpoint.co/api/v1';
    this.apiKey = process.env.PAYMENTPOINT_API_KEY || '';
    this.apiSecret = process.env.PAYMENTPOINT_API_SECRET || '';
    this.businessId = process.env.PAYMENTPOINT_BUSINESS_ID || '';
  }

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

      const enabledBanksStr = process.env.PAYMENTPOINT_ENABLED_BANKS || '20946,20897';
      const bankCodes = enabledBanksStr.split(',').map(s => s.trim());

      const requestData: any = {
        email: userData.email,
        name: userData.name,
        phoneNumber: formattedPhone,
        bankCode: bankCodes,
        businessId: this.businessId,
      };

      if (userData.idType && userData.idNumber) {
        requestData.idType = userData.idType;
        requestData.idNumber = userData.idNumber;
      }

      console.log('🏦 Creating PaymentPoint virtual account request:', requestData);

      const response = await axios.post(
        `${this.baseURL}/createVirtualAccount`,
        requestData,
        { headers: this.headers, httpsAgent: ipv4Agent, timeout: 30000 }
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
      console.error('❌ PaymentPoint error:', error.response?.data || error.message);
      let apiMsg = '';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          apiMsg = data;
        } else {
          apiMsg = data.message || data.error || (data.errors ? (Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors)) : '') || JSON.stringify(data);
        }
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('ETIMEDOUT')) {
        apiMsg = 'Connection to PaymentPoint API timed out. Please check your network connection.';
      } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
        apiMsg = 'PaymentPoint API host is unreachable. Please check your DNS or internet connection.';
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        apiMsg = 'Connection to PaymentPoint API was refused. The API server may be offline.';
      }
      return {
        success: false,
        message: apiMsg || error.message || 'Failed to create virtual account',
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
        const response = await axios.get(url, { headers: this.headers, httpsAgent: ipv4Agent, timeout: 15000 });
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
