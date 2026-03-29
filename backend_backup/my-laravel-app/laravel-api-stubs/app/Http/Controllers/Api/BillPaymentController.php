<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class BillPaymentController extends BaseApiController
{
    public function balance(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function networks(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function dataPlans(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function cableProviders(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function electricityProviders(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function examPinProviders(Request $request) { return $this->fail('Not implemented yet', 501); }

    public function buyAirtime(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function buyData(Request $request) { return $this->fail('Not implemented yet', 501); }

    public function verifyCable(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function buyCable(Request $request) { return $this->fail('Not implemented yet', 501); }

    public function verifyElectricity(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function buyElectricity(Request $request) { return $this->fail('Not implemented yet', 501); }

    public function buyExamPin(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function transactionStatus(Request $request, string $reference) { return $this->fail('Not implemented yet', 501); }
}

