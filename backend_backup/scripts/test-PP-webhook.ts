import axios from 'axios';

const WEBHOOK_URL = 'http://localhost:8000/api/payment-point/webhook';
// Use an account number that exists in your database for testing
const ACCOUNT_NUMBER = '9999914106'; // Example based on earlier logs/context
const REF = 'TEST_TX_' + Date.now();

const payload = {
  data: {
    accountNumber: ACCOUNT_NUMBER,
    amount: 100,
    transactionReference: REF,
    status: 'success'
  }
};

async function testWebhook() {
  try {
    console.log(`🚀 Sending test webhook to ${WEBHOOK_URL}...`);
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Response:', response.status, response.data);
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testWebhook();
