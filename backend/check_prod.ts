import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkProdDB() {
  try {
    const uri = process.env.MONGO_URI || '';
    console.log('Connecting to Prod DB...');
    await mongoose.connect(uri);
    console.log('Connected.');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check virtual_accounts
    const vaColl = db.collection('virtual_accounts');
    const account = await vaColl.findOne({ accountNumber: '6657121838' });
    
    if (account) {
      console.log('✅ Account 6657121838 Found:', JSON.stringify(account, null, 2));
      
      const walletsColl = db.collection('wallets');
      const wallet = await walletsColl.findOne({ user_id: account.user });
      console.log('🏦 User Wallet:', JSON.stringify(wallet, null, 2));
      
      const usersColl = db.collection('users');
      const user = await usersColl.findOne({ _id: account.user });
      console.log('👤 User email:', user?.email);

    } else {
      console.log('❌ Account 6657121838 NOT FOUND in production DB.');
      // List a few to see format
      const some = await vaColl.find().limit(5).toArray();
      console.log('Sample Accounts:', some.map(a => a.accountNumber));
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkProdDB();
