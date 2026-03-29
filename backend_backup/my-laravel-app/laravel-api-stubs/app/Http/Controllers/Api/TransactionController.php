<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class TransactionController extends BaseApiController
{
    public function index(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function show(Request $request, string $id)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function updateStatus(Request $request, string $id)
    {
        return $this->fail('Not implemented yet', 501);
    }
}

