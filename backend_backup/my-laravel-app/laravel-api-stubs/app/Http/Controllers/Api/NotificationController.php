<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class NotificationController extends BaseApiController
{
    public function index(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function show(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }
    public function markAsRead(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }
    public function markAllAsRead(Request $request) { return $this->fail('Not implemented yet', 501); }
    public function destroy(Request $request, string $id) { return $this->fail('Not implemented yet', 501); }
    public function destroyAll(Request $request) { return $this->fail('Not implemented yet', 501); }
}

