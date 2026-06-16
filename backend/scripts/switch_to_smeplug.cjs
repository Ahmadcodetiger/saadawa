const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not found in environment or .env file");
  process.exit(1);
}

const ProviderConfig = mongoose.model('ProviderConfig', new mongoose.Schema({}, { strict: false }), 'providerconfigs');

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    // Sync SMEPlug API Key and set to priority 1
    const s = await ProviderConfig.updateOne(
      { code: 'smeplug' },
      { 
        $set: { 
          priority: 1, 
          active: true, 
          api_key: process.env.SMEPLUG_API_KEY 
        } 
      }
    );
    console.log(`SMEPlug set to priority 1 and API key synced. Matched: ${s.matchedCount}, Modified: ${s.modifiedCount}`);

    // Set Topupmate Priority 2
    const t = await ProviderConfig.updateOne(
      { code: 'topupmate' },
      { $set: { priority: 2 } }
    );
    console.log(`Topupmate set to priority 2. Matched: ${t.matchedCount}, Modified: ${t.modifiedCount}`);

    console.log("Successfully switched active provider back to SMEPlug!");
  } catch (error) {
    console.error("Error switching to SMEPlug:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

run();
