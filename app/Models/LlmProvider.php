<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $key
 * @property string $model
 * @property string|null $api_key
 * @property string|null $base_url
 * @property array<string, mixed>|null $custom_headers
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'key', 'model', 'api_key', 'base_url', 'custom_headers', 'is_active'])]
#[Hidden(['api_key'])]
class LlmProvider extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'api_key' => 'encrypted',
            'custom_headers' => 'array',
        ];
    }

    /**
     * Decrypt the given encrypted string safely without crashing if MAC is invalid or APP_KEY changed.
     *
     * @param  string  $value
     * @return mixed
     */
    public function fromEncryptedString($value)
    {
        try {
            return parent::fromEncryptedString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Scope a query to only include active providers.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Determine if an API key is configured.
     */
    public function hasApiKey(): bool
    {
        try {
            return ! empty($this->api_key);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Return a masked version of the API key for administrative display.
     */
    public function getMaskedApiKey(): ?string
    {
        $raw = $this->getRawOriginal('api_key') ?? ($this->attributes['api_key'] ?? null);
        if (empty($raw)) {
            return null;
        }

        try {
            $decrypted = $this->api_key;
            if (empty($decrypted)) {
                return '••••••••';
            }

            $length = strlen($decrypted);
            if ($length <= 8) {
                return str_repeat('•', 8);
            }

            return substr($decrypted, 0, 4).str_repeat('•', 6).substr($decrypted, -4);
        } catch (\Throwable) {
            return '••••••••';
        }
    }
}
