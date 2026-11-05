<?php

namespace App\Models;

use Database\Factories\EmergencyChecklistProgressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $scenario_key
 * @property string $step_key
 * @property bool $is_completed
 * @property Carbon|null $completed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'scenario_key',
    'step_key',
    'is_completed',
    'completed_at',
])]
class EmergencyChecklistProgress extends Model
{
    /** @use HasFactory<EmergencyChecklistProgressFactory> */
    use HasFactory;

    protected $table = 'emergency_checklist_progress';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the user who owns this checklist progress item.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
