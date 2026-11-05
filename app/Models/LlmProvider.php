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
        try {
            if (empty($this->api_key)) {
                return null;
            }

            $length = strlen($this->api_key);
            if ($length <= 8) {
                return str_repeat('•', 8);
            }

            return substr($this->api_key, 0, 4).str_repeat('•', 6).substr($this->api_key, -4);
        } catch (\Throwable) {
            return '••••••••';
        }
    }
}
