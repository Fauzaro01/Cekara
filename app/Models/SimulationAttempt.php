<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $user_id
 * @property int $simulation_scenario_id
 * @property string $selected_option
 * @property bool $is_safe
 * @property int $score
 * @property string|null $feedback_notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'simulation_scenario_id',
    'selected_option',
    'is_safe',
    'score',
    'feedback_notes',
])]
class SimulationAttempt extends Model
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
            'is_safe' => 'boolean',
            'score' => 'integer',
        ];
    }

    /**
     * Get the scenario related to this attempt.
     *
     * @return BelongsTo<SimulationScenario, $this>
     */
    public function scenario(): BelongsTo
    {
        return $this->belongsTo(SimulationScenario::class, 'simulation_scenario_id');
    }

    /**
     * Get the user who made this attempt.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
