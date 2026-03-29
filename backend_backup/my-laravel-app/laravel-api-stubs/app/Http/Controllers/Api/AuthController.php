<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class AuthController extends BaseApiController
{
    public function register(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function login(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function verifyOtp(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function resendOtp(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function forgotPassword(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }

    public function verifyEmailOtp(Request $request)
    {
        return $this->fail('Not implemented yet', 501);
    }
}

