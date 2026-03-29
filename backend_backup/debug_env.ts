import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('MONGO_URI:', process.env.MONGO_URI?.substring(0, 60));
console.log('PAYMENTPOINT_API_KEY:', process.env.PAYMENTPOINT_API_KEY);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
