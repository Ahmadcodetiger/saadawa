import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGO_URI || '';
console.log('Testing connection to:', uri.replace(/:([^@]+)@/, ':***@'));

async function test() {
  try {
    console.log('Connecting...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Success! Connected to MongoDB.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
    if (err.reason) {
        console.error('Reason:', JSON.stringify(err.reason, null, 2));
    }
  }
}

test();
