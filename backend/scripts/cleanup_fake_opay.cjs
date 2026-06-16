/**
 * Cleanup script: Remove fake OPay accounts from virtual accounts in MongoDB.
 * 
 * The old dev-mode auto-sync generated random account numbers for OPay (bank code 20897).
 * These are not real PaymentPoint accounts and show "invalid account" when used.
 * 
 * This script:
 * 1. Finds all VirtualAccount records with OPay entries in metadata.accounts
 * 2. Removes OPay entries that were NOT created by the real PaymentPoint API
 *    (We identify real ones by checking if the accountName contains "Paymentpoint" 
 *     AND the account was returned from a real API call — but since we can't distinguish,
 *     we remove ALL OPay entries. Users can re-sync via the "Sync Missing Banks" button.)
 * 3. Shows a summary of what was cleaned
 * 
 * Usage: node scripts/cleanup_fake_opay.cjs
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

async function cleanup() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(); // uses default DB from connection string
    const collection = db.collection('virtualaccounts');

    // Find all virtual accounts with OPay in metadata.accounts
    const accounts = await collection.find({
      provider: 'paymentpoint',
      'metadata.accounts': { $exists: true }
    }).toArray();

    console.log(`📋 Found ${accounts.length} PaymentPoint virtual account(s) in DB\n`);

    let cleanedCount = 0;
    let skippedCount = 0;

    for (const va of accounts) {
      const currentAccounts = va.metadata?.accounts || [];
      const opayEntries = currentAccounts.filter(acc => acc.bankCode === '20897');
      
      if (opayEntries.length === 0) {
        console.log(`  ✅ ${va.accountName} — No OPay entries, skipping`);
        skippedCount++;
        continue;
      }

      // Remove all OPay entries (they were all fake from dev-mode sync)
      const cleanedAccounts = currentAccounts.filter(acc => acc.bankCode !== '20897');
      
      console.log(`  🧹 ${va.accountName}:`);
      for (const opay of opayEntries) {
        console.log(`     Removing fake OPay: ${opay.accountNumber} (${opay.accountName})`);
      }
      console.log(`     Keeping ${cleanedAccounts.length} real account(s)`);

      // Update the DB record
      await collection.updateOne(
        { _id: va._id },
        { 
          $set: { 
            'metadata.accounts': cleanedAccounts 
          } 
        }
      );

      cleanedCount++;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Cleanup complete!`);
    console.log(`   Cleaned: ${cleanedCount} account(s)`);
    console.log(`   Skipped: ${skippedCount} account(s)`);
    console.log(`\n💡 Users can tap "Sync Missing Banks" in the app to get real OPay accounts via the PaymentPoint API.`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanup();
