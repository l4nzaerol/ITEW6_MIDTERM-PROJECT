<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:60', 'unique:users,name'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $user = User::query()->create([
            'name' => trim($payload['username']),
            'email' => strtolower(trim($payload['email'])),
            'password' => Hash::make($payload['password']),
        ]);

        return response()->json([
            'id' => (int) $user->id,
            'username' => $user->name,
            'email' => $user->email,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'login' => ['required', 'string', 'max:120'],
            'password' => ['required', 'string', 'max:100'],
        ]);

        $login = trim($payload['login']);
        $user = User::query()
            ->where('name', $login)
            ->orWhere('email', strtolower($login))
            ->first();

        if (! $user || ! Hash::check($payload['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Invalid username/email or password.'],
            ]);
        }

        return response()->json([
            'id' => (int) $user->id,
            'username' => $user->name,
            'email' => $user->email,
        ]);
    }
}

