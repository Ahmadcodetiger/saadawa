import axios from 'axios';

class PaymentPointService {
  private baseURL = 'https://api.paymentpoint.co/api/v1';
  private apiKey = process.env.PAYMENTPOINT_API_KEY || '';
  private apiSecret = process.env.PAYMENTPOINT_API_SECRET || '';
  private businessId = process.env.PAYMENTPOINT_BUSINESS_ID || '';

  async createVirtualAccount(userData: {
    email: string;
    name: string;
    phoneNumber: string;
    idType?: 'bvn' | 'nin';
    idNumber?: string;
  }) {
    try {
      const headers = {
        Authorization: `Bearer ${this.apiSecret}`,
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      };

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
        { headers }
      );

      console.log('✅ PaymentPoint Response:', response.data);

      return {
        success: true,
        data: response.data,
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
}

export default new PaymentPointService();
