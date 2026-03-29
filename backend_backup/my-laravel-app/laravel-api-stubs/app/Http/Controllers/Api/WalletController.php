<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class WalletController extends BaseApiController
{
    public function getWallet(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function fundWallet(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function getWalletTransactions(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function transferFunds(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function adjustBalance(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }
}

