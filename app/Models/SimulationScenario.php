<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string $category
 * @property string $difficulty
 * @property string $context_description
 * @property string $sender_name
 * @property string|null $sender_avatar
 * @property array<int, array<string, mixed>> $chat_messages
 * @property array<int, array<string, mixed>> $options
 * @property array<int, string> $psychological_tricks
 * @property array<int, string> $red_flags
 * @property string $prevention_advice
 * @property int $order
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'title',
    'slug',
    'category',
    'difficulty',
    'context_description',
    'sender_name',
    'sender_avatar',
    'chat_messages',
    'options',
    'psychological_tricks',
    'red_flags',
    'prevention_advice',
    'order',
    'is_active',
])]
class SimulationScenario extends Model
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
            'chat_messages' => 'array',
            'options' => 'array',
            'psychological_tricks' => 'array',
            'red_flags' => 'array',
            'order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include active scenarios ordered by precedence.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('order', 'asc');
    }

    /**
     * Get all simulation attempts for this scenario.
     *
     * @return HasMany<SimulationAttempt, $this>
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(SimulationAttempt::class);
    }
}
