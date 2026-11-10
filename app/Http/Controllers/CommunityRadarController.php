<?php

namespace App\Http\Controllers;

use App\Events\CommunityAlertUpvoted;
use App\Events\CommunityMessageDeleted;
use App\Events\CommunityMessageSent;
use App\Events\CommunityModerationNoticeCreated;
use App\Events\CommunityRoomCreated;
use App\Events\CommunityRoomDeleted;
use App\Models\CommunityCategory;
use App\Models\CommunityMessage;
use App\Models\CommunityMessageReaction;
use App\Models\CommunityModerationNotice;
use App\Models\CommunityRoom;
use App\Models\ScamPatternContribution;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CommunityRadarController extends Controller
{
    /**
     * Display the community threat radar and real-time community discussion rooms.
     */
    public function index(Request $request): Response
    {
        $category = $request->query('category');
        $platform = $request->query('platform');
        $sort = $request->query('sort', 'trending');
        $search = $request->query('search');

        $query = ScamPatternContribution::query()->where('is_verified', true);

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($platform && $platform !== 'all') {
            $query->where('platform', 'like', "%{$platform}%");
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($sort === 'latest') {
            $query->latest();
        } else {
            $query->orderBy('upvotes_count', 'desc')->latest();
        }

        $alerts = $query->get()->map(function (ScamPatternContribution $alert) {
            return [
                'id' => $alert->id,
                'community_room_id' => $alert->community_room_id,
                'title' => $alert->title,
                'category' => $alert->category,
                'platform' => $alert->platform,
                'location' => $alert->location,
                'description' => $alert->description,
                'evidence_text' => $alert->evidence_text,
                'upvotes_count' => $alert->upvotes_count,
                'created_at_human' => $alert->created_at?->diffForHumans() ?? 'Baru saja',
            ];
        });

        $totalVerified = ScamPatternContribution::where('is_verified', true)->count();
        $totalUpvotes = (int) ScamPatternContribution::where('is_verified', true)->sum('upvotes_count');
        $topPlatform = ScamPatternContribution::where('is_verified', true)
            ->selectRaw('platform, count(*) as count')
            ->groupBy('platform')
            ->orderByDesc('count')
            ->first()?->platform ?? '-';

        $rooms = $this->getFormattedRooms();
        $dailyQuota = $this->getDailyRoomQuota($request->user());

        $moderationNotices = $request->user()
            ? CommunityModerationNotice::where('user_id', $request->user()->id)
                ->with('admin:id,name,avatar')
                ->latest()
                ->take(30)
                ->get()
                ->map(function (CommunityModerationNotice $notice) {
                    return [
                        'id' => $notice->id,
                        'user_id' => $notice->user_id,
                        'type' => $notice->type,
                        'target_title' => $notice->target_title,
                        'room_title' => $notice->room_title,
                        'reason' => $notice->reason,
                        'admin_name' => $notice->admin?->name ?? 'Administrator Cekara',
                        'admin_avatar' => $notice->admin?->avatar,
                        'is_read' => $notice->read_at !== null,
                        'created_at_human' => $notice->created_at?->diffForHumans() ?? 'Baru saja',
                        'created_at_time' => $notice->created_at?->format('H:i') ?? '',
                    ];
                })
                ->values()
                ->all()
            : [];

        return Inertia::render('radar/index', [
            'alerts' => $alerts,
            'rooms' => $rooms,
            'categories' => $this->getAllCategories(),
            'dailyRoomQuota' => $dailyQuota,
            'moderationNotices' => $moderationNotices,
            'realtimeConfig' => [
                'driver' => 'reverb',
                'app_key' => (string) config('broadcasting.connections.reverb.key', 'cekara-reverb-key'),
                'host' => (string) config('broadcasting.connections.reverb.options.host', 'localhost'),
                'port' => (int) config('broadcasting.connections.reverb.options.port', 8080),
                'scheme' => (string) config('broadcasting.connections.reverb.options.scheme', 'http'),
                'channel' => 'community.radar',
            ],
            'filters' => [
                'category' => $category ?? 'all',
                'platform' => $platform ?? 'all',
                'sort' => $sort,
                'search' => $search ?? '',
            ],
            'stats' => [
                'total_alerts' => $totalVerified,
                'total_confirmed_cases' => $totalUpvotes,
                'top_targeted_platform' => $topPlatform,
            ],
        ]);
    }

    /**
     * Real-time delta sync endpoint for rooms, active room messages, and radar alert upvotes.
     */
    public function sync(Request $request): JsonResponse
    {
        $activeRoomId = $request->integer('room_id');
        $rooms = $this->getFormattedRooms($activeRoomId ?: null);

        $alertCounts = ScamPatternContribution::query()
            ->where('is_verified', true)
            ->pluck('upvotes_count', 'id');

        return response()->json([
            'rooms' => $rooms,
            'categories' => $this->getAllCategories(),
            'alert_upvotes' => $alertCounts,
            'daily_room_quota' => $this->getDailyRoomQuota($request->user()),
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Create a new community discussion room (max 3 rooms per day per authenticated user).
     */
    public function storeRoom(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Administrator dalam mode pemantauan hanya-lihat dan tidak dapat membuat ruang diskusi.',
            ], 403);
        }

        $roomsCreatedToday = CommunityRoom::query()
            ->where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->count();

        if ($roomsCreatedToday >= CommunityRoom::MAX_DAILY_ROOMS_PER_USER) {
            return response()->json([
                'message' => 'Batas pembuatan ruang diskusi tercapai: Anda hanya dapat membuat maksimal 3 ruang diskusi per hari. Silakan berdiskusi di ruang yang sudah ada atau buat lagi besok.',
                'errors' => [
                    'quota' => [
                        'Anda telah mencapai batas maksimal 3 ruang diskusi hari ini (3/3 terpakai).',
                    ],
                ],
                'daily_room_quota' => $this->getDailyRoomQuota($user),
            ], 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:5', 'max:160'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $room = CommunityRoom::create([
            'user_id' => $user->id,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']).'-'.Str::lower(Str::random(6)),
            'category' => $validated['category'],
            'description' => $validated['description'],
            'is_pinned' => false,
        ]);

        CommunityMessage::create([
            'community_room_id' => $room->id,
            'user_id' => $user->id,
            'body' => "**Topik Diskusi Dibuka:**\n\n".$validated['description'],
            'image_path' => null,
        ]);

        $room->load(['user:id,name,avatar,is_admin', 'messages.user:id,name,avatar,is_admin', 'messages.reactions'])
            ->loadCount('messages');

        $formattedRoom = $this->formatRoom($room, true);

        try {
            broadcast(new CommunityRoomCreated($formattedRoom));
        } catch (Throwable) {
            // Continue smoothly if WebSocket server is unreachable
        }

        return response()->json([
            'success' => true,
            'message' => 'Ruang diskusi berhasil dibuat dan disiarkan secara real-time!',
            'room' => $formattedRoom,
            'daily_room_quota' => $this->getDailyRoomQuota($user),
        ], 201);
    }

    /**
     * Fetch messages for a specific discussion room.
     */
    public function roomMessages(CommunityRoom $room): JsonResponse
    {
        $room->load([
            'user:id,name,avatar,is_admin',
            'scamPattern:id,community_room_id,is_verified',
            'messages' => fn ($q) => $q->with(['user:id,name,avatar,is_admin', 'reactions'])->orderBy('id', 'asc'),
        ])->loadCount('messages');

        return response()->json([
            'room' => $this->formatRoom($room, true),
        ]);
    }

    /**
     * Send a new message (supporting Markdown text and/or image attachment) in a discussion room.
     */
    public function storeMessage(Request $request, CommunityRoom $room): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Administrator dalam mode pemantauan hanya-lihat dan tidak dapat mengirim pesan diskusi.',
            ], 403);
        }

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:5000', 'required_without:image'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'required_without:body'],
        ], [
            'body.required_without' => 'Pesan teks (Markdown) atau lampiran gambar wajib diisi.',
            'image.required_without' => 'Pesan teks (Markdown) atau lampiran gambar wajib diisi.',
            'image.mimes' => 'Format gambar harus berupa JPG, JPEG, PNG, atau WEBP.',
            'image.max' => 'Ukuran gambar maksimal 5 MB.',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('community-messages', 'public');
        }

        $bodyText = isset($validated['body']) ? trim((string) $validated['body']) : null;
        if ($bodyText === '') {
            $bodyText = null;
        }

        if ($bodyText === null && $imagePath === null) {
            return response()->json([
                'message' => 'Pesan tidak boleh kosong.',
                'errors' => [
                    'body' => ['Silakan tulis pesan atau unggah gambar.'],
                ],
            ], 422);
        }

        $message = CommunityMessage::create([
            'community_room_id' => $room->id,
            'user_id' => $user->id,
            'body' => $bodyText,
            'image_path' => $imagePath,
        ]);

        $room->touch();

        $message->load(['user:id,name,avatar,is_admin', 'reactions']);
        $formattedMessage = $this->formatMessage($message);

        try {
            broadcast(new CommunityMessageSent($room->id, $formattedMessage));
        } catch (Throwable) {
            // Continue smoothly if WebSocket server is unreachable
        }

        return response()->json([
            'success' => true,
            'message' => $formattedMessage,
        ], 201);
    }

    /**
     * Toggle a like or emoji reaction (including custom keyboard emojis) on a discussion message.
     */
    public function toggleReaction(Request $request, CommunityMessage $message): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Administrator dalam mode pemantauan hanya-lihat.',
            ], 403);
        }

        $validated = $request->validate([
            'emoji' => ['required', 'string', 'max:32'],
        ]);

        $emoji = trim($validated['emoji']);
        if ($emoji === '') {
            return response()->json([
                'message' => 'Emoji reaksi tidak valid.',
            ], 422);
        }

        $existing = CommunityMessageReaction::query()
            ->where('community_message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->first();

        if ($existing) {
            $existing->delete();
            $action = 'removed';
        } else {
            CommunityMessageReaction::create([
                'community_message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]);
            $action = 'added';
        }

        $message->load('reactions');
        $reactionsPayload = $this->formatReactions($message);

        return response()->json([
            'success' => true,
            'action' => $action,
            'room_id' => $message->community_room_id,
            'message_id' => $message->id,
            'reactions' => $reactionsPayload,
        ]);
    }

    /**
     * Increment the community confirmation count ("Saya Juga Mengalami Ini").
     */
    public function upvote(Request $request, ScamPatternContribution $pattern): JsonResponse
    {
        if ($request->user()?->isAdmin()) {
            return response()->json([
                'message' => 'Administrator dalam mode pemantauan hanya-lihat.',
            ], 403);
        }

        $pattern->increment('upvotes_count');
        $newCount = (int) $pattern->fresh()->upvotes_count;

        try {
            broadcast(new CommunityAlertUpvoted($pattern->id, $newCount));
        } catch (Throwable) {
            // Continue smoothly if WebSocket server is unreachable
        }

        return response()->json([
            'success' => true,
            'new_count' => $newCount,
            'message' => 'Terima kasih atas konfirmasi Anda. Laporan ini membantu memperingatkan lebih banyak calon korban.',
        ]);
    }

    /**
     * Submit a new threat pattern report directly from the radar page.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'platform' => ['required', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'evidence_text' => ['nullable', 'string', 'max:5000'],
        ]);

        $user = $request->user();
        $isAutoVerified = $user?->is_admin ?? false;

        $report = ScamPatternContribution::create([
            'user_id' => $user?->id,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'platform' => $validated['platform'],
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'],
            'evidence_text' => $validated['evidence_text'] ?? null,
            'is_verified' => $isAutoVerified,
            'upvotes_count' => 1,
        ]);

        $formattedAlert = [
            'id' => $report->id,
            'title' => $report->title,
            'category' => $report->category,
            'platform' => $report->platform,
            'location' => $report->location,
            'description' => $report->description,
            'evidence_text' => $report->evidence_text,
            'upvotes_count' => $report->upvotes_count,
            'created_at_human' => $report->created_at?->diffForHumans() ?? 'Baru saja',
        ];

        return response()->json([
            'success' => true,
            'message' => $isAutoVerified
                ? 'Laporan berhasil diverifikasi dan langsung diterbitkan di Radar Komunitas.'
                : 'Laporan Anda telah diterima tim kurator Cekara dan akan ditinjau untuk diterbitkan.',
            'id' => $report->id,
            'alert' => $isAutoVerified ? $formattedAlert : null,
            'is_verified' => $isAutoVerified,
        ], 201);
    }

    /**
     * Delete a verified scam pattern (Admin only).
     */
    public function destroyPattern(Request $request, ScamPatternContribution $pattern): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya administrator yang dapat menghapus modus penipuan ini.',
            ], 403);
        }

        $pattern->delete();

        return response()->json([
            'success' => true,
            'message' => 'Modus penipuan berhasil dihapus.',
        ]);
    }

    /**
     * Delete a community discussion room (Admin or Room Creator).
     */
    public function destroyRoom(Request $request, CommunityRoom $room): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Silakan masuk untuk menghapus ruang diskusi.',
            ], 401);
        }

        $isAdmin = $user->isAdmin();
        $isOwner = (int) $room->user_id === (int) $user->id;

        if (! $isAdmin && ! $isOwner) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak untuk menghapus ruang diskusi ini.',
            ], 403);
        }

        $reason = null;
        if ($isAdmin) {
            $validated = $request->validate([
                'reason' => ['required', 'string', 'min:5', 'max:1000'],
            ], [
                'reason.required' => 'Wajib menyertakan alasan penghapusan ruang diskusi.',
                'reason.min' => 'Alasan penghapusan minimal 5 karakter.',
            ]);
            $reason = trim($validated['reason']);
        }

        $roomId = $room->id;
        $roomTitle = $room->title;
        $roomOwnerId = $room->user_id;

        // Delete message attachments from storage if any
        foreach ($room->messages()->whereNotNull('image_path')->get() as $msg) {
            if ($msg->image_path && Storage::disk('public')->exists($msg->image_path)) {
                Storage::disk('public')->delete($msg->image_path);
            }
        }

        $room->delete();

        // Create moderation notice for the user if moderated by admin
        if ($isAdmin && $roomOwnerId) {
            $notice = CommunityModerationNotice::create([
                'user_id' => $roomOwnerId,
                'admin_id' => $user->id,
                'type' => 'room_deleted',
                'target_title' => $roomTitle,
                'room_title' => $roomTitle,
                'reason' => $reason ?? 'Melanggar aturan komunitas.',
            ]);

            try {
                broadcast(new CommunityModerationNoticeCreated($notice));
            } catch (Throwable) {
                // Ignore broadcast failure in mock/test
            }
        }

        try {
            broadcast(new CommunityRoomDeleted($roomId));
        } catch (Throwable) {
            // Ignore broadcast failure in mock/local test
        }

        return response()->json([
            'success' => true,
            'message' => "Ruang diskusi '{$roomTitle}' berhasil dihapus.",
            'room_id' => $roomId,
        ]);
    }

    /**
     * Delete an individual community message (Admin or Message Author).
     */
    public function destroyMessage(Request $request, CommunityMessage $message): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Silakan masuk untuk menghapus pesan.',
            ], 401);
        }

        $isAdmin = $user->isAdmin();
        $isAuthor = (int) $message->user_id === (int) $user->id;

        if (! $isAdmin && ! $isAuthor) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak untuk menghapus pesan ini.',
            ], 403);
        }

        $reason = null;
        if ($isAdmin) {
            $validated = $request->validate([
                'reason' => ['required', 'string', 'min:5', 'max:1000'],
            ], [
                'reason.required' => 'Wajib menyertakan alasan penghapusan pesan.',
                'reason.min' => 'Alasan penghapusan minimal 5 karakter.',
            ]);
            $reason = trim($validated['reason']);
        }

        $messageId = $message->id;
        $roomId = $message->community_room_id;
        $messageOwnerId = $message->user_id;
        $messageBody = $message->body ?? 'Lampiran gambar diskusi';
        $messagePreview = Str::limit($messageBody, 80);
        $roomTitle = $message->room?->title ?? 'Ruang Diskusi';

        if ($message->image_path && Storage::disk('public')->exists($message->image_path)) {
            Storage::disk('public')->delete($message->image_path);
        }

        $message->delete();

        // Create moderation notice for the user if moderated by admin
        if ($isAdmin && $messageOwnerId) {
            $notice = CommunityModerationNotice::create([
                'user_id' => $messageOwnerId,
                'admin_id' => $user->id,
                'type' => 'message_deleted',
                'target_title' => $messagePreview,
                'room_title' => $roomTitle,
                'reason' => $reason ?? 'Melanggar aturan komunitas.',
            ]);

            try {
                broadcast(new CommunityModerationNoticeCreated($notice));
            } catch (Throwable) {
                // Ignore broadcast failure in mock/test
            }
        }

        try {
            broadcast(new CommunityMessageDeleted($roomId, $messageId));
        } catch (Throwable) {
            // Ignore broadcast failure in mock/local test
        }

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dihapus.',
            'room_id' => $roomId,
            'message_id' => $messageId,
        ]);
    }

    /**
     * Mark a single moderation notice as read.
     */
    public function markNoticeAsRead(Request $request, CommunityModerationNotice $notice): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user || (int) $notice->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $notice->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'notice_id' => $notice->id,
        ]);
    }

    /**
     * Mark all moderation notices of current user as read.
     */
    public function markAllNoticesAsRead(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Silakan masuk.'], 401);
        }

        CommunityModerationNotice::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
        ]);
    }

    /**
     * Delete/dismiss a moderation notice.
     */
    public function destroyNotice(Request $request, CommunityModerationNotice $notice): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user || (int) $notice->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $noticeId = $notice->id;
        $notice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi dihapus.',
            'notice_id' => $noticeId,
        ]);
    }

    /**
     * Get the user's daily room creation quota status.
     *
     * @return array{used: int, max: int, remaining: int}
     */
    private function getDailyRoomQuota(?User $user): array
    {
        $max = CommunityRoom::MAX_DAILY_ROOMS_PER_USER;

        if (! $user) {
            return [
                'used' => 0,
                'max' => $max,
                'remaining' => $max,
            ];
        }

        $used = CommunityRoom::query()
            ->where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->count();

        return [
            'used' => $used,
            'max' => $max,
            'remaining' => max(0, $max - $used),
        ];
    }

    /**
     * Fetch and format community discussion rooms.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getFormattedRooms(?int $onlyMessagesForRoomId = null): array
    {
        $rooms = CommunityRoom::query()
            ->with([
                'user:id,name,avatar,is_admin',
                'scamPattern:id,community_room_id,is_verified',
                'messages' => fn ($q) => $q->with(['user:id,name,avatar,is_admin', 'reactions'])->orderBy('id', 'asc'),
            ])
            ->withCount('messages')
            ->orderByDesc('is_pinned')
            ->orderByDesc('updated_at')
            ->limit(30)
            ->get();

        return $rooms->map(function (CommunityRoom $room, int $index) use ($onlyMessagesForRoomId) {
            $includeMessages = $onlyMessagesForRoomId === null
                ? true
                : ($room->id === $onlyMessagesForRoomId || $index === 0);

            return $this->formatRoom($room, $includeMessages);
        })->values()->all();
    }

    /**
     * Format a single discussion room.
     *
     * @return array<string, mixed>
     */
    private function formatRoom(CommunityRoom $room, bool $includeMessages = true): array
    {
        return [
            'id' => $room->id,
            'title' => $room->title,
            'slug' => $room->slug,
            'category' => $room->category,
            'description' => $room->description,
            'is_pinned' => (bool) $room->is_pinned,
            'is_verified_radar' => (bool) ($room->scamPattern?->is_verified ?? false),
            'verified_pattern_id' => $room->scamPattern?->id,
            'messages_count' => (int) ($room->messages_count ?? $room->messages->count()),
            'created_at_human' => $room->created_at?->diffForHumans() ?? 'Baru saja',
            'updated_at_human' => $room->updated_at?->diffForHumans() ?? 'Baru saja',
            'creator' => [
                'id' => $room->user?->id ?? 0,
                'name' => $room->user?->name ?? 'Anggota Komunitas',
                'avatar' => $room->user?->getAvatarUrl(),
                'is_admin' => (bool) ($room->user?->is_admin ?? false),
            ],
            'messages' => $includeMessages
                ? $room->messages->map(fn (CommunityMessage $msg) => $this->formatMessage($msg))->values()->all()
                : [],
        ];
    }

    /**
     * Format a single community message with author, image URL, and grouped reactions.
     *
     * @return array<string, mixed>
     */
    private function formatMessage(CommunityMessage $message): array
    {
        return [
            'id' => $message->id,
            'room_id' => $message->community_room_id,
            'body' => $message->body,
            'image_url' => $message->image_path ? Storage::disk('public')->url($message->image_path) : null,
            'created_at_human' => $message->created_at?->diffForHumans() ?? 'Baru saja',
            'created_at_time' => $message->created_at?->format('H:i') ?? now()->format('H:i'),
            'user' => [
                'id' => $message->user?->id ?? 0,
                'name' => $message->user?->name ?? 'Anggota Komunitas',
                'avatar' => $message->user?->getAvatarUrl(),
                'is_admin' => (bool) ($message->user?->is_admin ?? false),
            ],
            'reactions' => $this->formatReactions($message),
        ];
    }

    /**
     * Group reactions by emoji with count and user_ids.
     *
     * @return array<int, array{emoji: string, count: int, user_ids: array<int, int>}>
     */
    private function formatReactions(CommunityMessage $message): array
    {
        return $message->reactions
            ->groupBy('emoji')
            ->map(function ($group, string $emoji) {
                return [
                    'emoji' => $emoji,
                    'count' => $group->count(),
                    'user_ids' => $group->pluck('user_id')->map(fn ($id) => (int) $id)->values()->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Get list of community discussion categories (defaults merged with custom dynamic ones).
     *
     * @return array<int, array{key: string, label: string, variant: string}>
     */
    /**
     * Get list of community discussion categories (stored persistently in database).
     *
     * @return array<int, array{key: string, label: string, variant: string}>
     */
    private function getAllCategories(): array
    {
        $defaults = [
            ['key' => 'apk_malware', 'label' => 'Malware APK', 'variant' => 'danger'],
            ['key' => 'phishing_banking', 'label' => 'Phishing Bank', 'variant' => 'warn'],
            ['key' => 'fake_job', 'label' => 'Lowongan Palsu', 'variant' => 'warn'],
            ['key' => 'social_engineering', 'label' => 'Rekayasa Sosial', 'variant' => 'brand'],
            ['key' => 'fake_giveaway', 'label' => 'Undian Palsu', 'variant' => 'neutral'],
        ];

        try {
            $categories = CommunityCategory::query()->orderBy('id')->get();

            if ($categories->isEmpty()) {
                foreach ($defaults as $def) {
                    CommunityCategory::firstOrCreate(
                        ['key' => $def['key']],
                        ['label' => $def['label'], 'variant' => $def['variant']]
                    );
                }
                $categories = CommunityCategory::query()->orderBy('id')->get();
            }

            return $categories->map(fn (CommunityCategory $cat) => [
                'key' => (string) $cat->key,
                'label' => (string) $cat->label,
                'variant' => (string) $cat->variant,
            ])->all();
        } catch (Throwable) {
            return $defaults;
        }
    }

    /**
     * Store a new custom category (admin only, persisted in database).
     */
    public function storeCategory(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya administrator yang dapat menambahkan kategori percakapan.',
            ], 403);
        }

        $validated = $request->validate([
            'label' => ['required', 'string', 'min:3', 'max:50'],
            'key' => ['nullable', 'string', 'min:3', 'max:50', 'regex:/^[a-z0-9_-]+$/'],
            'variant' => ['nullable', 'string', 'in:danger,warn,brand,neutral'],
        ], [
            'label.required' => 'Nama kategori wajib diisi.',
            'key.regex' => 'Kunci kategori hanya boleh berisi huruf kecil, angka, garis bawah, dan tanda hubung.',
            'variant.in' => 'Varian warna harus salah satu dari: danger, warn, brand, atau neutral.',
        ]);

        $label = trim($validated['label']);
        $key = ! empty($validated['key'])
            ? Str::slug($validated['key'], '_')
            : Str::slug($label, '_');
        $variant = $validated['variant'] ?? 'brand';

        $existing = CommunityCategory::where('key', $key)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Kategori dengan kunci tersebut sudah ada.',
                'errors' => ['key' => ['Kategori dengan kunci tersebut sudah ada.']],
            ], 422);
        }

        $category = CommunityCategory::create([
            'key' => $key,
            'label' => $label,
            'variant' => $variant,
            'created_by' => $user->id,
        ]);

        $newCategory = [
            'key' => $category->key,
            'label' => $category->label,
            'variant' => $category->variant,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Kategori baru berhasil ditambahkan dan disimpan ke database.',
            'category' => $newCategory,
            'categories' => $this->getAllCategories(),
        ], 201);
    }

    /**
     * Update category for a specific community discussion room (admin only).
     */
    public function updateRoomCategory(Request $request, CommunityRoom $room): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya administrator yang dapat memperbarui kategori percakapan ini.',
            ], 403);
        }

        $validated = $request->validate([
            'category' => ['required', 'string', 'max:100'],
        ]);

        $room->update([
            'category' => $validated['category'],
        ]);

        $room->load(['user:id,name,avatar,is_admin', 'messages.user:id,name,avatar,is_admin', 'messages.reactions'])
            ->loadCount('messages');

        $formattedRoom = $this->formatRoom($room, true);

        return response()->json([
            'success' => true,
            'message' => 'Kategori ruang diskusi berhasil diperbarui.',
            'room' => $formattedRoom,
        ]);
    }

    /**
     * Verify and promote a community discussion room into an official verified radar scam pattern (Admin only).
     */
    public function verifyRoomAsPattern(Request $request, CommunityRoom $room): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Hanya administrator yang dapat memverifikasi obrolan komunitas menjadi modus radar.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'platform' => ['required', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'evidence_text' => ['nullable', 'string', 'max:5000'],
        ]);

        $pattern = ScamPatternContribution::updateOrCreate(
            ['community_room_id' => $room->id],
            [
                'user_id' => $room->user_id,
                'title' => $validated['title'],
                'category' => $validated['category'],
                'platform' => $validated['platform'],
                'location' => $validated['location'] ?? null,
                'description' => $validated['description'],
                'evidence_text' => $validated['evidence_text'] ?? null,
                'is_verified' => true,
                'upvotes_count' => max(1, $room->messages()->count()),
            ]
        );

        $room->load([
            'user:id,name,avatar,is_admin',
            'scamPattern:id,community_room_id,is_verified',
            'messages.user:id,name,avatar,is_admin',
            'messages.reactions',
        ])->loadCount('messages');

        $formattedAlert = [
            'id' => $pattern->id,
            'community_room_id' => $pattern->community_room_id,
            'title' => $pattern->title,
            'category' => $pattern->category,
            'platform' => $pattern->platform,
            'location' => $pattern->location,
            'description' => $pattern->description,
            'evidence_text' => $pattern->evidence_text,
            'upvotes_count' => $pattern->upvotes_count,
            'created_at_human' => $pattern->created_at?->diffForHumans() ?? 'Baru saja',
        ];

        return response()->json([
            'success' => true,
            'message' => "Ruang diskusi '{$room->title}' berhasil diverifikasi dan diterbitkan ke Daftar Modus Terverifikasi!",
            'alert' => $formattedAlert,
            'room' => $this->formatRoom($room, true),
        ], 201);
    }
}
