/**
 * Manual Virtual Account Seeder
 * 
 * Run this when PaymentPoint's API returns bankAccounts:[] but accounts
 * are visible in the PaymentPoint dashboard.
 * 
 * Usage:
 *   npx ts-node -r dotenv/config src/scripts/seed_virtual_account.ts
 * 
 * Fill in ACCOUNTS_TO_SEED below with data from the PaymentPoint dashboard.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// ============================================================
// FILL IN THE ACCOUNT DETAILS FROM PAYMENTPOINT DASHBOARD
// ============================================================
const ACCOUNTS_TO_SEED = [
  {
    userEmail: 'umar@gmail.com',          // The user's email in YOUR system
    accountNumber: '',                      // ← paste from PaymentPoint dashboard
    accountName: '',                        // ← paste from PaymentPoint dashboard
    bankName: 'Palmpay',                   // or 'OPay'
    bankCode: '20946',                     // 20946=PalmPay, 20897=OPay
    customerId: '490aa2212f2777eaf9402949670e63f8e43e20f1', // PaymentPoint customer_id
  },
  // Add more entries if needed:
  // {
  //   userEmail: 'another@gmail.com',
  //   accountNumber: '',
  //   accountName: '',
  //   bankName: 'OPay',
  //   bankCode: '20897',
  //   customerId: '',
  // },
];
// ============================================================

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Lazy-load models after connection
  const { User } = await import('../models/user.model.js');
  const VirtualAccount = (await import('../models/VirtualAccount.js')).default;
  const { Wallet } = await import('../models/wallet.model.js');

  for (const entry of ACCOUNTS_TO_SEED) {
    if (!entry.accountNumber) {
      console.warn(`⚠️  Skipping ${entry.userEmail} — accountNumber is empty. Fill it in first.`);
      continue;
    }

    const user = await User.findOne({ email: entry.userEmail });
    if (!user) {
      console.error(`❌ User not found: ${entry.userEmail}`);
      continue;
    }

    const userId = (user._id as mongoose.Types.ObjectId);

    // Check if already seeded
    const existing = await VirtualAccount.findOne({ user: userId, provider: 'paymentpoint' });
    if (existing) {
      console.log(`ℹ️  ${entry.userEmail} already has a virtual account (${existing.accountNumber}). Skipping.`);
      continue;
    }

    // Create VirtualAccount document
    const virtualAccount = new VirtualAccount({
      user: userId,
      accountNumber: entry.accountNumber,
      accountName: entry.accountName,
      bankName: entry.bankName,
      provider: 'paymentpoint',
      reference: entry.customerId,
      status: 'active',
      metadata: {
        virtualAccountName: entry.accountName,
        virtualAccountNo: entry.accountNumber,
        identityType: 'NIN',
        licenseNumber: entry.customerId,
        bankCode: entry.bankCode,
        seededManually: true,
      }
    });
    await virtualAccount.save();

    // Update user record
    user.virtual_account = {
      account_number: entry.accountNumber,
      account_name: entry.accountName,
      bank_name: entry.bankName,
      account_reference: entry.customerId,
      provider: 'paymentpoint',
      status: 'active',
    };
    await user.save();

    // Ensure wallet exists
    let wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      wallet = new Wallet({ user_id: userId, balance: 0, currency: 'NGN' });
      await wallet.save();
      console.log(`  💼 Created wallet for ${entry.userEmail}`);
    }

    console.log(`✅ Seeded virtual account for ${entry.userEmail}: ${entry.accountNumber} (${entry.bankName})`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Done. Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('❌ Seed script failed:', err);
  process.exit(1);
});
