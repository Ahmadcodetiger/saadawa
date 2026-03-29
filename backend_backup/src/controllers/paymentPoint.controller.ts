import { Response, Request } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/index.js';
import { User } from '../models/user.model.js';
import VirtualAccount from '../models/VirtualAccount.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import paymentPointService from '../services/paymentPoint.service.js';

export const createVirtualAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const existingAccount = await VirtualAccount.findOne({
      user: new mongoose.Types.ObjectId(userId),
      provider: 'paymentpoint'
    });

    if (existingAccount) {
      return res.status(200).json({
        success: true,
        message: 'Virtual account already exists',
        data: {
          accountNumber: existingAccount.accountNumber,
          accountName: existingAccount.accountName,
          bankName: existingAccount.bankName,
          reference: existingAccount.reference,
          provider: existingAccount.provider,
          status: existingAccount.status
        },
      });
    }

    const result = await paymentPointService.createVirtualAccount({
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      phoneNumber: user.phone_number,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    if (!result.data || !result.data.bankAccounts || !result.data.bankAccounts[0]) {
      return res.status(500).json({
        success: false,
        message: 'Invalid response from PaymentPoint',
      });
    }

    const bankAccount = result.data.bankAccounts[0];
    
    const virtualAccount = new VirtualAccount({
      user: new mongoose.Types.ObjectId(userId),
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      bankName: bankAccount.bankName,
      provider: 'paymentpoint',
      reference: result.data.customer?.customer_id || `REF_${Date.now()}`,
      status: 'active',
      metadata: {
        virtualAccountName: result.data.customer?.customer_name,
        virtualAccountNo: bankAccount.accountNumber,
        identityType: 'NIN',
        licenseNumber: result.data.customer?.customer_id
      }
    });
    
    await virtualAccount.save();

    user.virtual_account = {
      account_number: bankAccount.accountNumber,
      account_name: bankAccount.accountName,
      bank_name: bankAccount.bankName,
      account_reference: result.data.customer?.customer_id || `REF_${Date.now()}`,
      provider: 'paymentpoint',
      status: 'active'
    };
    await user.save();

    let wallet = await Wallet.findOne({ user_id: new mongoose.Types.ObjectId(userId) });
    if (!wallet) {
      wallet = new Wallet({
        user_id: new mongoose.Types.ObjectId(userId),
        balance: 0,
        currency: 'NGN'
      });
      await wallet.save();
    }

    const outgoingData = {
      accountNumber: virtualAccount.accountNumber || (virtualAccount as any).account_number || '',
      accountName: virtualAccount.accountName || (virtualAccount as any).account_name || '',
      bankName: virtualAccount.bankName || (virtualAccount as any).bank_name || '',
      bankCode: (virtualAccount.bankName || '').toLowerCase().includes('palm') ? '999991' : '000',
      customerId: virtualAccount.reference || (virtualAccount as any).account_reference || '',
      reference: virtualAccount.reference,
      provider: virtualAccount.provider,
      status: virtualAccount.status
    };

    console.log('📡 [Backend] Outgoing Account (Create):', JSON.stringify(outgoingData, null, 2));

    return res.status(201).json({
      success: true,
      message: 'Virtual account created successfully',
      data: outgoingData,
    });

  } catch (error) {
    console.error('Create virtual account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getVirtualAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }
    
    const virtualAccount = await VirtualAccount.findOne({
      user: new mongoose.Types.ObjectId(userId),
      provider: 'paymentpoint'
    });

    if (!virtualAccount) {
      return res.status(404).json({
        success: false,
        message: 'Virtual account not found',
        data: { exists: false },
      });
    }

    const outgoingData = {
      accountNumber: virtualAccount.accountNumber || (virtualAccount as any).account_number || '',
      accountName: virtualAccount.accountName || (virtualAccount as any).account_name || '',
      bankName: virtualAccount.bankName || (virtualAccount as any).bank_name || '',
      bankCode: (virtualAccount.bankName || '').toLowerCase().includes('palm') ? '999991' : '000',
      customerId: virtualAccount.reference || (virtualAccount as any).account_reference || '',
      reference: virtualAccount.reference,
      provider: virtualAccount.provider,
      status: virtualAccount.status
    };

    console.log('📡 [Backend] Outgoing Virtual Account Data:', JSON.stringify(outgoingData, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Virtual account retrieved',
      data: outgoingData,
    });

  } catch (error) {
    console.error('Get virtual account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const paymentWebhook = async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`\n--- 📡 [${timestamp}] PaymentPoint webhook received ---`);
    console.log('📡 Headers:', JSON.stringify(req.headers, null, 2));

    // Flexible body parsing for Vercel/Express
    let payload: any;
    if (req.body instanceof Buffer) {
      const rawBody = req.body.toString('utf8');
      console.log('📡 Raw body from Buffer:', rawBody);
      payload = JSON.parse(rawBody);
    } else if (typeof req.body === 'string') {
      console.log('📡 Body as string:', req.body);
      payload = JSON.parse(req.body);
    } else {
      console.log('📡 Body as object:', JSON.stringify(req.body, null, 2));
      payload = req.body;
    }

    if (!payload || (Object.keys(payload).length === 0)) {
      console.error('❌ Empty payload received');
      return res.status(200).json({ success: false, message: 'Empty payload' });
    }

    let accountNumber: string = '';
    let amount: number = 0;
    let reference: string = '';
    
    // Extract data from either top-level or nested "data" object
    const data = payload.data || payload;
    
    accountNumber = String(data.accountNumber || data.account_number || '');
    amount = Number(data.amount || 0);
    reference = String(data.reference || data.transactionReference || data.tx_ref || '');
    
    console.log(`📡 Processed Payload: Account=${accountNumber}, Amount=${amount}, Ref=${reference}`);

    // Sanitize account number (strip non-digits)
    const sanitizedAccountNumber = accountNumber.replace(/\D/g, '');
    
    if (amount > 0 && sanitizedAccountNumber) {
      console.log(`🔍 Searching for virtual account with number: ${sanitizedAccountNumber}`);
      
      // Try finding by exact match or sanitized version
      const virtualAccount = await VirtualAccount.findOne({ 
        $or: [
          { accountNumber: sanitizedAccountNumber },
          { accountNumber: accountNumber } // Fallback to original
        ]
      });
      
      if (!virtualAccount) {
        console.warn(`⚠️ Virtual account not found for: ${accountNumber} (Sanitized: ${sanitizedAccountNumber})`);
        // We still return 200 to acknowledge receipt to PaymentPoint
        return res.status(200).json({ success: true, message: 'Account not found' });
      }
      
      console.log(`✅ Found virtual account for user: ${virtualAccount.user}`);

      const user = await User.findById(virtualAccount.user);
      if (!user) {
        console.error(`❌ User not found for account: ${accountNumber}`);
        return res.status(200).json({ success: true, message: 'User not found' });
      }
      
      // Check if transaction already processed
      const existingTransaction = await Transaction.findOne({ 
        reference_number: reference 
      });
      
      if (existingTransaction) {
        console.warn(`⚠️ Transaction ${reference} already processed`);
        return res.status(200).json({ success: true, message: 'Already processed' });
      }
      
      // Credit wallet
      let wallet = await Wallet.findOne({ user_id: virtualAccount.user });
      if (!wallet) {
        console.log('🏦 Creating new wallet for user');
        wallet = new Wallet({
          user_id: virtualAccount.user,
          balance: 0,
          currency: 'NGN'
        });
        await wallet.save();
      }
      
      const previousBalance = wallet.balance;
      wallet.balance += amount;
      await wallet.save();
      
      // Create transaction record
      const transaction = new Transaction({
        user_id: virtualAccount.user,
        wallet_id: wallet._id,
        type: 'wallet_topup',
        amount: amount,
        fee: 0,
        total_charged: amount,
        status: 'successful',
        reference_number: reference,
        description: 'Wallet funding via PaymentPoint',
        payment_method: 'virtual_account',
        destination_account: accountNumber,
        gateway: 'paymentpoint',
        metadata: {
          original_payload: data,
          sanitized_account: sanitizedAccountNumber,
          previous_balance: previousBalance,
          new_balance: wallet.balance
        }
      });
      await transaction.save();
      
      console.log(`✅ SUCCESS: Wallet credited ${user.email} with ₦${amount}. New balance: ₦${wallet.balance}`);
    } else {
      console.warn('⚠️ Invalid amount or account number in payload:', { amount, accountNumber });
    }
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    // Return 200 even on error to prevent PaymentPoint from retrying indefinitely if it's a code bug
    return res.status(200).json({ success: true, error: error.message });
  }
};
