// controllers/wallet.controller.ts
import { Response } from 'express';
import { Wallet, Transaction, User } from '../models/index.js';
import { WalletService } from '../services/wallet.service.js';
import { NotificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export class WalletController {
  static async getWallet(req: AuthRequest, res: Response) {
    try {
      const wallet = await Wallet.findOne({ user_id: req.user?.id });
      if (!wallet) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }

      return ApiResponse.success(res, wallet, 'Wallet retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async fundWallet(req: AuthRequest, res: Response) {
    try {
      const { amount, payment_method } = req.body;

      if (amount <= 0) {
        return ApiResponse.error(res, 'Invalid amount', 400);
      }

      const wallet = await Wallet.findOne({ user_id: req.user?.id });
      if (!wallet) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }

      // Create transaction record
      const transaction = await Transaction.create({
        user_id: req.user?.id,
        wallet_id: wallet._id,
        type: 'wallet_topup',
        amount,
        fee: 0,
        total_charged: amount,
        status: 'pending',
        reference_number: `TXN-${Date.now()}`,
        payment_method
      });

      // Process payment (integrate with payment gateway)
      // For now, we'll simulate success
      await WalletService.creditWallet(wallet.user_id, amount);
      transaction.status = 'successful';
      await transaction.save();

      return ApiResponse.success(res, { transaction, wallet }, 'Wallet funded successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getWalletTransactions(req: AuthRequest, res: Response) {
    try {
      const wallet = await Wallet.findOne({ user_id: req.user?.id });
      if (!wallet) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const transactions = await Transaction.find({ wallet_id: wallet._id })
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 });

      const total = await Transaction.countDocuments({ wallet_id: wallet._id });

      return ApiResponse.paginated(res, transactions, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }, 'Wallet transactions retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async adjustBalance(req: AuthRequest, res: Response) {
    try {
      const { amount, type, remarks } = req.body;

      if (!amount || !type) {
        return ApiResponse.error(res, 'Amount and type are required', 400);
      }

      const wallet = await Wallet.findOne({ user_id: req.user?.id });
      if (!wallet) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }

      if (type === 'credit') {
        await WalletService.creditWallet(wallet.user_id, amount);
      } else if (type === 'debit') {
        await WalletService.debitWallet(wallet.user_id, amount);
      } else {
        return ApiResponse.error(res, 'Invalid adjustment type', 400);
      }

      const updatedWallet = await Wallet.findOne({ user_id: req.user?.id });
      return ApiResponse.success(res, updatedWallet, 'Wallet balance adjusted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async transferFunds(req: AuthRequest, res: Response) {
    try {
      const { recipient, recipient_email, recipientId, amount, remarks, note, pin } = req.body;
      const targetRecipient = recipient || recipient_email || recipientId;

      if (!amount || amount <= 0) {
        return ApiResponse.error(res, 'Invalid amount', 400);
      }

      if (!targetRecipient) {
        return ApiResponse.error(res, 'Recipient details are required', 400);
      }

      const senderId = req.user?.id;
      if (!senderId) {
        return ApiResponse.error(res, 'User not authenticated', 401);
      }

      const senderWallet = await Wallet.findOne({ user_id: senderId });
      if (!senderWallet) {
        return ApiResponse.error(res, 'Sender wallet not found', 404);
      }

      const senderUser = await User.findById(senderId);
      if (!senderUser) {
        return ApiResponse.error(res, 'Sender not found', 404);
      }

      // Check transaction PIN if set
      if (senderUser.transaction_pin) {
        if (!pin) {
          return ApiResponse.error(res, 'Transaction PIN is required', 400);
        }
        const pinOk = await bcrypt.compare(String(pin), senderUser.transaction_pin);
        if (!pinOk) {
          return ApiResponse.error(res, 'Incorrect transaction PIN', 400);
        }
      }

      // Fee logic: 0 Naira fee for P2P transfers (as the 50 Naira fee only applies to wallet funding)
      const fee = 0;
      const totalCharged = amount; 
      const creditAmount = amount; 

      if (senderWallet.balance < totalCharged) {
        return ApiResponse.error(res, `Insufficient balance. You need at least ₦${totalCharged} in your wallet`, 400);
      }

      // Find recipient
      let recipientUser = null;
      if (mongoose.Types.ObjectId.isValid(targetRecipient)) {
        recipientUser = await User.findById(targetRecipient);
      }
      if (!recipientUser) {
        recipientUser = await User.findOne({
          $or: [
            { email: targetRecipient },
            { phone_number: targetRecipient }
          ]
        });
      }

      if (!recipientUser) {
        return ApiResponse.error(res, 'Recipient user not found', 404);
      }

      if (recipientUser._id.toString() === senderId.toString()) {
        return ApiResponse.error(res, 'Cannot transfer funds to yourself', 400);
      }

      // Get or create recipient wallet
      let recipientWallet = await Wallet.findOne({ user_id: recipientUser._id });
      if (!recipientWallet) {
        recipientWallet = await Wallet.create({
          user_id: recipientUser._id,
          balance: 0,
          currency: 'NGN'
        });
      }

      // Perform transaction (debit sender, credit recipient)
      await WalletService.debitWallet(senderUser._id, totalCharged);
      await WalletService.creditWallet(recipientUser._id, creditAmount);

      // Create transaction logs
      // 1. Sender transaction
      const senderTxnRef = `TXN-TRSF-S-${Date.now()}`;
      await Transaction.create({
        user_id: senderUser._id,
        wallet_id: senderWallet._id,
        type: 'transfer',
        amount: creditAmount,
        fee: fee,
        total_charged: totalCharged,
        status: 'successful',
        reference_number: senderTxnRef,
        payment_method: 'wallet',
        destination_account: recipientUser.email,
        description: remarks || note || `Fund transfer to ${recipientUser.first_name} ${recipientUser.last_name}`
      });

      // 2. Recipient transaction
      const recipientTxnRef = `TXN-TRSF-R-${Date.now()}`;
      await Transaction.create({
        user_id: recipientUser._id,
        wallet_id: recipientWallet._id,
        type: 'credit',
        amount: creditAmount,
        fee: 0,
        total_charged: creditAmount,
        status: 'successful',
        reference_number: recipientTxnRef,
        payment_method: 'wallet',
        description: `Fund transfer received from ${senderUser.first_name} ${senderUser.last_name}`
      });

      // Send notifications
      try {
        // Notify sender
        await NotificationService.createNotification({
          user_id: senderUser._id,
          type: 'transaction_alert',
          title: 'Transfer Sent',
          message: `You successfully transferred ₦${amount} to ${recipientUser.first_name} ${recipientUser.last_name}.`,
          action_link: `/transactions`
        });
        // Notify recipient
        await NotificationService.createNotification({
          user_id: recipientUser._id,
          type: 'transaction_alert',
          title: 'Transfer Received',
          message: `You received ₦${amount} from ${senderUser.first_name} ${senderUser.last_name}`,
          action_link: `/transactions`
        });
      } catch (err) {
        console.error('Failed to send transfer notifications:', err);
      }

      const updatedWallet = await Wallet.findOne({ user_id: senderId });
      return ApiResponse.success(res, { balance: updatedWallet?.balance || 0 }, 'Transfer completed successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}