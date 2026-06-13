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

  async createVirtualAccount(userData: {
    email: string;
    name: string;
    phoneNumber: string;
  }) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'api-key': this.apiKey, // KEEP ONLY ONE AUTH METHOD
      };

      let formattedPhone = userData.phoneNumber.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = '0' + formattedPhone;
      }

      const requestData = {
        email: userData.email,
        name: userData.name,
        phoneNumber: formattedPhone,
        businessId: this.businessId,
      };

      console.log('🏦 PaymentPoint request:', requestData);

      const response = await axios.post(
        `${this.baseURL}/customer/create-virtual-account`,
        requestData,
        { headers }
      );

      console.log('✅ PaymentPoint response:', response.data);

      const resData = response.data;

      if (resData.status !== 'success' && resData.status !== true) {
        return {
          success: false,
          message: resData.message || 'PaymentPoint error',
          data: resData,
        };
      }

      return {
        success: true,
        data: resData,
      };
    } catch (error: any) {
      console.log('❌ PAYMENTPOINT ERROR:', error.response?.data || error.message);

      return {
        success: false,
        message: error.response?.data?.message || 'Request failed',
        error: error.response?.data || error.message,
      };
    }
  }
}

export default new PaymentPointService();
