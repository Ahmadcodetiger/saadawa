<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class PaymentWebhookController extends BaseApiController
{
    public function monnify(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function paystack(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function payrant(Request $request) { return $this->fail('Not implemented yet', 501); }
}

