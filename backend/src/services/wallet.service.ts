// services wallet.service.ts
import { Wallet, Transaction } from '../models/index.js';
import { Types } from 'mongoose';

export class WalletService {
  static async createWallet(user_id: Types.ObjectId) {
    return await Wallet.create({
      user_id,
      balance: 0,
      currency: 'NGN'
    });
  }

  static async getBalance(user_id: Types.ObjectId): Promise<number> {
    const wallet = await Wallet.findOne({ user_id });
    return wallet?.balance || 0;
  }

  static async creditWallet(user_id: Types.ObjectId, amount: number): Promise<boolean> {
    const wallet = await Wallet.findOneAndUpdate(
      { user_id },
      { 
        $inc: { balance: amount },
        $set: { last_transaction_at: new Date() }
      },
      { new: true }
    );
    if (!wallet) throw new Error('Wallet not found');
    return true;
  }

  static async debitWallet(user_id: Types.ObjectId, amount: number): Promise<boolean> {
    const wallet = await Wallet.findOneAndUpdate(
      { user_id, balance: { $gte: amount } },
      { 
        $inc: { balance: -amount },
        $set: { last_transaction_at: new Date() }
      },
      { new: true }
    );
    
    if (!wallet) {
      // Differentiate between 'not found' and 'insufficient balance'
      const existingWallet = await Wallet.findOne({ user_id });
      if (!existingWallet) throw new Error('Wallet not found');
      throw new Error('Insufficient balance');
    }
    return true;
  }

  // Alias methods for compatibility
  static async getWalletByUserId(user_id: Types.ObjectId | string) {
    return await Wallet.findOne({ user_id });
  }

  static async debit(user_id: Types.ObjectId | string, amount: number, description?: string) {
    return await this.debitWallet(user_id as Types.ObjectId, amount);
  }

  static async credit(user_id: Types.ObjectId | string, amount: number, description?: string) {
    return await this.creditWallet(user_id as Types.ObjectId, amount);
  }
}