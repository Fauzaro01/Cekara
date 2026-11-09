<?php

namespace App\Models;

use Database\Factories\ScanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string|null $public_id
 * @property int|null $user_id
 * @property string $scan_type
 * @property string $content
 * @property string $risk_level
 * @property int $score
 * @property string $summary
 * @property array<string>|null $red_flags
 * @property array<string>|null $recommendations
 * @property string|null $provider_used
 * @property string|null $model_used
 * @property bool $is_mock
 * @property array<string, mixed>|null $metadata
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'public_id',
    'user_id',
    'scan_type',
    'content',
    'risk_level',
    'score',
    'summary',
    'red_flags',
    'recommendations',
    'provider_used',
    'model_used',
    'is_mock',
    'metadata',
])]
class Scan extends Model
{
    /** @use HasFactory<ScanFactory> */
    use HasFactory;

    /**
     * Bootstrap the model and its events.
     */
    protected static function booted(): void
    {
        static::creating(function (Scan $scan): void {
            if (empty($scan->public_id)) {
                $scan->public_id = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'is_mock' => 'boolean',
            'red_flags' => 'array',
            'recommendations' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the user who owns this scan.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
