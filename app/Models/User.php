<?php

namespace App\Models;

use App\Notifications\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property bool $is_admin
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'is_admin', 'email_verified_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_admin' => false,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        try {
            $this->notify(new VerifyEmailNotification);
        } catch (Throwable $e) {
            Log::warning('SMTP email verification delivery failed, falling back to log mailer.', [
                'email' => $this->email,
                'error' => $e->getMessage(),
            ]);

            try {
                config(['mail.default' => 'log']);
                $this->notify(new VerifyEmailNotification);
            } catch (Throwable) {
                // Prevent registration crash if fallback mailer also fails
            }
        }
    }

    /**
     * Determine whether the user is an administrator.
     */
    public function isAdmin(): bool
    {
        return (bool) $this->is_admin;
    }

    /**
     * Get the public URL for the user's avatar.
     */
    public function getAvatarUrl(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        if (str_starts_with($this->avatar, 'http://') || str_starts_with($this->avatar, 'https://') || str_starts_with($this->avatar, '/storage/')) {
            return $this->avatar;
        }

        return asset('storage/'.$this->avatar);
    }

    /**
     * Get the scans performed by this user.
     *
     * @return HasMany<Scan, $this>
     */
    public function scans(): HasMany
    {
        return $this->hasMany(Scan::class);
    }

    /**
     * Get the simulation attempts made by this user.
     *
     * @return HasMany<SimulationAttempt, $this>
     */
    public function simulationAttempts(): HasMany
    {
        return $this->hasMany(SimulationAttempt::class);
    }

    /**
     * Get the emergency checklist progress items for this user.
     *
     * @return HasMany<EmergencyChecklistProgress, $this>
     */
    public function emergencyChecklistProgress(): HasMany
    {
        return $this->hasMany(EmergencyChecklistProgress::class);
    }

    /**
     * Get the community discussion rooms created by this user.
     *
     * @return HasMany<CommunityRoom, $this>
     */
    public function communityRooms(): HasMany
    {
        return $this->hasMany(CommunityRoom::class);
    }

    /**
     * Get the community messages sent by this user.
     *
     * @return HasMany<CommunityMessage, $this>
     */
    public function communityMessages(): HasMany
    {
        return $this->hasMany(CommunityMessage::class);
    }
}
