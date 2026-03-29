import { Response, Request } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/index.js';
import { User } from '../models/user.model.js';
import VirtualAccount from '../models/VirtualAccount.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import { ApiResponse } from '../utils/response.js';
import paymentPointService from '../services/paymentPoint.service.js';

// ============================================
// VIRTUAL ACCOUNT (PaymentPoint)
// ============================================

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

    // Check if user already has a virtual account
    const existingAccount = await VirtualAccount.findOne({
      user: userId,
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

    // Create virtual account with PaymentPoint
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
        message: 'Invalid response from PaymentPoint API',
      });
    }

    const bankAccount = result.data.bankAccounts[0];
    
    const virtualAccount = new VirtualAccount({
      user: userId,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      bankName: bankAccount.bankName,
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

    return res.status(201).json({
      success: true,
      message: 'Virtual account created successfully',
      data: {
        accountNumber: virtualAccount.accountNumber,
        accountName: virtualAccount.accountName,
        bankName: virtualAccount.bankName,
        reference: virtualAccount.reference,
        provider: virtualAccount.provider,
        status: virtualAccount.status
      },
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
      user: userId,
      provider: 'paymentpoint'
    });

    if (!virtualAccount) {
      return res.status(404).json({
        success: false,
        message: 'Virtual account not found',
        data: { exists: false },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Virtual account retrieved',
      data: {
        accountNumber: virtualAccount.accountNumber,
        accountName: virtualAccount.accountName,
        bankName: virtualAccount.bankName,
        reference: virtualAccount.reference,
        provider: virtualAccount.provider,
        status: virtualAccount.status
      },
    });
  } catch (error) {
    console.error('Get virtual account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================
// WEBHOOK HANDLERS
// ============================================

export const paymentWebhook = async (req: Request, res: Response) => {
  try {
    console.log('📡 PaymentPoint webhook received:', new Date().toISOString());
    
    // Parse body properly - it might be a Buffer from express.raw()
    let payload: any;
    if (req.body instanceof Buffer) {
      const rawBody = req.body.toString('utf8');
      console.log('📡 Raw body:', rawBody);
      payload = JSON.parse(rawBody);
    } else {
      payload = req.body;
    }
    
    console.log('📡 Parsed payload:', JSON.stringify(payload, null, 2));

    let accountNumber: string;
    let amount: number;
    let reference: string;
    
    // Parse based on payload structure
    if (payload.data) {
      accountNumber = payload.data.accountNumber || payload.data.account_number;
      amount = payload.data.amount;
      reference = payload.data.reference || payload.data.transactionReference;
    } else {
      accountNumber = payload.accountNumber || payload.account_number;
      amount = payload.amount;
      reference = payload.reference || payload.transactionReference;
    }
    
    console.log('📋 Parsed data:', { accountNumber, amount, reference });
    
    if (amount > 0 && accountNumber) {
      const virtualAccount = await VirtualAccount.findOne({ 
        accountNumber: accountNumber 
      });
      
      if (!virtualAccount) {
        console.log(`Virtual account not found for: ${accountNumber}`);
        return res.status(200).json({ success: true });
      }
      
      const user = await User.findById(virtualAccount.user);
      if (!user) {
        console.log(`User not found for account: ${accountNumber}`);
        return res.status(200).json({ success: true });
      }

      // Check for duplicate transaction
      const existingTx = await Transaction.findOne({ reference_number: reference });
      if (existingTx) {
        console.log(`⚠️ Transaction ${reference} already processed`);
        return res.status(200).json({ success: true });
      }

      let wallet = await Wallet.findOne({ user_id: user._id });
      if (!wallet) {
        wallet = new Wallet({
          user_id: user._id,
          balance: 0,
          currency: 'NGN'
        });
        await wallet.save();
      }
      
      wallet.balance += amount;
      await wallet.save();
      
      const transaction = new Transaction({
        user_id: user._id,
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
      });
      await transaction.save();
      
      console.log(`✅ Wallet credited: ${user.email} - ₦${amount}`);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ success: true });
  }
};

// Payrant webhook handler
export const payrantWebhook = async (req: Request, res: Response) => {
  try {
    console.log('📡 Payrant webhook received:', new Date().toISOString());

    let payload: any;
    if (req.body instanceof Buffer) {
      payload = JSON.parse(req.body.toString('utf8'));
    } else {
      payload = req.body;
    }

    console.log('📡 Payrant payload:', JSON.stringify(payload, null, 2));

    // Extract standard fields from Payrant payload
    const event = payload.event || payload.type;
    const data = payload.data || payload;

    if (event === 'payment.successful' || event === 'payment.completed') {
      const reference = data.reference || data.transaction_reference;
      const amount = Number(data.amount || 0);
      const accountNumber = data.account_number || data.accountNumber;

      if (reference && amount > 0) {
        // Prevent duplicate processing
        const existingTx = await Transaction.findOne({ reference_number: reference });
        if (existingTx) {
          console.log(`⚠️ Payrant transaction ${reference} already processed`);
          return res.status(200).json({ success: true });
        }

        // Find account
        const virtualAccount = await VirtualAccount.findOne({ accountNumber });
        if (virtualAccount) {
          const user = await User.findById(virtualAccount.user);
          if (user) {
            let wallet = await Wallet.findOne({ user_id: user._id });
            if (!wallet) {
              wallet = new Wallet({ user_id: user._id, balance: 0, currency: 'NGN' });
              await wallet.save();
            }

            wallet.balance += amount;
            await wallet.save();

            await Transaction.create({
              user_id: user._id,
              wallet_id: wallet._id,
              type: 'wallet_topup',
              amount,
              fee: 0,
              total_charged: amount,
              status: 'successful',
              reference_number: reference,
              description: 'Wallet funding via Payrant',
              payment_method: 'virtual_account',
              destination_account: accountNumber,
            });

            console.log(`✅ Payrant wallet credited: ${user.email} - ₦${amount}`);
          }
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Payrant webhook error:', error);
    return res.status(200).json({ success: true });
  }
};

// ============================================
// PAYMENT GATEWAY OPERATIONS
// ============================================

export const initiatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return ApiResponse.error(res, 'Unauthorized', 401);

    const { amount, payment_method = 'virtual_account' } = req.body;

    if (!amount || Number(amount) <= 0) {
      return ApiResponse.error(res, 'Valid amount is required', 400);
    }

    // Find user's virtual account for payment instructions
    const virtualAccount = await VirtualAccount.findOne({
      user: userId,
      provider: 'paymentpoint',
      status: 'active'
    });

    return ApiResponse.success(res, 'Payment initiated', {
      amount: Number(amount),
      payment_method,
      instructions: virtualAccount ? {
        type: 'bank_transfer',
        accountNumber: virtualAccount.accountNumber,
        accountName: virtualAccount.accountName,
        bankName: virtualAccount.bankName,
        message: 'Transfer the exact amount to the account above. Your wallet will be credited automatically.'
      } : {
        type: 'bank_transfer',
        message: 'Please create a virtual account first to fund your wallet.'
      }
    });
  } catch (error: any) {
    return ApiResponse.error(res, error.message, 500);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return ApiResponse.error(res, 'Reference is required', 400);
    }

    const transaction = await Transaction.findOne({ reference_number: reference });

    if (!transaction) {
      return ApiResponse.error(res, 'Transaction not found', 404);
    }

    return ApiResponse.success(res, 'Transaction found', {
      reference: transaction.reference_number,
      status: transaction.status,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      created_at: transaction.created_at
    });
  } catch (error: any) {
    return ApiResponse.error(res, error.message, 500);
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return ApiResponse.error(res, 'Unauthorized', 401);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ user_id: userId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ user_id: userId });

    return ApiResponse.success(res, 'Payment history retrieved', {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return ApiResponse.error(res, error.message, 500);
  }
};

export const getBanks = async (req: AuthRequest, res: Response) => {
  try {
    // Return common Nigerian banks list
    const banks = [
      { code: '044', name: 'Access Bank' },
      { code: '023', name: 'Citibank Nigeria' },
      { code: '050', name: 'Ecobank Nigeria' },
      { code: '011', name: 'First Bank of Nigeria' },
      { code: '214', name: 'First City Monument Bank' },
      { code: '070', name: 'Fidelity Bank' },
      { code: '058', name: 'Guaranty Trust Bank' },
      { code: '030', name: 'Heritage Bank' },
      { code: '301', name: 'Jaiz Bank' },
      { code: '082', name: 'Keystone Bank' },
      { code: '014', name: 'MainStreet Bank' },
      { code: '076', name: 'Polaris Bank' },
      { code: '101', name: 'ProvidusBank' },
      { code: '221', name: 'Stanbic IBTC Bank' },
      { code: '068', name: 'Standard Chartered Bank' },
      { code: '232', name: 'Sterling Bank' },
      { code: '302', name: 'TAJBank' },
      { code: '032', name: 'Union Bank of Nigeria' },
      { code: '033', name: 'United Bank For Africa' },
      { code: '215', name: 'Unity Bank' },
      { code: '035', name: 'Wema Bank' },
      { code: '057', name: 'Zenith Bank' },
      { code: '100004', name: 'Opay' },
      { code: '100033', name: 'PalmPay' },
      { code: '100025', name: 'Kuda Bank' },
      { code: '100013', name: 'GTB (737)' },
      { code: '999991', name: 'Moniepoint' },
    ];

    return ApiResponse.success(res, 'Banks retrieved successfully', banks);
  } catch (error: any) {
    return ApiResponse.error(res, error.message, 500);
  }
};
