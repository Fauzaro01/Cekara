<?php

namespace App\Rules;

use App\Services\Security\RecaptchaService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class RecaptchaRule implements ValidationRule
{
    /**
     * Create a new rule instance.
     */
    public function __construct(
        protected ?RecaptchaService $recaptchaService = null
    ) {}

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $service = $this->recaptchaService ?? app(RecaptchaService::class);
        $token = is_string($value) ? $value : null;

        $isValid = $service->verify($token, request()->ip());

        if (! $isValid) {
            $fail('Verifikasi reCAPTCHA tidak valid. Silakan coba lagi.');
        }
    }
}
