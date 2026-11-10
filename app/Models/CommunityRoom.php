<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $title
 * @property string $slug
 * @property string $category
 * @property string $description
 * @property bool $is_pinned
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'title',
    'slug',
    'category',
    'description',
    'is_pinned',
])]
class CommunityRoom extends Model
{
    use HasFactory;

    public const MAX_DAILY_ROOMS_PER_USER = 3;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
        ];
    }

    /**
     * Get the user who created this discussion room.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the messages sent in this discussion room.
     *
     * @return HasMany<CommunityMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(CommunityMessage::class);
    }

    /**
     * Get the verified scam pattern created from this discussion room.
     *
     * @return HasOne<ScamPatternContribution, $this>
     */
    public function scamPattern(): HasOne
    {
        return $this->hasOne(ScamPatternContribution::class);
    }
}
