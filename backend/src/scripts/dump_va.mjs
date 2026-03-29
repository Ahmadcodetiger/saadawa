import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  const accs = await mongoose.connection.db.collection('virtualaccounts').find({}).toArray();
  console.log('--- ALL VIRTUAL ACCOUNTS ---');
  accs.forEach(a => {
    console.log(`ID: ${a._id}, User: ${a.user}, Provider: ${a.provider}, Acc: ${a.accountNumber}`);
  });
  process.exit(0);
}

debug();
