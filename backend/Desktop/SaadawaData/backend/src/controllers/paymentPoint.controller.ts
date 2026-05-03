import { Response, Request } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/index.js';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import VirtualAccount from '../models/VirtualAccount.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import paymentPointService from '../services/paymentPoint.service.js';
import { WalletService } from '../services/wallet.service.js';

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
    
    // Debug services/models
    console.log('📡 Debug Bindings:', {
      WalletService: typeof WalletService,
      User: typeof User,
      Wallet: typeof Wallet,
      Transaction: typeof Transaction
    });

    // 1. Verify Signature
    const signature = req.headers['paymentpoint-signature'] as string;
    const secret = process.env.PAYMENTPOINT_API_SECRET || '';
    
    let rawBody: string = '';
    if (req.body instanceof Buffer) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }

    if (secret && signature) {
      const calculatedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (calculatedSignature !== signature) {
        console.warn('❌ [INVALID SIGNATURE] Webhook signature mismatch.');
        return res.status(400).json({ error: 'Invalid signature' });
      }
      console.log('✅ Signature verified.');
    } else {
      console.warn('⚠️ Signature or Secret missing - skipping verification (ONLY for dev).');
    }

    const payload = JSON.parse(rawBody);
    console.log('📡 Parsed Payload:', JSON.stringify(payload, null, 2));

    if (!payload || (Object.keys(payload).length === 0)) {
      return res.status(200).json({ success: false, message: 'Empty payload' });
    }

    let accountNumber: string = '';
    let amount: number = 0;
    let reference: string = '';
    
    // Extract data according to PaymentPoint official documentation
    // Nested under receiver object: receiver.account_number
    accountNumber = String(payload.receiver?.account_number || payload.data?.accountNumber || payload.account_number || '');
    amount = Number(payload.amount_paid || payload.data?.amount || payload.amount || 0);
    reference = String(payload.transaction_id || payload.reference || '');
    
    console.log(`📡 Extracted Data: Account=${accountNumber}, Amount=${amount}, Ref=${reference}`);

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
        // Log all virtual accounts for debugging (limit to 10)
        const allAccounts = await VirtualAccount.find().limit(10);
        console.log('📡 [DEBUG] Available virtual accounts:', allAccounts.map(a => a.accountNumber));
        // We still return 200 to acknowledge receipt to PaymentPoint
        return res.status(200).json({ success: true, message: 'Account not found' });
      }
      
      console.log(`✅ Found virtual account for user: ${virtualAccount.user} (Account: ${virtualAccount.accountNumber})`);

      const user = await User.findById(virtualAccount.user);
      if (!user) {
        console.error(`❌ User not found for account: ${accountNumber} (User ID: ${virtualAccount.user})`);
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
      
      // Credit wallet via service
      const previousBalance = wallet.balance;
      
      // Safety check for WalletService (fallback for ESM initialization issues)
      let currentWalletService = WalletService;
      if (typeof currentWalletService === 'undefined') {
        console.warn('⚠️ WalletService was undefined at runtime, attempting dynamic import...');
        const walletModule = await import('../services/wallet.service.js');
        currentWalletService = walletModule.WalletService;
      }

      await currentWalletService.creditWallet(virtualAccount.user, amount);
      const updatedWallet = await Wallet.findOne({ user_id: virtualAccount.user });
      const newBalance = updatedWallet?.balance || 0;
      
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
          original_payload: payload,
          sanitized_account: sanitizedAccountNumber,
          previous_balance: previousBalance,
          new_balance: newBalance
        }
      });
      await transaction.save();
      
      console.log(`✅ SUCCESS: Wallet credited ${user.email} with ₦${amount}. New balance: ₦${newBalance}`);
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
