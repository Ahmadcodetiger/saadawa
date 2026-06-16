const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('Missing MONGO_URI in .env');
  process.exit(1);
}

async function clearDB() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    
    // Collections to clear
    const collectionsToClear = [
      'users',
      'wallets',
      'transactions',
      'virtualaccounts',
      'virtual_accounts',
      'notifications',
      'otps',
      'support_tickets',
      'audit_logs',
      'funding_accounts'
    ];

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections in DB:', collectionNames);

    for (const name of collectionsToClear) {
      if (collectionNames.includes(name)) {
        console.log(`Clearing collection: ${name}...`);
        const result = await db.collection(name).deleteMany({});
        console.log(`Collection "${name}" cleared! Deleted ${result.deletedCount} documents.`);
      }
    }

    console.log('\n✅ Database reset completed successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDB();
