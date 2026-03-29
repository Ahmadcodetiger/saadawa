import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ DB Connected');
  
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'ahmadhussain554@gmail.com' });
  if (user) {
    console.log('--- USER DATA ---');
    console.log(JSON.stringify(user, null, 2));
    
    const account = await mongoose.connection.db.collection('virtualaccounts').findOne({ user: user._id });
    console.log('\n--- VIRTUAL ACCOUNT DATA ---');
    console.log(JSON.stringify(account, null, 2));

    const allAccounts = await mongoose.connection.db.collection('virtualaccounts').find({ user: user._id }).toArray();
    console.log(`\nFound ${allAccounts.length} total accounts for this user`);
    allAccounts.forEach(a => console.log(`- Provider: ${a.provider}, Acc: ${a.accountNumber}`));
  } else {
    console.log('User not found');
  }
  process.exit(0);
}

debug();
