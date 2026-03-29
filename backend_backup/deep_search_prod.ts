import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function deepSearch() {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('COLLECTIONS:', collections.map(c => c.name));
    
    const searchVal = '6657121838';
    
    for (const colDef of collections) {
      const col = db.collection(colDef.name);
      // Search for any field containing this string
      const found = await col.findOne({
        $or: [
          { accountNumber: searchVal },
          { account_number: searchVal },
          { "virtual_account.account_number": searchVal }
        ]
      });
      
      if (found) {
        console.log(`✅ FOUND IN COLLECTION [${colDef.name}]:`, JSON.stringify(found, null, 2));
      }
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

deepSearch();
