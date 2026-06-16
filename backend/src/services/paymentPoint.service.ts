import axios from 'axios';

class PaymentPointService {
  private baseURL: string;
  private apiKey: string;
  private apiSecret: string;
  private businessId: string;

  constructor() {
    this.baseURL = 'https://api.paymentpoint.co/api/v1';
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

      const requestData: Record<string, any> = {
        email: userData.email,
        name: userData.name,
        phoneNumber: formattedPhone,

        bankCode: ['20946', '20897'],
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
        { headers }
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
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create virtual account',
      };
    }
  }
}

export default new PaymentPointService();
