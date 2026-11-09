<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('community.radar', function (): bool {
    return true;
});

Broadcast::channel('community.room.{roomId}', function (): bool {
    return true;
});

