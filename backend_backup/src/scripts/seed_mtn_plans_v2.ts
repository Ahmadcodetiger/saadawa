import mongoose from 'mongoose';
import { loadEnv } from '../config/loadEnv.js';
import AirtimePlan from '../models/airtime_plan.model.js';

async function seedImportantMTNPlans() {
  await loadEnv();
  
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const mtnPlans = [
      // SME / Share Plans
      { name: '500MB Share - Weekly', code: '423', price: 300, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '500MB' } },
      { name: '1GB Share - Weekly', code: '424', price: 400, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '1GB' } },
      { name: '2GB Share - Weekly', code: '425', price: 800, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '2GB' } },
      { name: '3GB Share - Weekly', code: '426', price: 1200, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '3GB' } },
      { name: '5GB Share - Weekly', code: '427', price: 2000, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '5GB' } },
      
      { name: '500MB Share - Monthly', code: '172', price: 300, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '500MB' } },
      { name: '1GB Share - Monthly', code: '173', price: 550, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '1GB' } },
      { name: '2GB Share - Monthly', code: '174', price: 1090, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '2GB' } },
      { name: '3GB Share - Monthly', code: '175', price: 1590, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '3GB' } },
      { name: '5GB Share - Monthly', code: '176', price: 2450, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '5GB' } },

      // Gifting / Daily
      { name: '75MB Daily Plan [Gifting]', code: '6', price: 73, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Daily', data_value: '75MB' } },
      { name: '100MB Daily Plan [Gifting]', code: '7', price: 97, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Daily', data_value: '100MB' } },
      { name: '110MB Daily Plan [Gifting]', code: '230', price: 97, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Daily', data_value: '110MB' } },
      { name: '200MB 2-Day Plan [Gifting]', code: '9', price: 194, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: '2-Day', data_value: '200MB' } },
      
      // Weekly Gifting
      { name: '1GB Weekly Plan [Gifting]', code: '15', price: 776, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '1GB' } },
      { name: '1.5GB Weekly Plan [Gifting]', code: '16', price: 970, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '1.5GB' } },
      { name: '3.5GB Weekly Plan [Gifting]', code: '261', price: 1455, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '3.5GB' } },
      { name: '6GB Weekly Plan [Gifting]', code: '17', price: 2425, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Weekly', data_value: '6GB' } },

      // Monthly Gifting
      { name: '7GB Monthly Plan [Gifting]', code: '21', price: 3395, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '7GB' } },
      { name: '10GB + 10mins Monthly [Gifting]', code: '22', price: 4365, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '10GB' } },
      { name: '20GB Monthly Plan [Gifting]', code: '25', price: 7275, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '20GB' } },
      { name: '25GB Monthly Plan [Gifting]', code: '26', price: 8730, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '25GB' } },
      
      // Broadband
      { name: '30GB Monthly Broadband', code: '120', price: 8730, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '30GB' } },
      { name: '60GB Monthly Broadband', code: '121', price: 14065, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '60GB' } },
      { name: '150GB 2-Month Plan [Gifting]', code: '31', price: 38800, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: '2-Month', data_value: '150GB' } },
      { name: '250GB Monthly Plan [Gifting]', code: '30', price: 53350, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Monthly', data_value: '250GB' } },

      // High Volume
      { name: '800GB Yearly Plan [Gifting]', code: '263', price: 121250, type: 'DATA', providerId: 1, providerName: 'MTN', active: true, meta: { validity: 'Yearly', data_value: '800GB' } }
    ];

    console.log(`📦 Seeding ${mtnPlans.length} MTN plans...`);

    for (const planData of mtnPlans) {
      await AirtimePlan.findOneAndUpdate(
        { code: planData.code, providerId: 1, type: 'DATA' },
        planData,
        { upsert: true, new: true }
      );
    }

    console.log('✅ Seeded important MTN plans successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  }
}

seedImportantMTNPlans();
