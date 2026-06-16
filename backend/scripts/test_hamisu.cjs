require('dotenv').config();
const axios = require('axios');
const https = require('https');

// Force IPv4 to avoid IPv6 ENETUNREACH / ETIMEDOUT AggregateError
const ipv4Agent = new https.Agent({ family: 4 });

const BASE_URL = process.env.PAYMENTPOINT_BASE_URL || 'https://api.paymentpoint.co/api/v1';

async function testHamisu() {
  const headers = {
    'Authorization': `Bearer ${process.env.PAYMENTPOINT_API_SECRET}`,
    'Content-Type': 'application/json',
    'api-key': process.env.PAYMENTPOINT_API_KEY,
  };

  const requestData = {
    email: 'hamisu@gmail.com',
    name: 'Hamisu Garba',
    phoneNumber: '08122553344',
    bankCode: ['20946'],
    businessId: process.env.PAYMENTPOINT_BUSINESS_ID,
    idType: 'nin',
    idNumber: '96566615403',
  };

  console.log('Base URL:', BASE_URL);
  console.log('Sending request to PaymentPoint...');
  console.log('Request data:', JSON.stringify(requestData, null, 2));

  try {
    const response = await axios.post(
      `${BASE_URL}/createVirtualAccount`,
      requestData,
      { headers, httpsAgent: ipv4Agent, timeout: 30000 }
    );
    console.log('\n✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ API Call Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response body:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      if (error.errors) {
        error.errors.forEach((e, i) => {
          console.error(`  Sub-error ${i}:`, e.code, e.address, e.port, e.message);
        });
      }
    }
  }
}

testHamisu();
