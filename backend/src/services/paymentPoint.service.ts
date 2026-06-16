import axios from 'axios';
import https from 'https';

// Force IPv4 — the PaymentPoint host advertises IPv6 (64:ff9b::a2f6:fd30)
// which is unreachable from this server, causing Node.js AggregateError timeouts.
const ipv4Agent = new https.Agent({ family: 4 });

class PaymentPointService {
  private baseURL: string;
  private apiKey: string;
  private apiSecret: string;
  private businessId: string;

  constructor() {
    this.baseURL = process.env.PAYMENTPOINT_BASE_URL || 'https://api.paymentpoint.co/api/v1';
    this.apiKey = process.env.PAYMENTPOINT_API_KEY || '';
    this.apiSecret = process.env.PAYMENTPOINT_API_SECRET || '';
    this.businessId = process.env.PAYMENTPOINT_BUSINESS_ID || '';
  }

  async createVirtualAccount(userData: { email: string; name: string; phoneNumber: string; idType?: 'bvn' | 'nin'; idNumber?: string }) {
    try {
      const headers = {
        'Authorization': `Bearer ${this.apiSecret}`,
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      };

      let formattedPhone = userData.phoneNumber.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = '0' + formattedPhone;
      }

      const enabledBanksStr = process.env.PAYMENTPOINT_ENABLED_BANKS || '20946,20897';
      const bankCodes = enabledBanksStr.split(',').map(s => s.trim());

      const requestData: Record<string, any> = {
        email: userData.email,
        name: userData.name,
        phoneNumber: formattedPhone,

        bankCode: bankCodes,
        businessId: this.businessId,
      };

      // Attach identity verification if provided
      if (userData.idType && userData.idNumber) {
        requestData.idType = userData.idType;
        requestData.idNumber = userData.idNumber;
      }

      console.log('🏦 Creating PaymentPoint virtual account:', requestData);

      const response = await axios.post(
        `${this.baseURL}/createVirtualAccount`,
        requestData,
        { headers, httpsAgent: ipv4Agent, timeout: 30000 }
      );

      console.log('✅ Virtual account created:', response.data);
      
      const resData = response.data;

      // PaymentPoint API returns success/error status in the body
      if (resData.status !== 'success' && resData.status !== true) {
        return {
          success: false,
          message: resData.message || 'PaymentPoint returned an error',
          data: resData
        };
      }

      return {
        success: true,
        data: resData,
      };
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
      };
    }
  }
}

export default new PaymentPointService();
