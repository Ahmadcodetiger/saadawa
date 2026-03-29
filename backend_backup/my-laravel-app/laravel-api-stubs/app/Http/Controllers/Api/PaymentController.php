<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class PaymentController extends BaseApiController
{
    public function initiate(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function verify(Request $request, string $reference) { return $this->fail('Not implemented yet', 501); }
    public function banks(Request $request) { return $this->fail('Not implemented yet', 501); }

    public function createVirtualAccount(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function getVirtualAccount(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function deactivateVirtualAccount(Request $request) { return $this->fail('Not implemented yet', 501); }
}

