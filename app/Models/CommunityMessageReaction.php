<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $community_message_id
 * @property int $user_id
 * @property string $emoji
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'community_message_id',
    'user_id',
    'emoji',
])]
class CommunityMessageReaction extends Model
{
    use HasFactory;

    /**
     * Get the message this reaction belongs to.
     *
     * @return BelongsTo<CommunityMessage, $this>
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(CommunityMessage::class, 'community_message_id');
    }

    /**
     * Get the user who reacted.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

