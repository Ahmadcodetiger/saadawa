import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env");
  process.exit(1);
}

// Minimal schema 
const ProviderConfig = mongoose.model('ProviderConfig', new mongoose.Schema({}, { strict: false }), 'providerconfigs');

async function switchProviders() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    // Make TopupMate Priority 1
    const t = await ProviderConfig.updateOne(
      { code: 'topupmate' },
      { $set: { priority: 1, active: true } }
    );
    console.log(`TopupMate set to priority 1. Matched: ${t.matchedCount}`);

    // Make SMEPlug Priority 2
    const s = await ProviderConfig.updateOne(
      { code: 'smeplug' },
      { $set: { priority: 2 } }
    );
    console.log(`SMEPlug set to priority 2. Matched: ${s.matchedCount}`);

    console.log("Successfully switched active provider to TopupMate!");
  } catch (error) {
    console.error("Error switching providers:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

switchProviders();
