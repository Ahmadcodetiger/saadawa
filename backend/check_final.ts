import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkFinal() {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    const db = mongoose.connection.db;
    
    const userId = new mongoose.Types.ObjectId('672f305ed9c3ff7908f907cb');
    
    const wallet = await db.collection('wallets').findOne({ user_id: userId });
    console.log('🏦 CURRENT WALLET:', JSON.stringify(wallet, null, 2));
    
    const trans = await db.collection('transactions')
      .find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    console.log('📜 RECENT TRANSACTIONS:', JSON.stringify(trans, null, 2));
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkFinal();
