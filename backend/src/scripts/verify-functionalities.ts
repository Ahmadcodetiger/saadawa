import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  validateStatus: () => true
});

async function runTests() {
  console.log('🧪 Starting VTU API verification tests...');
  
  // 1. Auth Login
  console.log('\n🔐 Testing Login...');
  const loginRes = await api.post('/auth/login', {
    email: 'realtest@example.com',
    password: 'password123'
  });
  
  if (loginRes.data.success) {
    const token = loginRes.data.data.token;
    console.log(`✅ Login successful, token received (length: ${token.length})`);
    console.log(`🔑 Token preview: ${token.substring(0, 20)}...`);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;


    
    // 2. Fetch Profile
    console.log('\n👤 Testing Profile fetch...');
    const profileRes = await api.get('/auth/me');
    if (profileRes.data.email === 'realtest@example.com') {
      console.log('✅ Profile fetched correctly');
    } else {
      console.log('❌ Profile fetch failed: ', profileRes.data);
    }
    
    // 3. Wallet Balance
    console.log('\n💰 Testing Wallet fetch...');
    const walletRes = await api.get('/wallet');
    if (walletRes.data.success) {
      console.log(`✅ Wallet balance: ₦${walletRes.data.data.balance}`);
    } else {
       console.log('❌ Wallet fetch failed: ', walletRes.data);
    }

    // 4. Data Plans (seeded)
    console.log('\n📱 Testing Data Plans (Service)...');
    const dataPlansRes = await api.get('/billpayment/data-plans?network=1');
    if (dataPlansRes.data.success) {
      console.log(`✅ Data plans retrieved, count: ${dataPlansRes.data.data.length}`);
    } else {
      console.log(`ℹ️ Data plans endpoint returned: ${dataPlansRes.data.message || 'Error'}`);
    }

    // 5. Create Virtual Account (PaymentPoint)
    console.log('\n🏦 Testing PaymentPoint Virtual Account creation...');
    const vaRes = await api.post('/payment-point/create-virtual-account', {});
    if (vaRes.data.success) {
      console.log('✅ Virtual Account FULL DATA:', JSON.stringify(vaRes.data.data, null, 2));
      console.log(`✅ Virtual Account created: ${vaRes.data.data.accountNumber} (${vaRes.data.data.bankName})`);
    } else {
       console.log('❌ Virtual Account creation failed: ', JSON.stringify(vaRes.data, null, 2));
    }

  } else {
    console.log('❌ Login failed: ', loginRes.data);
  }
}

runTests();
