import axios from 'axios';
import crypto from 'crypto';

const WEBHOOK_URL = 'http://localhost:8000/api/payment-point/webhook';
const SECRET = '80a1afa83da1838d70e59d006e7a837bc89a979e11c10bc9b94e13ceaa4d4bf31aebe2b5e7b0f4a4940e1d25d19947d3f6af49e59c7de99182d80aab'; // From .env
// IMPORTANT: Use an account number that exists in your database!
const ACCOUNT_NUMBER = '6657121838'; 

async function sendWebhook(name: string, payload: any) {
  console.log(`\n🚀 Testing: ${name}...`);
  const rawBody = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'paymentpoint-signature': signature
      }
    });
    console.log(`✅ [${name}] Response:`, response.status, response.data);
  } catch (error: any) {
    console.error(`❌ [${name}] Error:`, error.response?.data || error.message);
  }
}

async function runTests() {
  // Test 1: Official Documentation Structure
  await sendWebhook('Official Doc Payload', {
    notification_status: "payment_successful",
    transaction_id: "TX_" + Date.now(),
    amount_paid: 100,
    settlement_amount: 99.5,
    transaction_status: "success",
    receiver: {
      account_number: ACCOUNT_NUMBER,
      bank: "PalmPay"
    },
    customer: {
      email: "test@example.com"
    }
  });

  // Test 2: Nested Data Structure (Fallback)
  await sendWebhook('Legacy Nested Data', {
    data: {
      accountNumber: ACCOUNT_NUMBER,
      amount: 50,
      transactionReference: 'REF_NESTED_' + Date.now()
    }
  });
}

runTests();
