import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkTransactions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId('672f305ed9c3ff7908f907cb');
    
    const transactions = await db.collection('transactions')
      .find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
      
    console.log('📜 TRANSACTIONS for this user:');
    transactions.forEach(t => {
      console.log(`- ${t.type} | ${t.amount} | ${t.status} | ${t.reference_number} | ${t.createdAt}`);
    });
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkTransactions();
