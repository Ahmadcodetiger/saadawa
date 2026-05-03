import mongoose from 'mongoose';
import { loadEnv } from '../config/loadEnv.js';
import { User } from '../models/user.model.js';
import VirtualAccount from '../models/VirtualAccount.js';

async function debug() {
  await loadEnv();
  await mongoose.connect(process.env.MONGO_URI!);
  
  const user = await User.findOne({ email: 'ahmadhussain554@gmail.com' });
  if (user) {
    console.log('--- USER DATA ---');
    console.log(JSON.stringify(user, null, 2));
    
    const account = await VirtualAccount.findOne({ user: user._id });
    console.log('\n--- VIRTUAL ACCOUNT DATA ---');
    console.log(JSON.stringify(account, null, 2));
  } else {
    console.log('User not found');
  }
  process.exit(0);
}

debug();
