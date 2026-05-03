import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function find600() {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    const db = mongoose.connection.db;
    
    const wallet = await db.collection('wallets').findOne({ balance: 600 });
    if (wallet) {
      console.log('✅ FOUND WALLET with 600:', JSON.stringify(wallet, null, 2));
      const user = await db.collection('users').findOne({ _id: wallet.user_id });
      console.log('👤 USER for this wallet:', JSON.stringify(user, null, 2));
    } else {
      console.log('❌ No wallet with balance 600 found.');
      // Show some balances
      const balances = await db.collection('wallets').find().limit(10).toArray();
      console.log('Sample Balances:', balances.map(w => w.balance));
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

find600();
