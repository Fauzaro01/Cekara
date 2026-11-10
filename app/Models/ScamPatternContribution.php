<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $user_id
 * @property int|null $community_room_id
 * @property string $title
 * @property string $category
 * @property string $platform
 * @property string|null $location
 * @property string $description
 * @property string|null $evidence_text
 * @property bool $is_verified
 * @property int $upvotes_count
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'community_room_id',
    'title',
    'category',
    'platform',
    'location',
    'description',
    'evidence_text',
    'is_verified',
    'upvotes_count',
])]
class ScamPatternContribution extends Model
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
            'is_verified' => 'boolean',
            'upvotes_count' => 'integer',
        ];
    }

    /**
     * Scope a query to only include verified radar alerts.
     */
    public function scopeVerified(Builder $query): Builder
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope a query to sort by trending (most upvoted).
     */
    public function scopeTrending(Builder $query): Builder
    {
        return $query->orderBy('upvotes_count', 'desc')->latest();
    }

    /**
     * Get the user who contributed this pattern.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the community discussion room this pattern was verified from.
     *
     * @return BelongsTo<CommunityRoom, $this>
     */
    public function communityRoom(): BelongsTo
    {
        return $this->belongsTo(CommunityRoom::class);
    }
}
