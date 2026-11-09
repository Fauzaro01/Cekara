<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $community_room_id
 * @property int $user_id
 * @property string|null $body
 * @property string|null $image_path
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'community_room_id',
    'user_id',
    'body',
    'image_path',
])]
class CommunityMessage extends Model
{
    use HasFactory;

    /**
     * Get the discussion room this message belongs to.
     *
     * @return BelongsTo<CommunityRoom, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(CommunityRoom::class, 'community_room_id');
    }

    /**
     * Get the user who authored this message.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the reactions/likes on this message.
     *
     * @return HasMany<CommunityMessageReaction, $this>
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(CommunityMessageReaction::class);
    }
}

