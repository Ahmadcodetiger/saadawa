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
      provider: 'paymentpoint',
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
          status: existingAccount.status,
        },
      });
    }

    const result = await paymentPointService.createVirtualAccount({
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      phoneNumber: user.phone_number,
    });

    // ❌ TRUE FAILURE ONLY
    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        message: result?.message || 'Failed to create virtual account',
      });
    }

    const customer = result.data?.customer;
    const bankAccount = result.data?.bankAccounts?.[0];

    // ⚠️ PARTIAL SUCCESS (customer created but no account yet)
    if (!bankAccount) {
      return res.status(200).json({
        success: true,
        partial: true,
        message: 'Customer created, virtual account is being generated',
        data: {
          customer,
          bankAccounts: [],
          warnings: result.data?.errors || [],
        },
      });
    }

    const reference = customer?.customer_id || `REF_${Date.now()}`;

    // ✅ SAVE VIRTUAL ACCOUNT
    const virtualAccount = new VirtualAccount({
      user: new mongoose.Types.ObjectId(userId),
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      bankName: bankAccount.bankName,
      provider: 'paymentpoint',
      reference,
      status: 'active',
      metadata: {
        virtualAccountName: customer?.customer_name,
        virtualAccountNo: bankAccount.accountNumber,
        identityType: 'NIN',
        licenseNumber: customer?.customer_id,
      },
    });

    await virtualAccount.save();

    user.virtual_account = {
      account_number: bankAccount.accountNumber,
      account_name: bankAccount.accountName,
      bank_name: bankAccount.bankName,
      account_reference: reference,
      provider: 'paymentpoint',
      status: 'active',
    };

    await user.save();

    let wallet = await Wallet.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!wallet) {
      wallet = new Wallet({
        user_id: new mongoose.Types.ObjectId(userId),
        balance: 0,
        currency: 'NGN',
      });

      await wallet.save();
    }

    const outgoingData = {
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      bankName: bankAccount.bankName,
      bankCode: bankAccount.bankCode || 'N/A',
      customerId: customer?.customer_id,
      reference,
      provider: 'paymentpoint',
      status: 'active',
    };

    console.log('📡 Virtual Account Created:', outgoingData);

    return res.status(201).json({
      success: true,
      message: 'Virtual account created successfully',
      data: outgoingData,
    });

  } catch (error: any) {
    console.error('Create virtual account error:', error);

    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};
