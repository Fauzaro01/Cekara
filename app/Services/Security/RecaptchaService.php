<?php

namespace App\Services\Security;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class RecaptchaService
{
    /**
     * Verify the reCAPTCHA token against Google API.
     */
    public function verify(?string $token, ?string $ip = null): bool
    {
        if (empty($token) || trim($token) === '') {
            return false;
        }

        $secret = config('services.recaptcha.secret_key');

        if (empty($secret)) {
            Log::warning('reCAPTCHA secret key is not configured.');

            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(5)
                ->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]);

            if (! $response->successful()) {
                Log::warning('reCAPTCHA verification HTTP request returned unsuccessful status', [
                    'status' => $response->status(),
                ]);

                return false;
            }

            return $response->json('success') === true;
        } catch (Throwable $e) {
            Log::warning('reCAPTCHA verification exception encountered', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
