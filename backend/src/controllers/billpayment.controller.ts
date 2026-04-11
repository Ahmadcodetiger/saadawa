// controllers/billpayment.controller.ts
import { NextFunction, Request, Response } from 'express';
import AirtimePlan from '../models/airtime_plan.model.js';
import { Transaction, User } from '../models/index.js';
import { Plan } from '../models/plan.model.js';
import providerRegistry from '../services/providerRegistry.service.js';
import smeplugService from '../services/smeplug.service.js';
import topupmateService from '../services/topupmate.service.js';
import { WalletService } from '../services/wallet.service.js';
import { AuthRequest } from '../types/index.js';
import { normalizeNetwork } from '../utils/network.js';
import { ApiResponse } from '../utils/response.js';

// TopupMate uses network names like 'mtn', 'airtel', 'glo', '9mobile'

export class BillPaymentController {
  // Get networks - using TopupMate
  async getNetworks(req: Request, res: Response, next: NextFunction) {
    try {
      const networks: any = await topupmateService.getNetworks();
      
      let payload: any[] = [];
      if (networks.response && Array.isArray(networks.response)) {
        payload = networks.response;
      } else if (networks.networks && typeof networks.networks === 'object') {
        payload = Object.entries(networks.networks).map(([id, name]) => ({
          network_id: id,
          name: name === 'T2' ? '9mobile' : name
        }));
      } else if (networks.data && Array.isArray(networks.data)) {
        payload = networks.data;
      } else if (Array.isArray(networks)) {
        payload = networks;
      } else {
        payload = networks; 
      }
      
      return ApiResponse.success(res, 'Networks retrieved successfully', payload);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.msg || error.response?.data?.message || error.message;
      console.error(`❌ BillPayment Error [${status}]:`, message);
      return ApiResponse.error(res, `Provider Error: ${message}`, status);
    }
  }

  // Get data plans - fetches from DB
  async getDataPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const { network } = req.query;

      // Normalize network to provider ID
      let providerId: number | undefined;
      if (network) {
        const normalized = normalizeNetwork(String(network));
        if (!normalized) {
          return ApiResponse.error(res, 'Invalid network. Must be: mtn, airtel, glo, or 9mobile', 400);
        }
        providerId = normalized;
      }

      // Fetch strictly from DB so that admin manual plans are respected
      const filter: any = { type: 'DATA', active: true };
      if (providerId) filter.providerId = providerId;
      const dbPlans = await AirtimePlan.find(filter).sort({ providerId: 1, price: 1, name: 1 });
      const isApiRequest = !!req.headers['x-api-key'];
      const payload = dbPlans.map((p: any) => {
        const discount = isApiRequest ? (p.api_discount || 0) : (p.discount || 0);
        const finalPrice = Number(p.price) * (1 - discount / 100);
        return {
          id: String(p._id),
          name: p.name,
          operator: p.providerName || 'MTN',
          operator_code: String(p.providerId),
          price: Number(finalPrice.toFixed(2)),
          type: 'data',
          validity: p.meta?.validity || '',
          data_amount: p.meta?.data_value || p.code || '',
        };
      });

      return ApiResponse.success(res, 'Data plans retrieved successfully', payload);
    } catch (error: any) {
      console.error('❌ getDataPlans error:', error.message);
      next(error);
    }
  }

  // Get cable providers
  async getCableProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const selected = await providerRegistry.getPreferredProviderFor('cable');
      const client = selected?.client || topupmateService;
      const providers = await (client.getCableProviders ? client.getCableProviders() : topupmateService.getCableProviders());
      const payload = (providers as any).response || providers;
      return ApiResponse.success(res, 'Cable providers retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  // Get electricity providers
  async getElectricityProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const selected = await providerRegistry.getPreferredProviderFor('electricity');
      const client = selected?.client || topupmateService;
      const providers = await (client.getElectricityProviders ? client.getElectricityProviders() : topupmateService.getElectricityProviders());
      const payload = (providers as any).response || providers;
      return ApiResponse.success(res, 'Electricity providers retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  // Get exam pin providers
  async getExamPinProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const selected = await providerRegistry.getPreferredProviderFor('exampin');
      const client = selected?.client || topupmateService;
      const providers = await (client.getExamPinProviders ? client.getExamPinProviders() : topupmateService.getExamPinProviders());
      const payload = (providers as any).response || providers;
      return ApiResponse.success(res, 'Exam pin providers retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // PURCHASE AIRTIME - USING TOPUPMATE
  // =====================================================
  async purchaseAirtime(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { network, phone, amount, airtime_type = 'VTU', ported_number = true, pin } = req.body;
      const userId = req.user?.id;

      // Enforce transaction PIN (skip for API users)
      const isApiRequest = !!req.headers['x-api-key'];

      if (!isApiRequest) {
        const user = await User.findById(userId);
        if (!user) return ApiResponse.error(res, 'User not found', 404);
        if (!pin || !/^\d{4}$/.test(String(pin))) {
          return ApiResponse.error(res, 'Valid 4-digit transaction PIN is required', 400);
        }
        if (!user.transaction_pin) {
          // Allow default PIN for legacy users without a stored PIN
          if (String(pin) !== '1234') {
            return ApiResponse.error(res, 'Incorrect transaction PIN', 400);
          }
        } else {
          const pinOk = await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.compare(String(pin), user.transaction_pin as string));
          if (!pinOk) {
            return ApiResponse.error(res, 'Incorrect transaction PIN', 400);
          }
        }
      }

      // Normalize network input to provider ID
      const providerId = normalizeNetwork(network);
      if (!providerId) {
        return ApiResponse.error(res, 'Invalid network. Must be: mtn, airtel, glo, or 9mobile', 400);
      }

      // Get TopupMate network name
      const topupmateNetworkId = getNetworkName(providerId).toLowerCase();

      // Calculate discount
      const airtimePlan = await AirtimePlan.findOne({ providerId, type: 'AIRTIME', active: true });
      let discount = 0;
      if (airtimePlan) {
        discount = isApiRequest ? (airtimePlan.api_discount || 0) : (airtimePlan.discount || 0);
      }
      const finalAmount = parseFloat(amount) * (1 - discount / 100);

      // Validate user balance
      if (!userId) {
        return ApiResponse.error(res, 'User authentication failed', 401);
      }

      let wallet;
      try {
        wallet = await WalletService.getWalletByUserId(userId);
      } catch (err: any) {
        return ApiResponse.error(res, `Wallet error: ${err.message}`, 400);
      }

      if (!wallet) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }

      if (wallet.balance <= 0) {
        return ApiResponse.error(res, 'Wallet is empty. Please fund your wallet.', 400);
      }
      if (wallet.balance < finalAmount) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference using TopupMate
      const ref = topupmateService.generateReference('AIRTIME');

      // Get wallet for wallet_id
      const walletData = await WalletService.getWalletByUserId(userId);

      // Deduct from wallet
      await WalletService.debit(userId, finalAmount, 'Airtime purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        user_id: userId,
        wallet_id: walletData._id,
        type: 'airtime_topup',
        amount: parseFloat(amount),
        total_charged: finalAmount,
        reference_number: ref,
        payment_method: 'wallet',
        status: 'pending',
        destination_account: phone,
        description: `Airtime purchase - ${network.toUpperCase()} - ${phone}`,
        metadata: { provider: 'topupmate' },
      });

      try {
        // ✅ USING TOPUPMATE FOR AIRTIME PURCHASE
        console.log('📱 Purchasing airtime via TopupMate:', {
          network: topupmateNetworkId,
          phone: String(phone),
          amount: String(amount),
          ref,
          airtime_type,
        });

        const result = await topupmateService.purchaseAirtime({
          network: topupmateNetworkId,
          phone: String(phone),
          amount: String(amount),
          ref,
          airtime_type,
          ported_number,
        });

        console.log('📱 TopupMate airtime response:', JSON.stringify(result, null, 2));

        // Check for success - TopupMate returns various formats
        const isSuccess = 
          result.status === 'success' || 
          result.status === true || 
          result.status === 'true' ||
          result.code === '000' ||
          result.success === true;

        if (isSuccess) {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'successful',
            updated_at: new Date()
          });
          const updatedWallet = await WalletService.getWalletByUserId(userId);
          return ApiResponse.success(res, 'Airtime purchase successful', {
            transaction,
            balance: updatedWallet?.balance,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, finalAmount, 'Airtime purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            error_message: result.msg || result.message || 'Unknown error',
            updated_at: new Date()
          });
          console.error('❌ Airtime purchase failed - TopupMate Response:', JSON.stringify(result, null, 2));
          return ApiResponse.error(res, `Airtime purchase failed: ${result.msg || result.message || 'Unknown error'}`, 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, finalAmount, 'Airtime purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          error_message: error.message,
          updated_at: new Date()
        });
        console.error('❌ Airtime purchase error:', error.message, error.response?.data);
        throw new Error(error.response?.data?.message || error.response?.data?.msg || error.message || 'Airtime purchase failed');
      }
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // PURCHASE DATA - STILL USING SMEPLUG (since it works)
  // =====================================================
  async purchaseData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { network, phone, plan, ported_number = true, pin } = req.body;
      const userId = req.user?.id;

      // Enforce transaction PIN (skip for API users)
      const isApiRequest = !!req.headers['x-api-key'];

      if (!isApiRequest) {
        const user = await User.findById(userId);
        if (!user) return ApiResponse.error(res, 'User not found', 404);
        if (!user.transaction_pin) {
          return ApiResponse.error(res, 'Please set your 4-digit transaction PIN before making purchases', 400);
        }
        if (!pin || !/^\d{4}$/.test(String(pin))) {
          return ApiResponse.error(res, 'Valid 4-digit transaction PIN is required', 400);
        }
        const pinOk = await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.compare(String(pin), user.transaction_pin as string));
        if (!pinOk) {
          return ApiResponse.error(res, 'Incorrect transaction PIN', 400);
        }
      }

      // Normalize network input to provider ID
      const providerId = normalizeNetwork(network);
      if (!providerId) {
        return ApiResponse.error(res, 'Invalid network. Must be: mtn, airtel, glo, or 9mobile', 400);
      }

      // Try to get plan from DB first, fallback to live provider
      let planExternalId: string = String(plan);
      let amount: number;
      let dbPlan: any = null;

      // Attempt DB lookup (works for legacy seeded plans with ObjectId)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(String(plan));
      if (isMongoId) {
        dbPlan = await AirtimePlan.findById(plan);
      }

      if (dbPlan) {
        // Legacy DB plan
        amount = Number(dbPlan.price);
        planExternalId = String(dbPlan.externalPlanId || dbPlan.code || plan);
      } else {
        // Live provider plan — fetch price from live API
        try {
          const client = smeplugService;
          if (client?.getDataPlans) {
            const result = await client.getDataPlans();
            // SMEPlug format: { data: { "1": [...], "2": [...] } }
            let livePlan: any = null;
            if (result?.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
              for (const netPlans of Object.values(result.data)) {
                livePlan = (netPlans as any[]).find((p: any) => String(p.id) === String(plan));
                if (livePlan) break;
              }
            }
            if (!livePlan) {
              return ApiResponse.error(res, 'Invalid plan selected', 400);
            }
            amount = Number(livePlan.price || 0);
            planExternalId = String(plan); // SMEPlug plan ID passed directly
          } else {
            return ApiResponse.error(res, 'Data plans not available from provider', 503);
          }
        } catch (planErr: any) {
          return ApiResponse.error(res, `Could not verify plan: ${planErr.message}`, 400);
        }
      }

      if (!amount || amount <= 0) {
        return ApiResponse.error(res, 'Invalid plan price', 400);
      }
      const finalAmount = amount;

      // Validate user balance
      if (!userId) {
        return ApiResponse.error(res, 'User authentication failed', 401);
      }

      let wallet;
      try {
        wallet = await WalletService.getWalletByUserId(userId);
      } catch (err: any) {
        return ApiResponse.error(res, `Wallet error: ${err.message}`, 400);
      }

      if (!wallet) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }

      if (wallet.balance <= 0) {
        return ApiResponse.error(res, 'Wallet is empty. Please fund your wallet.', 400);
      }
      if (wallet.balance < finalAmount) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = smeplugService.generateReference('DATA');

      // Get wallet for wallet_id
      const walletData = await WalletService.getWalletByUserId(userId);

      // Deduct from wallet
      await WalletService.debit(userId, finalAmount, 'Data purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        user_id: userId,
        wallet_id: walletData._id,
        type: 'data_purchase',
        amount,
        total_charged: finalAmount,
        reference_number: ref,
        payment_method: 'wallet',
        status: 'pending',
        destination_account: phone,
        description: `Data purchase - ${network.toUpperCase()} - ${phone}`,
        metadata: { provider: 'smeplug' },
        ...(dbPlan ? { plan_id: dbPlan._id } : { metadata: { plan_external_id: planExternalId, provider: 'smeplug' } }),
      });

      try {
        const client = smeplugService;
        let result: any;

        if (client?.purchaseData) {
          result = await client.purchaseData({
            network: String(providerId),
            phone: String(phone),
            ref,
            plan: planExternalId,
            ported_number,
          });
        } else {
          throw new Error('Provider does not support data purchase');
        }

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'successful',
            updated_at: new Date()
          });
          const updatedWallet = await WalletService.getWalletByUserId(userId);
          return ApiResponse.success(res, 'Data purchase successful', {
            transaction,
            balance: updatedWallet?.balance,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, amount, 'Data purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            error_message: result.msg || 'Unknown error',
            updated_at: new Date()
          });
          return ApiResponse.error(res, 'Data purchase failed', 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, amount, 'Data purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          error_message: error.message,
          updated_at: new Date()
        });
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // Verify cable account
  async verifyCableAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, iucnumber } = req.body;
      const selected = await providerRegistry.getPreferredProviderFor('cable');
      const client = selected?.client || topupmateService;
      const result = await (client.verifyCableAccount
        ? client.verifyCableAccount({ provider: String(provider), iucnumber: String(iucnumber) })
        : topupmateService.verifyCableAccount({ provider: String(provider), iucnumber: String(iucnumber) }));

      if (result.status === 'success' || result.status === true || result.status === 'true') {
        return ApiResponse.success(res, 'Account verification successful', {
          customer_name: result.Customer_Name,
          iucnumber,
        });
      } else {
        return ApiResponse.error(res, 'Account verification failed', 400);
      }
    } catch (error) {
      next(error);
    }
  }

  // Purchase cable TV
  async purchaseCableTV(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider, iucnumber, plan, subtype = 'renew', phone } = req.body;
      const userId = req.user?.id;

      if (!userId) return ApiResponse.error(res, 'User authentication failed', 401);

      // Get plan details
      const plans = await topupmateService.getCableTVPlans();
      const selectedPlan = plans.response?.find((p: any) => p.id === plan);

      if (!selectedPlan) {
        return ApiResponse.error(res, 'Invalid plan selected', 400);
      }

      const amount = parseFloat(selectedPlan.price);

      // Validate user balance
      const walletData = await WalletService.getWalletByUserId(userId);
      if (!walletData) return ApiResponse.error(res, 'Wallet not found', 404);
      if (walletData.balance < amount) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = topupmateService.generateReference('CABLE');

      // Deduct from wallet
      await WalletService.debit(userId, amount, 'Cable TV purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        user_id: userId,
        wallet_id: walletData._id,
        type: 'cable',
        amount,
        total_charged: amount,
        reference_number: ref,
        payment_method: 'wallet',
        status: 'pending',
        description: `Cable TV purchase - ${provider} - ${iucnumber}`,
        metadata: { provider, iucnumber, plan: selectedPlan, subtype },
      });

      try {
        const selected = await providerRegistry.getPreferredProviderFor('cable');
        const client = selected?.client || topupmateService;
        const result = await (client.purchaseCableTV
          ? client.purchaseCableTV({ provider, iucnumber, plan, ref, subtype, phone })
          : topupmateService.purchaseCableTV({ provider, iucnumber, plan, ref, subtype, phone }));

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'successful',
            updated_at: new Date()
          });
          const updatedWallet = await WalletService.getWalletByUserId(userId);
          return ApiResponse.success(res, 'Cable TV purchase successful', {
            transaction,
            balance: updatedWallet?.balance,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, amount, 'Cable TV purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            error_message: result.msg || 'Unknown error',
            updated_at: new Date()
          });
          return ApiResponse.error(res, 'Cable TV purchase failed', 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, amount, 'Cable TV purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          error_message: error.message,
          updated_at: new Date()
        });
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // Verify electricity meter
  async verifyElectricityMeter(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, meternumber, metertype } = req.body;
      const selected = await providerRegistry.getPreferredProviderFor('electricity');
      const client = selected?.client || topupmateService;
      const result = await (client.verifyElectricityMeter
        ? client.verifyElectricityMeter({ provider, meternumber, metertype })
        : topupmateService.verifyElectricityMeter({ provider, meternumber, metertype }));

      if (result.status === 'success' || result.status === true || result.status === 'true') {
        return ApiResponse.success(res, 'Meter verification successful', {
          customer_name: result.Customer_Name,
          meternumber,
        });
      } else {
        return ApiResponse.error(res, 'Meter verification failed', 400);
      }
    } catch (error) {
      next(error);
    }
  }

  // Purchase electricity
  async purchaseElectricity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider, meternumber, amount, metertype, phone } = req.body;
      const userId = req.user?.id;

      if (!userId) return ApiResponse.error(res, 'User authentication failed', 401);

      // Validate user balance
      const walletData = await WalletService.getWalletByUserId(userId);
      if (!walletData) return ApiResponse.error(res, 'Wallet not found', 404);
      if (walletData.balance < parseFloat(amount)) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = topupmateService.generateReference('ELECTRIC');

      // Deduct from wallet
      await WalletService.debit(userId, parseFloat(amount), 'Electricity purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        user_id: userId,
        wallet_id: walletData._id,
        type: 'electricity',
        amount: parseFloat(amount),
        total_charged: parseFloat(amount),
        reference_number: ref,
        payment_method: 'wallet',
        status: 'pending',
        description: `Electricity purchase - ${provider} - ${meternumber}`,
        metadata: { provider, meternumber, metertype },
      });

      try {
        const selected = await providerRegistry.getPreferredProviderFor('electricity');
        const client = selected?.client || topupmateService;
        const result = await (client.purchaseElectricity
          ? client.purchaseElectricity({ provider, meternumber, amount, metertype, phone, ref })
          : topupmateService.purchaseElectricity({ provider, meternumber, amount, metertype, phone, ref }));

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'successful',
            updated_at: new Date()
          });
          const updatedWallet = await WalletService.getWalletByUserId(userId);
          return ApiResponse.success(res, 'Electricity purchase successful', {
            transaction,
            balance: updatedWallet?.balance,
            token: result.token,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, parseFloat(amount), 'Electricity purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            error_message: result.msg || 'Unknown error',
            updated_at: new Date()
          });
          return ApiResponse.error(res, 'Electricity purchase failed', 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, parseFloat(amount), 'Electricity purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          error_message: error.message,
          updated_at: new Date()
        });
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // Purchase exam pin
  async purchaseExamPin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider, quantity } = req.body;
      const userId = req.user?.id;

      if (!userId) return ApiResponse.error(res, 'User authentication failed', 401);

      // Get provider details
      const providers = await topupmateService.getExamPinProviders();
      const selectedProvider = providers.response?.find((p: any) => p.id === provider);

      if (!selectedProvider) {
        return ApiResponse.error(res, 'Invalid provider selected', 400);
      }

      const amount = parseFloat(selectedProvider.price) * parseInt(quantity);

      // Validate user balance
      const walletData = await WalletService.getWalletByUserId(userId);
      if (!walletData) return ApiResponse.error(res, 'Wallet not found', 404);
      if (walletData.balance < amount) {
        return ApiResponse.error(res, 'Insufficient wallet balance', 400);
      }

      // Generate reference
      const ref = topupmateService.generateReference('EXAMPIN');

      // Deduct from wallet
      await WalletService.debit(userId, amount, 'Exam pin purchase');

      // Create transaction record
      const transaction = await Transaction.create({
        user_id: userId,
        wallet_id: walletData._id,
        type: 'exampin',
        amount,
        total_charged: amount,
        reference_number: ref,
        payment_method: 'wallet',
        status: 'pending',
        description: `Exam pin purchase - ${provider} x${quantity}`,
        metadata: { provider: selectedProvider, quantity },
      });

      try {
        const selected = await providerRegistry.getPreferredProviderFor('exampin');
        const client = selected?.client || topupmateService;
        const result = await (client.purchaseExamPin
          ? client.purchaseExamPin({ provider, quantity, ref })
          : topupmateService.purchaseExamPin({ provider, quantity, ref }));

        // Update transaction status
        if (result.status === 'success' || result.status === true || result.status === 'true') {
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'successful',
            updated_at: new Date()
          });
          const updatedWallet = await WalletService.getWalletByUserId(userId);
          return ApiResponse.success(res, 'Exam pin purchase successful', {
            transaction,
            balance: updatedWallet?.balance,
            pins: result.pins || result.pin,
            provider_response: result,
          });
        } else {
          // Refund user if failed
          await WalletService.credit(userId, amount, 'Exam pin purchase refund');
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'failed',
            error_message: result.msg || 'Unknown error',
            updated_at: new Date()
          });
          return ApiResponse.error(res, 'Exam pin purchase failed', 400);
        }
      } catch (error: any) {
        // Refund user on error
        await WalletService.credit(userId, amount, 'Exam pin purchase refund');
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'failed',
          error_message: error.message,
          updated_at: new Date()
        });
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  // Get transaction status
  async getTransactionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { reference } = req.params;

      // Determine which provider to use based on reference prefix
      let client: any = topupmateService;
      if (reference.startsWith('DATA_')) {
        client = smeplugService;
      }
      
      const result = await (client.getTransactionStatus
        ? client.getTransactionStatus(reference)
        : topupmateService.getTransactionStatus(reference));

      if (result.status === 'success' || result.status === true || result.status === 'true') {
        return ApiResponse.success(res, 'Transaction status retrieved', result.response);
      } else {
        return ApiResponse.error(res, 'Failed to retrieve transaction status', 400);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plans for developers (with developer pricing)
   * @route GET /api/billpayment/plans
   */
  async getDeveloperPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await Plan.find({ status: 'active' }).populate('operator_id');
      const airtimePlans = await AirtimePlan.find({ active: true });

      const payload = [
        ...plans.map(plan => ({
          id: plan._id,
          name: plan.name,
          operator: (plan.operator_id as any)?.name || 'MTN',
          operator_code: (plan.operator_id as any)?.code || '1',
          price: plan.developer_price || plan.price,
          type: plan.type,
          validity: plan.validity,
          data_amount: plan.data_amount
        })),
        ...airtimePlans.map(plan => ({
          id: String(plan._id),
          name: plan.name,
          operator: plan.providerName || 'MTN',
          operator_code: String(plan.providerId),
          price: Number(plan.price),
          type: plan.type.toLowerCase(),
          validity: plan.meta?.validity || '',
          data_amount: plan.meta?.data_value || plan.code || ''
        }))
      ];

      return ApiResponse.success(res, 'Developer plans retrieved successfully', payload);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance
   * @route GET /api/billpayment/balance
   */
  async getBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponse.error(res, 'User authentication failed', 401);
      }

      const wallet = await WalletService.getWalletByUserId(userId);
      if (!wallet) {
        return ApiResponse.error(res, 'Wallet not found', 404);
      }

      return ApiResponse.success(res, 'Wallet balance retrieved successfully', {
        balance: wallet.balance,
        currency: wallet.currency || 'NGN'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BillPaymentController();
