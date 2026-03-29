// models/transaction.model.ts
import mongoose, { Schema } from 'mongoose';
import { ITransaction } from '../types.js';

const transactionSchema = new Schema<ITransaction>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  wallet_id: { type: Schema.Types.ObjectId, ref: 'Wallet' },
  type: { 
    type: String, 
    enum: [
      'airtime_topup', 'data_purchase', 'bill_payment', 'wallet_topup',
      'e-pin_purchase', 'airtime', 'data', 'cable', 'electricity', 'exampin', 'e-pin', 'credit'
    ],
    required: true 
  },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  total_charged: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'successful', 'failed', 'refunded', 'success', 'completed'],
    default: 'pending' 
  },
  reference_number: { type: String, unique: true, required: true },
  description: { type: String },
  payment_method: { type: String, default: 'wallet' },
  destination_account: { type: String },
  operator_id: { type: Schema.Types.ObjectId, ref: 'Operator' },
  plan_id: { type: Schema.Types.ObjectId, ref: 'Plan' },
  receipt_url: { type: String },
  error_message: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
  gateway: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);