<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class AdminController extends BaseApiController
{
    public function login(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function dashboard(Request $request) { return $this->fail('Not implemented yet', 501); }

    public function usersIndex(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function usersShow(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }
    public function usersUpdate(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }
    public function usersUpdateStatus(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }
    public function usersDestroy(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }

    public function generateApiKey(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }
    public function revokeApiKey(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }

    public function auditLogsIndex(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function auditLogsDestroy(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }
}

