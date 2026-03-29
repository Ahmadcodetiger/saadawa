import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ProviderConfig from '../models/provider.model.js';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || '';

async function configureSMEPlug() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  try {
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    // 1. Ensure SMEPlug exists and is prioritized
    const smePlug = await ProviderConfig.findOneAndUpdate(
      { code: 'smeplug' },
      {
        name: 'SME Plug',
        code: 'smeplug',
        active: true,
        priority: 1,
        supported_services: ['airtime', 'data'],
        api_key: process.env.SMEPLUG_API_KEY
      },
      { upsert: true, new: true }
    );
    console.log('✅ SMEPlug configured as Priority 1 for Airtime & Data.');

    // 2. Set TopUpMate as fallback (Priority 2)
    await ProviderConfig.findOneAndUpdate(
      { code: 'topupmate' },
      { priority: 2, active: true },
      { upsert: true }
    );
    console.log('✅ TopUpMate set as Priority 2.');

    // 3. Set VTPass for Cable/Electricity (Optional priority)
    await ProviderConfig.findOneAndUpdate(
      { code: 'vtpass' },
      { priority: 1, active: true },
      { upsert: true }
    );
    console.log('✅ VTPass configured for Cable & Electricity.');

    console.log('\n🚀 VTU Providers prioritized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configuring providers:', error);
    process.exit(1);
  }
}

configureSMEPlug();
