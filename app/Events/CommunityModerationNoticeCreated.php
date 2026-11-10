<?php

namespace App\Events;

use App\Models\CommunityModerationNotice;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunityModerationNoticeCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public CommunityModerationNotice $notice
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('community.radar'),
            new Channel('community.user.'.$this->notice->user_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'moderation.notice.created';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->notice->loadMissing('admin:id,name,avatar');

        return [
            'notice' => [
                'id' => $this->notice->id,
                'user_id' => $this->notice->user_id,
                'type' => $this->notice->type,
                'target_title' => $this->notice->target_title,
                'room_title' => $this->notice->room_title,
                'reason' => $this->notice->reason,
                'admin_name' => $this->notice->admin?->name ?? 'Moderator Cekara',
                'admin_avatar' => $this->notice->admin?->avatar,
                'is_read' => $this->notice->read_at !== null,
                'created_at_human' => $this->notice->created_at?->diffForHumans() ?? 'Baru saja',
            ],
        ];
    }
}
