<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyOptionalAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        // Node demo behavior:
        // - If API key is present and valid, treat request as authenticated.
        // - Else require Bearer token authentication.

        $apiKey = $request->header('X-API-Key');
        if ($apiKey) {
            $user = User::query()
                ->where('api_key', $apiKey)
                ->where('api_key_enabled', true)
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or disabled API key',
                ], 401);
            }

            Auth::setUser($user);
            $request->setUserResolver(fn () => $user);

            return $next($request);
        }

        $authHeader = $request->header('Authorization');
        if (is_string($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
            $token = trim(substr($authHeader, 7));
            $accessToken = PersonalAccessToken::findToken($token);
            $tokenable = $accessToken?->tokenable;

            if ($tokenable instanceof User) {
                Auth::setUser($tokenable);
                $request->setUserResolver(fn () => $tokenable);

                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Unauthenticated',
        ], 401);
    }
}
