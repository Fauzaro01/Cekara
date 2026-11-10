<?php

namespace App\Http\Controllers;

use App\Events\CommunityAlertUpvoted;
use App\Events\CommunityMessageSent;
use App\Events\CommunityRoomCreated;
use App\Models\CommunityMessage;
use App\Models\CommunityMessageReaction;
use App\Models\CommunityRoom;
use App\Models\ScamPatternContribution;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        return Inertia::render('radar/index', [
            'alerts' => $alerts,
            'rooms' => $rooms,
            'dailyRoomQuota' => $dailyQuota,
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

        $room->load(['user:id,name,is_admin', 'messages.user:id,name,is_admin', 'messages.reactions'])
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
            'user:id,name,is_admin',
            'messages' => fn ($q) => $q->with(['user:id,name,is_admin', 'reactions'])->orderBy('id', 'asc'),
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

        $message->load(['user:id,name,is_admin', 'reactions']);
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

        return response()->json([
            'success' => true,
            'message' => $isAutoVerified
                ? 'Laporan langsung diverifikasi dan diterbitkan di Radar Komunitas.'
                : 'Laporan Anda telah diterima tim kurator Guardian Cekara dan akan ditinjau untuk diterbitkan.',
            'id' => $report->id,
        ], 201);
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
                'user:id,name,is_admin',
                'messages' => fn ($q) => $q->with(['user:id,name,is_admin', 'reactions'])->orderBy('id', 'asc'),
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
            'messages_count' => (int) ($room->messages_count ?? $room->messages->count()),
            'created_at_human' => $room->created_at?->diffForHumans() ?? 'Baru saja',
            'updated_at_human' => $room->updated_at?->diffForHumans() ?? 'Baru saja',
            'creator' => [
                'id' => $room->user?->id ?? 0,
                'name' => $room->user?->name ?? 'Anggota Guardian',
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
}
