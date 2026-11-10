import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Bold,
    CheckCheck,
    CheckCircle2,
    Clock,
    Code,
    Eye,
    Image as ImageIcon,
    Italic,
    Keyboard,
    List,
    Loader2,
    Lock,
    MapPin,
    MessageCircle,
    MessageSquare,
    MessageSquarePlus,
    Pin,
    Plus,
    Quote,
    Radio,
    Search,
    Send,
    Share2,
    ShieldAlert,
    ShieldCheck,
    Smile,
    ThumbsUp,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import type { ClipboardEvent, FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import { useSkeletonMount, RadarSkeleton } from '@/components/ui/skeleton';
import type { Auth } from '@/types/auth';

interface SharedProps {
    auth?: Auth;
    [key: string]: unknown;
}

interface ThreatAlert {
    id: number;
    community_room_id?: number | null;
    title: string;
    category: string;
    platform: string;
    location: string | null;
    description: string;
    evidence_text: string | null;
    upvotes_count: number;
    created_at_human: string;
}

interface MessageReaction {
    emoji: string;
    count: number;
    user_ids: number[];
}

interface CommunityMessageItem {
    id: number;
    room_id: number;
    body: string | null;
    image_url: string | null;
    created_at_human: string;
    created_at_time: string;
    user: {
        id: number;
        name: string;
        avatar?: string | null;
        is_admin: boolean;
    };
    reactions: MessageReaction[];
}

interface CommunityRoomItem {
    id: number;
    title: string;
    slug: string;
    category: string;
    description: string;
    is_pinned: boolean;
    is_verified_radar?: boolean;
    verified_pattern_id?: number | null;
    messages_count: number;
    created_at_human: string;
    updated_at_human: string;
    creator: {
        id: number;
        name: string;
        avatar?: string | null;
        is_admin: boolean;
    };
    messages: CommunityMessageItem[];
}

interface DailyRoomQuota {
    used: number;
    max: number;
    remaining: number;
}

interface RealtimeConfig {
    driver: string;
    app_key: string;
    host: string;
    port: number;
    scheme: string;
    channel: string;
}

interface Stats {
    total_alerts: number;
    total_confirmed_cases: number;
    top_targeted_platform: string;
}

interface CategoryItem {
    key: string;
    label: string;
    variant?: 'danger' | 'warn' | 'brand' | 'neutral' | string;
}

interface ModerationNoticeItem {
    id: number;
    user_id: number;
    type: 'room_deleted' | 'message_deleted';
    target_title: string;
    room_title: string | null;
    reason: string;
    admin_name: string;
    admin_avatar?: string | null;
    is_read: boolean;
    created_at_human: string;
    created_at_time: string;
}

interface Props {
    alerts: ThreatAlert[];
    rooms?: CommunityRoomItem[];
    categories?: CategoryItem[];
    dailyRoomQuota?: DailyRoomQuota;
    moderationNotices?: ModerationNoticeItem[];
    realtimeConfig?: RealtimeConfig;
    filters: {
        category: string;
        platform: string;
        sort: string;
        search: string;
    };
    stats?: Stats;
}

interface SharedAuthProps {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            avatar?: string | null;
            is_admin?: boolean;
        } | null;
    };
}

const defaultCategories: CategoryItem[] = [
    { key: 'all', label: 'Semua Kategori' },
    { key: 'apk_malware', label: 'Malware APK', variant: 'danger' },
    { key: 'phishing_banking', label: 'Phishing Bank', variant: 'warn' },
    { key: 'fake_job', label: 'Lowongan Palsu', variant: 'warn' },
    { key: 'social_engineering', label: 'Rekayasa Sosial', variant: 'brand' },
    { key: 'fake_giveaway', label: 'Undian Palsu', variant: 'neutral' },
];

const defaultCategoryBadgeLabel: Record<
    string,
    { label: string; variant: 'danger' | 'warn' | 'brand' | 'neutral' }
> = {
    apk_malware: { label: 'Malware APK', variant: 'danger' },
    phishing_banking: { label: 'Phishing Bank', variant: 'warn' },
    social_engineering: { label: 'Rekayasa Sosial', variant: 'brand' },
    fake_job: { label: 'Lowongan Palsu', variant: 'warn' },
    fake_giveaway: { label: 'Undian Palsu', variant: 'neutral' },
};

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🛡️', '⚠️', '🙏', '👏', '😮'];

function getXsrfToken(): string {
    if (typeof document === 'undefined') {
        return '';
    }
    const meta = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    if (meta) {
        return meta;
    }
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Safe inline Markdown renderer styled with Cekara warm theme.
 */
function renderInlineMarkdown(text: string): ReactNode[] {
    const tokens = text.split(
        /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g,
    );

    return tokens.map((token, index) => {
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return (
                <strong key={index} className="font-extrabold text-[#3B2A1E]">
                    {token.slice(2, -2)}
                </strong>
            );
        }

        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
            return (
                <code
                    key={index}
                    className="rounded-lg border border-[#3B2A1E]/30 bg-[#FFE27A]/60 px-1.5 py-0.5 font-mono text-xs font-bold text-[#3B2A1E]"
                >
                    {token.slice(1, -1)}
                </code>
            );
        }

        if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
            return (
                <em key={index} className="italic text-[#4A3B32]">
                    {token.slice(1, -1)}
                </em>
            );
        }

        const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (linkMatch) {
            return (
                <a
                    key={index}
                    href={linkMatch[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#E06812] underline decoration-2 underline-offset-2 hover:text-[#3B2A1E]"
                >
                    {linkMatch[1]}
                </a>
            );
        }

        return <span key={index}>{token}</span>;
    });
}

/**
 * Safe block Markdown renderer styled with Cekara warm theme.
 */
function MarkdownRenderer({ content }: { content: string }) {
    const segments = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-2 text-sm leading-relaxed text-[#3B2A1E]">
            {segments.map((segment, segIdx) => {
                if (segment.startsWith('```') && segment.endsWith('```')) {
                    const rawCode = segment
                        .slice(3, -3)
                        .replace(/^[a-zA-Z0-9_-]+\n/, '');
                    return (
                        <pre
                            key={segIdx}
                            className="overflow-x-auto rounded-2xl border-2 border-[#3B2A1E] bg-[#3B2A1E] p-3.5 font-mono text-xs leading-relaxed text-[#FFE27A] shadow-[2px_2px_0px_0px_#3B2A1E]"
                        >
                            <code>{rawCode.trim()}</code>
                        </pre>
                    );
                }

                const lines = segment.split('\n');
                const elements: ReactNode[] = [];
                let listItems: string[] = [];

                const flushList = (keyPrefix: string) => {
                    if (listItems.length > 0) {
                        elements.push(
                            <ul
                                key={`${keyPrefix}-list`}
                                className="ml-5 list-disc space-y-1 font-medium text-[#4A3B32]"
                            >
                                {listItems.map((item, idx) => (
                                    <li key={idx}>
                                        {renderInlineMarkdown(item)}
                                    </li>
                                ))}
                            </ul>,
                        );
                        listItems = [];
                    }
                };

                lines.forEach((line, lineIdx) => {
                    const trimmed = line.trim();

                    if (trimmed === '') {
                        flushList(`${segIdx}-${lineIdx}`);
                        return;
                    }

                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        listItems.push(trimmed.slice(2));
                        return;
                    }

                    flushList(`${segIdx}-${lineIdx}`);

                    if (trimmed.startsWith('> ')) {
                        elements.push(
                            <blockquote
                                key={`${segIdx}-${lineIdx}`}
                                className="rounded-xl border-l-4 border-[#FF9A3C] bg-[#FFF8EC] px-3.5 py-2 text-xs sm:text-sm font-semibold italic text-[#6B5646]"
                            >
                                {renderInlineMarkdown(trimmed.slice(2))}
                            </blockquote>,
                        );
                        return;
                    }

                    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                        const cleanHeading = trimmed.replace(/^#+\s+/, '');
                        elements.push(
                            <h4
                                key={`${segIdx}-${lineIdx}`}
                                className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]"
                            >
                                {renderInlineMarkdown(cleanHeading)}
                            </h4>,
                        );
                        return;
                    }

                    elements.push(
                        <p
                            key={`${segIdx}-${lineIdx}`}
                            className="break-words text-[#4A3B32]"
                        >
                            {renderInlineMarkdown(line)}
                        </p>,
                    );
                });

                flushList(`${segIdx}-end`);

                return (
                    <div key={segIdx} className="space-y-1.5">
                        {elements}
                    </div>
                );
            })}
        </div>
    );
}

export default function CommunityRadarIndex({
    alerts: initialAlerts,
    rooms: initialRooms = [],
    categories: initialCategories = defaultCategories,
    dailyRoomQuota: initialQuota = { used: 0, max: 3, remaining: 3 },
    moderationNotices: initialNotices = [],
    realtimeConfig,
    filters,
}: Props) {
    const { auth } = usePage<{ props: SharedAuthProps }>().props as unknown as SharedAuthProps;
    const currentUser = auth?.user ?? null;
    const isInitialLoading = useSkeletonMount(280);

    // Moderation notices state (Sandbox Pesan Notif)
    const [moderationNotices, setModerationNotices] =
        useState<ModerationNoticeItem[]>(initialNotices);
    const [isNoticeSandboxOpen, setIsNoticeSandboxOpen] = useState(false);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const [markingReadNoticeId, setMarkingReadNoticeId] = useState<number | null>(
        null,
    );

    const unreadNoticesCount = useMemo(
        () => moderationNotices.filter((n) => !n.is_read).length,
        [moderationNotices],
    );

    // Delete reason & confirmation states
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteReasonError, setDeleteReasonError] = useState<string | null>(
        null,
    );

    // Categories dynamic state
    const [categoryList, setCategoryList] = useState<CategoryItem[]>(() => {
        if (!initialCategories || initialCategories.length === 0) {
            return defaultCategories;
        }
        const hasAll = initialCategories.some((c) => c.key === 'all');
        return hasAll
            ? initialCategories
            : [{ key: 'all', label: 'Semua Kategori' }, ...initialCategories];
    });

    const categoryBadgeMap = useMemo(() => {
        const map: Record<
            string,
            { label: string; variant: 'danger' | 'warn' | 'brand' | 'neutral' }
        > = { ...defaultCategoryBadgeLabel };

        for (const cat of categoryList) {
            if (cat.key !== 'all') {
                const v =
                    cat.variant === 'danger' ||
                    cat.variant === 'warn' ||
                    cat.variant === 'brand' ||
                    cat.variant === 'neutral'
                        ? cat.variant
                        : 'brand';
                map[cat.key] = {
                    label: cat.label,
                    variant: v,
                };
            }
        }
        return map;
    }, [categoryList]);

    // Tab switcher between Ruang Diskusi & Radar Ancaman
    const [activeTab, setActiveTab] = useState<'discussions' | 'radar'>(
        'discussions',
    );

    // Alerts state
    const [alerts, setAlerts] = useState<ThreatAlert[]>(initialAlerts);
    const [selectedCategory, setSelectedCategory] = useState<string>(
        filters.category || 'all',
    );
    const [searchQuery, setSearchQuery] = useState<string>(
        filters.search || '',
    );
    const [sortBy, setSortBy] = useState<string>(filters.sort || 'trending');
    const [upvotedIds, setUpvotedIds] = useState<number[]>([]);
    const [notification, setNotification] = useState<string | null>(null);

    // Discussion rooms state
    const [rooms, setRooms] = useState<CommunityRoomItem[]>(initialRooms);
    const [activeRoomId, setActiveRoomId] = useState<number | null>(
        initialRooms[0]?.id ?? null,
    );
    const [roomSearch, setRoomSearch] = useState('');
    const [dailyQuota, setDailyQuota] = useState<DailyRoomQuota>(initialQuota);

    // Laravel Reverb WebSocket state
    const [reverbConnected, setReverbConnected] = useState(false);

    // Add Category Modal State (Admin only)
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryForm, setNewCategoryForm] = useState({
        label: '',
        key: '',
        variant: 'brand' as 'danger' | 'warn' | 'brand' | 'neutral',
    });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);

    // Update Room Category State (Admin only)
    const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

    // Create Room Modal State
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
    const [newRoomForm, setNewRoomForm] = useState({
        title: '',
        category: 'apk_malware',
        description: '',
    });
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [roomError, setRoomError] = useState<string | null>(null);

    // Verify Discussion Room as Radar Pattern Modal State (Admin only)
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifyModalRoom, setVerifyModalRoom] =
        useState<CommunityRoomItem | null>(null);
    const [verifyForm, setVerifyForm] = useState({
        title: '',
        category: 'fake_job',
        platform: 'WhatsApp',
        location: '',
        description: '',
        evidence_text: '',
    });
    const [isVerifyingRoom, setIsVerifyingRoom] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [deletingPatternId, setDeletingPatternId] = useState<number | null>(null);
    const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
    const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
        type: 'room' | 'message';
        id: number;
        title: string;
        roomId?: number;
    } | null>(null);


    // Message Composer State (Markdown + Image)
    const [messageBody, setMessageBody] = useState('');
    const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<
        string | null
    >(null);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Reactions & Keyboard Emoji State
    const [openReactionMessageId, setOpenReactionMessageId] = useState<
        number | null
    >(null);
    const [keyboardEmojiInput, setKeyboardEmojiInput] = useState('');
    const [pendingReactionByMsg, setPendingReactionByMsg] = useState<
        Record<number, string | null>
    >({});
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(
        null,
    );

    const activeRoom = useMemo(
        () => rooms.find((r) => r.id === activeRoomId) ?? rooms[0] ?? null,
        [rooms, activeRoomId],
    );

    const filteredRooms = useMemo(() => {
        const list = rooms.filter((r) => {
            if (
                selectedCategory !== 'all' &&
                r.category !== selectedCategory
            ) {
                return false;
            }
            if (roomSearch.trim() !== '') {
                const q = roomSearch.toLowerCase();
                return (
                    r.title.toLowerCase().includes(q) ||
                    r.description.toLowerCase().includes(q) ||
                    r.creator.name.toLowerCase().includes(q)
                );
            }
            return true;
        });

        return [...list].sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) {
                return a.is_pinned ? -1 : 1;
            }

            if (sortBy === 'latest') {
                return b.id - a.id;
            }

            if (b.messages_count !== a.messages_count) {
                return b.messages_count - a.messages_count;
            }

            return b.id - a.id;
        });
    }, [rooms, selectedCategory, roomSearch, sortBy]);

    const mergeMessageIntoRoom = useCallback(
        (roomId: number, incomingMsg: CommunityMessageItem) => {
            setRooms((prevRooms) =>
                prevRooms.map((room) => {
                    if (room.id !== roomId) {
                        return room;
                    }
                    const exists = room.messages.some(
                        (m) => m.id === incomingMsg.id,
                    );
                    const updatedMessages = exists
                        ? room.messages.map((m) =>
                              m.id === incomingMsg.id ? incomingMsg : m,
                          )
                        : [...room.messages, incomingMsg];

                    return {
                        ...room,
                        messages: updatedMessages,
                        messages_count: updatedMessages.length,
                        updated_at_human: 'Baru saja',
                    };
                }),
            );
        },
        [],
    );

    const mergeReactionsIntoMessage = useCallback(
        (
            roomId: number,
            messageId: number,
            reactions: MessageReaction[],
        ) => {
            setRooms((prevRooms) =>
                prevRooms.map((room) => {
                    if (room.id !== roomId) {
                        return room;
                    }
                    return {
                        ...room,
                        messages: room.messages.map((msg) =>
                            msg.id === messageId ? { ...msg, reactions } : msg,
                        ),
                    };
                }),
            );
        },
        [],
    );

    // Laravel Reverb WebSocket Connection (Pusher Protocol v7)
    useEffect(() => {
        const appKey =
            realtimeConfig?.app_key ||
            import.meta.env.VITE_REVERB_APP_KEY ||
            'cekara-reverb-key';
        const host =
            realtimeConfig?.host ||
            import.meta.env.VITE_REVERB_HOST ||
            window.location.hostname;
        const port =
            realtimeConfig?.port ||
            Number(import.meta.env.VITE_REVERB_PORT || 8080);
        const scheme =
            realtimeConfig?.scheme ||
            import.meta.env.VITE_REVERB_SCHEME ||
            (window.location.protocol === 'https:' ? 'wss' : 'ws');
        const wsProtocol =
            scheme === 'https' || scheme === 'wss' ? 'wss' : 'ws';

        let socket: WebSocket | null = null;
        let reconnectTimer: number | null = null;
        let isUnmounted = false;

        const connectReverb = () => {
            if (isUnmounted) {
                return;
            }
            try {
                const wsUrl = `${wsProtocol}://${host}:${port}/app/${appKey}?protocol=7&client=js&version=8.4.0&flash=false`;
                socket = new WebSocket(wsUrl);

                socket.onopen = () => {
                    if (isUnmounted) {
                        return;
                    }
                    setReverbConnected(true);
                    socket?.send(
                        JSON.stringify({
                            event: 'pusher:subscribe',
                            data: { channel: 'community.radar' },
                        }),
                    );
                };

                socket.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data);
                        const eventName: string = payload.event || '';

                        if (eventName === 'pusher:ping') {
                            socket?.send(
                                JSON.stringify({
                                    event: 'pusher:pong',
                                    data: {},
                                }),
                            );
                            return;
                        }

                        const parsedData =
                            typeof payload.data === 'string'
                                ? JSON.parse(payload.data)
                                : payload.data;

                        if (
                            eventName.endsWith('room.created') &&
                            parsedData?.room
                        ) {
                            const createdRoom: CommunityRoomItem =
                                parsedData.room;
                            setRooms((prev) =>
                                prev.some((r) => r.id === createdRoom.id)
                                    ? prev
                                    : [createdRoom, ...prev],
                            );
                        } else if (
                            eventName.endsWith('message.sent') &&
                            parsedData?.message
                        ) {
                            mergeMessageIntoRoom(
                                Number(parsedData.room_id),
                                parsedData.message,
                            );
                        } else if (
                            eventName.endsWith('alert.upvoted') &&
                            parsedData?.alert_id
                        ) {
                            setAlerts((prev) =>
                                prev.map((a) =>
                                    a.id === Number(parsedData.alert_id)
                                        ? {
                                              ...a,
                                              upvotes_count: Number(
                                                  parsedData.upvotes_count,
                                              ),
                                          }
                                        : a,
                                ),
                            );
                        } else if (
                            eventName.endsWith('room.deleted') &&
                            parsedData?.room_id
                        ) {
                            const deletedRoomId = Number(parsedData.room_id);
                            setRooms((prev) =>
                                prev.filter((r) => r.id !== deletedRoomId),
                            );
                            setActiveRoomId((prev) =>
                                prev === deletedRoomId ? null : prev,
                            );
                        } else if (
                            eventName.endsWith('message.deleted') &&
                            parsedData?.message_id
                        ) {
                            const targetRoomId = Number(parsedData.room_id);
                            const targetMsgId = Number(parsedData.message_id);
                            setRooms((prev) =>
                                prev.map((r) => {
                                    if (r.id !== targetRoomId) {
                                        return r;
                                    }
                                    const updated = r.messages.filter(
                                        (m) => m.id !== targetMsgId,
                                    );
                                    return {
                                        ...r,
                                        messages: updated,
                                        messages_count: Math.max(
                                            0,
                                            r.messages_count - 1,
                                        ),
                                    };
                                }),
                            );
                        } else if (
                            eventName.endsWith('moderation.notice.created') &&
                            parsedData?.notice
                        ) {
                            const incomingNotice: ModerationNoticeItem =
                                parsedData.notice;
                            if (
                                currentUser &&
                                incomingNotice.user_id === currentUser.id
                            ) {
                                setModerationNotices((prev) => [
                                    incomingNotice,
                                    ...prev.filter(
                                        (n) => n.id !== incomingNotice.id,
                                    ),
                                ]);
                                toast.warning(
                                    `Notifikasi Moderasi: ${
                                        incomingNotice.type === 'room_deleted'
                                            ? 'Ruang diskusi'
                                            : 'Pesan'
                                    } Anda dihapus oleh admin. Alasan: "${incomingNotice.reason}"`,
                                );
                            }
                        }
                    } catch {
                        // Ignore non-JSON frames
                    }
                };

                socket.onerror = () => {
                    setReverbConnected(false);
                };

                socket.onclose = () => {
                    setReverbConnected(false);
                    if (!isUnmounted) {
                        reconnectTimer = window.setTimeout(connectReverb, 4000);
                    }
                };
            } catch {
                setReverbConnected(false);
            }
        };

        connectReverb();

        return () => {
            isUnmounted = true;
            if (reconnectTimer) {
                window.clearTimeout(reconnectTimer);
            }
            if (socket && socket.readyState <= 1) {
                socket.close();
            }
        };
    }, [realtimeConfig, mergeMessageIntoRoom, mergeReactionsIntoMessage]);

    // Background delta sync for reactions and rooms
    useEffect(() => {
        const interval = window.setInterval(async () => {
            if (document.hidden) {
                return;
            }
            try {
                const url = activeRoom?.id
                    ? `/radar/sync?room_id=${activeRoom.id}`
                    : '/radar/sync';
                const res = await fetch(url, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) {
                    return;
                }
                const data = await res.json();
                if (Array.isArray(data.rooms)) {
                    setRooms((prevRooms) =>
                        data.rooms.map((incomingRoom: CommunityRoomItem) => {
                            const existingRoom = prevRooms.find(
                                (r) => r.id === incomingRoom.id,
                            );
                            if (
                                incomingRoom.messages &&
                                incomingRoom.messages.length > 0
                            ) {
                                return incomingRoom;
                            }
                            return {
                                ...incomingRoom,
                                messages: existingRoom?.messages ?? [],
                            };
                        }),
                    );
                }
                if (Array.isArray(data.categories) && data.categories.length > 0) {
                    setCategoryList([
                        { key: 'all', label: 'Semua Kategori' },
                        ...data.categories,
                    ]);
                }
                if (data.daily_room_quota) {
                    setDailyQuota(data.daily_room_quota);
                }
            } catch {
                // Silent background sync
            }
        }, 3500);

        return () => window.clearInterval(interval);
    }, [activeRoom?.id, reverbConnected]);

    const handleSelectRoom = async (room: CommunityRoomItem) => {
        setActiveRoomId(room.id);
        setMessageError(null);
        try {
            const res = await fetch(`/radar/rooms/${room.id}/messages`, {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.room) {
                    setRooms((prev) =>
                        prev.map((r) => (r.id === room.id ? data.room : r)),
                    );
                }
            }
        } catch {
            // Keep existing messages
        }
    };

    const insertMarkdownSyntax = (
        prefix: string,
        suffix: string = '',
        placeholder: string = 'teks',
    ) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setMessageBody((prev) => `${prev}${prefix}${placeholder}${suffix}`);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = messageBody.slice(start, end) || placeholder;
        const nextText =
            messageBody.slice(0, start) +
            prefix +
            selected +
            suffix +
            messageBody.slice(end);

        setMessageBody(nextText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + prefix.length,
                start + prefix.length + selected.length,
            );
        }, 10);
    };

    const handleImageFile = (file: File | null) => {
        if (!file) {
            setSelectedImage(null);
            setSelectedImagePreview(null);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessageError('Ukuran gambar maksimal 5 MB.');
            return;
        }
        setMessageError(null);
        setSelectedImage(file);
        setSelectedImagePreview(URL.createObjectURL(file));
    };

    const handlePasteImage = (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) {
            return;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    handleImageFile(file);
                    break;
                }
            }
        }
    };

    const handleCreateRoom = async (e: FormEvent) => {
        e.preventDefault();
        setRoomError(null);
        setIsCreatingRoom(true);

        try {
            const res = await fetch('/radar/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify(newRoomForm),
            });

            const data = await res.json();

            if (!res.ok) {
                setRoomError(
                    data.message ||
                        data.errors?.quota?.[0] ||
                        'Gagal membuat ruang diskusi.',
                );
                if (data.daily_room_quota) {
                    setDailyQuota(data.daily_room_quota);
                }
                return;
            }

            if (data.room) {
                setRooms((prev) => [
                    data.room,
                    ...prev.filter((r) => r.id !== data.room.id),
                ]);
                setActiveRoomId(data.room.id);
            }
            if (data.daily_room_quota) {
                setDailyQuota(data.daily_room_quota);
            }

            setNotification(data.message);
            setTimeout(() => setNotification(null), 5000);
            setNewRoomForm({
                title: '',
                category: 'apk_malware',
                description: '',
            });
            setIsCreateRoomOpen(false);
        } catch {
            setRoomError('Terjadi kesalahan jaringan saat membuat ruang diskusi.');
        } finally {
            setIsCreatingRoom(false);
        }
    };

    const handleAddCategory = async (e: FormEvent) => {
        e.preventDefault();
        setCategoryError(null);
        setIsAddingCategory(true);

        try {
            const res = await fetch('/radar/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    label: newCategoryForm.label.trim(),
                    key: newCategoryForm.key.trim() || undefined,
                    variant: newCategoryForm.variant,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setCategoryError(
                    data.message ||
                        data.errors?.label?.[0] ||
                        data.errors?.key?.[0] ||
                        'Gagal menambahkan kategori baru.',
                );
                return;
            }

            if (Array.isArray(data.categories)) {
                setCategoryList([
                    { key: 'all', label: 'Semua Kategori' },
                    ...data.categories,
                ]);
            } else if (data.category) {
                setCategoryList((prev) => [...prev, data.category]);
            }

            toast.success(data.message || 'Kategori baru berhasil ditambahkan.');
            setIsAddCategoryOpen(false);
            setNewCategoryForm({
                label: '',
                key: '',
                variant: 'brand',
            });
        } catch {
            setCategoryError(
                'Terjadi kesalahan jaringan saat menambahkan kategori.',
            );
        } finally {
            setIsAddingCategory(false);
        }
    };

    const handleOpenVerifyModal = (room: CommunityRoomItem) => {
        setVerifyModalRoom(room);
        setVerifyError(null);

        // Pre-fill from the room and its messages
        const sampleEvidence =
            room.messages.find(
                (m) =>
                    m.body &&
                    m.body.length > 15 &&
                    !m.body.startsWith('**Topik Diskusi'),
            )?.body?.slice(0, 500) || '';

        setVerifyForm({
            title: room.title,
            category: room.category,
            platform: 'WhatsApp / Online',
            location: '',
            description: room.description,
            evidence_text: sampleEvidence,
        });
        setIsVerifyModalOpen(true);
    };

    const handleVerifyRoomAsPattern = async (e: FormEvent) => {
        e.preventDefault();
        if (!verifyModalRoom) {
            return;
        }

        setVerifyError(null);

        if (!verifyForm.title.trim() || !verifyForm.description.trim()) {
            setVerifyError('Judul dan ringkasan modus penipuan wajib diisi.');
            return;
        }

        setIsVerifyingRoom(true);

        try {
            const res = await fetch(
                `/radar/rooms/${verifyModalRoom.id}/verify-as-pattern`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getXsrfToken(),
                    },
                    body: JSON.stringify({
                        title: verifyForm.title.trim(),
                        category: verifyForm.category,
                        platform:
                            verifyForm.platform.trim() || 'WhatsApp / Online',
                        location: verifyForm.location.trim() || null,
                        description: verifyForm.description.trim(),
                        evidence_text: verifyForm.evidence_text.trim() || null,
                    }),
                },
            );

            const data = await res.json();

            if (!res.ok) {
                setVerifyError(
                    data.message ||
                        data.errors?.title?.[0] ||
                        data.errors?.description?.[0] ||
                        'Gagal memverifikasi diskusi menjadi modus radar.',
                );
                return;
            }

            if (data.alert) {
                setAlerts((prev) => [
                    data.alert,
                    ...prev.filter((a) => a.id !== data.alert.id),
                ]);
            }

            if (data.room) {
                setRooms((prev) =>
                    prev.map((r) => (r.id === data.room.id ? data.room : r)),
                );
            }

            toast.success(
                data.message ||
                    'Ruang diskusi berhasil diverifikasi ke Daftar Modus Terverifikasi!',
            );
            setIsVerifyModalOpen(false);
            setVerifyModalRoom(null);
        } catch {
            setVerifyError(
                'Terjadi kesalahan jaringan saat memverifikasi diskusi.',
            );
        } finally {
            setIsVerifyingRoom(false);
        }
    };

    const handleDeletePattern = async (patternId: number) => {
        if (
            !confirm(
                'Apakah Anda yakin ingin menghapus modus penipuan ini dari radar?',
            )
        ) {
            return;
        }

        setDeletingPatternId(patternId);

        try {
            const res = await fetch(`/radar/${patternId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Gagal menghapus modus penipuan.');
                return;
            }

            setAlerts((prev) => prev.filter((a) => a.id !== patternId));
            toast.success(data.message || 'Modus penipuan berhasil dihapus.');
        } catch {
            toast.error('Gagal menghapus modus penipuan.');
        } finally {
            setDeletingPatternId(null);
        }
    };

    const handleDeleteRoom = async (roomId: number) => {
        if (currentUser?.is_admin && deleteReason.trim().length < 5) {
            setDeleteReasonError(
                'Admin wajib menyertakan alasan penghapusan minimal 5 karakter.',
            );
            return;
        }

        setDeletingRoomId(roomId);
        try {
            const res = await fetch(`/radar/rooms/${roomId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    reason: deleteReason.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Gagal menghapus ruang diskusi.');
                return;
            }

            setRooms((prev) => prev.filter((r) => r.id !== roomId));
            setActiveRoomId((prev) => (prev === roomId ? null : prev));
            setConfirmDeleteModal(null);
            setDeleteReason('');
            setDeleteReasonError(null);
            toast.success(data.message || 'Ruang diskusi berhasil dihapus.');
        } catch {
            toast.error('Gagal menghapus ruang diskusi.');
        } finally {
            setDeletingRoomId(null);
        }
    };

    const handleDeleteMessage = async (messageId: number, roomId: number) => {
        if (currentUser?.is_admin && deleteReason.trim().length < 5) {
            setDeleteReasonError(
                'Admin wajib menyertakan alasan penghapusan minimal 5 karakter.',
            );
            return;
        }

        setDeletingMessageId(messageId);
        try {
            const res = await fetch(`/radar/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    reason: deleteReason.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Gagal menghapus pesan.');
                return;
            }

            setRooms((prev) =>
                prev.map((r) => {
                    if (r.id !== roomId) {
                        return r;
                    }
                    const updated = r.messages.filter(
                        (m) => m.id !== messageId,
                    );
                    return {
                        ...r,
                        messages: updated,
                        messages_count: Math.max(0, r.messages_count - 1),
                    };
                }),
            );
            setConfirmDeleteModal(null);
            setDeleteReason('');
            setDeleteReasonError(null);
            toast.success(data.message || 'Pesan berhasil dihapus.');
        } catch {
            toast.error('Gagal menghapus pesan.');
        } finally {
            setDeletingMessageId(null);
        }
    };

    const handleMarkNoticeAsRead = async (noticeId: number) => {
        setMarkingReadNoticeId(noticeId);
        try {
            const res = await fetch(`/radar/notices/${noticeId}/read`, {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
            });
            if (res.ok) {
                setModerationNotices((prev) =>
                    prev.map((n) =>
                        n.id === noticeId ? { ...n, is_read: true } : n,
                    ),
                );
            }
        } catch {
            // ignore
        } finally {
            setMarkingReadNoticeId(null);
        }
    };

    const handleMarkAllNoticesAsRead = async () => {
        if (unreadNoticesCount === 0 || isMarkingAllRead) {
            return;
        }
        setIsMarkingAllRead(true);
        try {
            const res = await fetch('/radar/notices/mark-all-read', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
            });
            if (res.ok) {
                setModerationNotices((prev) =>
                    prev.map((n) => ({ ...n, is_read: true })),
                );
                toast.success('Semua notifikasi telah ditandai sudah dibaca.');
            }
        } catch {
            toast.error('Gagal memperbarui status notifikasi.');
        } finally {
            setIsMarkingAllRead(false);
        }
    };

    const handleDeleteNotice = async (noticeId: number) => {
        try {
            const res = await fetch(`/radar/notices/${noticeId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
            });
            if (res.ok) {
                setModerationNotices((prev) =>
                    prev.filter((n) => n.id !== noticeId),
                );
                toast.success('Notifikasi berhasil dihapus.');
            }
        } catch {
            toast.error('Gagal menghapus notifikasi.');
        }
    };

    const handleUpdateRoomCategory = async (
        roomId: number,
        newCategory: string,
    ) => {
        if (!currentUser?.is_admin || isUpdatingCategory) {
            return;
        }

        setIsUpdatingCategory(true);
        try {
            const res = await fetch(`/radar/rooms/${roomId}/category`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ category: newCategory }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Gagal mengubah kategori topik.');
                return;
            }

            setRooms((prev) =>
                prev.map((r) =>
                    r.id === roomId ? { ...r, category: newCategory } : r,
                ),
            );
            toast.success('Kategori ruang diskusi berhasil diperbarui.');
        } catch {
            toast.error('Terjadi kesalahan jaringan.');
        } finally {
            setIsUpdatingCategory(false);
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!activeRoom || isSendingMessage || currentUser?.is_admin) {
            return;
        }
        if (!messageBody.trim() && !selectedImage) {
            setMessageError(
                'Silakan tulis pesan (mendukung Markdown) atau lampirkan gambar.',
            );
            return;
        }

        setIsSendingMessage(true);
        setMessageError(null);

        try {
            const formData = new FormData();
            if (messageBody.trim()) {
                formData.append('body', messageBody.trim());
            }
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const res = await fetch(
                `/radar/rooms/${activeRoom.id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getXsrfToken(),
                    },
                    body: formData,
                },
            );

            const data = await res.json();

            if (!res.ok) {
                setMessageError(
                    data.message || 'Gagal mengirim pesan ke ruang diskusi.',
                );
                return;
            }

            if (data.message) {
                mergeMessageIntoRoom(activeRoom.id, data.message);
            }

            setMessageBody('');
            setIsMarkdownPreview(false);
            handleImageFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        } catch {
            setMessageError('Gagal mengirim pesan. Periksa koneksi Anda.');
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleToggleReaction = async (messageId: number, emoji: string) => {
        if (
            !currentUser ||
            currentUser?.is_admin ||
            !activeRoom ||
            pendingReactionByMsg[messageId]
        ) {
            return;
        }

        const cleanEmoji = emoji.trim();
        if (!cleanEmoji) {
            return;
        }

        const targetRoomId = activeRoom.id;
        setPendingReactionByMsg((prev) => ({
            ...prev,
            [messageId]: cleanEmoji,
        }));

        try {
            const [res] = await Promise.all([
                fetch(`/radar/messages/${messageId}/reactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getXsrfToken(),
                    },
                    body: JSON.stringify({ emoji: cleanEmoji }),
                }),
                new Promise((resolve) => window.setTimeout(resolve, 1000)),
            ]);

            if (res.ok) {
                const data = await res.json();
                if (data.reactions) {
                    mergeReactionsIntoMessage(
                        Number(data.room_id || targetRoomId),
                        messageId,
                        data.reactions,
                    );
                }
            }
        } catch {
            // Ignore network error
        } finally {
            setPendingReactionByMsg((prev) => ({
                ...prev,
                [messageId]: null,
            }));
        }
    };

    const handleUpvote = async (alertId: number) => {
        if (currentUser?.is_admin || upvotedIds.includes(alertId)) {
            return;
        }

        try {
            const res = await fetch(`/komunitas/${alertId}/upvote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getXsrfToken(),
                },
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setUpvotedIds((prev) => [...prev, alertId]);
                setAlerts((prev) =>
                    prev.map((a) =>
                        a.id === alertId
                            ? { ...a, upvotes_count: data.new_count }
                            : a,
                    ),
                );
                toast.success(data.message || 'Berhasil memberikan konfirmasi pada laporan ini.');
            } else {
                toast.error(data.message || 'Gagal menambahkan konfirmasi.');
            }
        } catch {
            toast.error('Gagal menambahkan konfirmasi. Periksa koneksi internet Anda.');
        }
    };

    const filteredAlerts = alerts
        .filter((item) => {
            if (
                selectedCategory !== 'all' &&
                item.category !== selectedCategory
            ) {
                return false;
            }
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(q);
                const matchDesc = item.description.toLowerCase().includes(q);
                const matchLoc =
                    item.location?.toLowerCase().includes(q) ?? false;
                if (!matchTitle && !matchDesc && !matchLoc) {
                    return false;
                }
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'latest') {
                return b.id - a.id;
            }
            return b.upvotes_count - a.upvotes_count;
        });

    if (isInitialLoading) {
        return (
            <AppLayout>
                <Head title="Radar Kejahatan Siber - Cekara" />
                <RadarSkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Radar Ancaman & Diskusi Komunitas - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#FFF8EC] pt-8 pb-4 sm:pt-12 sm:pb-6">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="font-['Fredoka',system-ui,sans-serif] text-3xl leading-tight font-bold tracking-tight text-[#3B2A1E] sm:text-4xl md:text-[40px]">
                                Komunitas Pemberantas Kejahatan
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6B5646] sm:text-base">
                                Pantau modus kejahatan siber terkini dan berdiskusi
                                secara real-time bersama sesama Guardian. Kirim pesan{' '}
                                <strong className="text-[#3B2A1E]">Markdown</strong>,
                                unggah gambar bukti, dan beri reaksi emoji dari
                                keyboard Anda.
                            </p>
                        </div>

                        {/* Dynamic CTA depending on Active Tab */}
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                            {activeTab === 'radar' ? (
                                !currentUser?.is_admin && (
                                    <Button
                                        variant="outline"
                                        size="md"
                                        onClick={() => setActiveTab('discussions')}
                                    >
                                        <MessageSquare className="size-4" />
                                        <span>Buka Obrolan Komunitas</span>
                                    </Button>
                                )
                            ) : currentUser ? (
                                currentUser.is_admin ? (
                                    <Button
                                        variant="primary"
                                        size="md"
                                        onClick={() => {
                                            setCategoryError(null);
                                            setIsAddCategoryOpen(true);
                                        }}
                                    >
                                        <Plus className="size-4" />
                                        <span>Tambah Kategori</span>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="primary"
                                            size="md"
                                            onClick={() => {
                                                setRoomError(null);
                                                setIsCreateRoomOpen(true);
                                            }}
                                            disabled={dailyQuota.remaining <= 0}
                                        >
                                            <MessageSquarePlus className="size-4" />
                                            <span>
                                                {dailyQuota.remaining > 0
                                                    ? 'Buat Ruang Diskusi'
                                                    : 'Kuota Harian Penuh (3/3)'}
                                            </span>
                                        </Button>
                                        <span className="text-xs font-bold text-[#6B5646]">
                                            Kuota Hari Ini:{' '}
                                            <strong className="text-[#3B2A1E]">
                                                {dailyQuota.remaining}/{dailyQuota.max}{' '}
                                                ruang tersisa
                                            </strong>
                                        </span>
                                    </>
                                )
                            ) : null}
                        </div>
                    </div>

                    {/* Section Switcher Tabs */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#EFE3D0] pb-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('discussions')}
                                className={`cursor-pointer inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                                    activeTab === 'discussions'
                                        ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                        : 'border-2 border-transparent bg-white/70 text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                }`}
                            >
                                <MessageSquare className="size-4" />
                                <span>Ruang Diskusi Real-Time</span>
                                <span className="rounded-lg border border-[#3B2A1E] bg-[#FFF8EC] px-1.5 py-0.5 text-[11px] font-extrabold text-[#3B2A1E]">
                                    {rooms.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('radar')}
                                className={`cursor-pointer inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                                    activeTab === 'radar'
                                        ? 'border-2 border-[#3B2A1E] bg-[#FF9A3C] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                        : 'border-2 border-transparent bg-white/70 text-[#6B5646] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E]'
                                }`}
                            >
                                <Radio className="size-4" />
                                <span>Daftar Modus Terverifikasi</span>
                                <span className="rounded-lg border border-[#3B2A1E] bg-[#FFF8EC] px-1.5 py-0.5 text-[11px] font-extrabold text-[#3B2A1E]">
                                    {alerts.length}
                                </span>
                            </button>

                            {currentUser && (
                                <button
                                    type="button"
                                    onClick={() => setIsNoticeSandboxOpen(true)}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition-all"
                                    title="Kotak Pesan Notifikasi & Moderasi Komunitas"
                                >
                                    <Bell className="size-4 text-[#D4573A]" />
                                    <span>Pesan Notif</span>
                                    {unreadNoticesCount > 0 ? (
                                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#D4573A] text-[10px] font-black text-white shadow-sm animate-pulse">
                                            {unreadNoticesCount}
                                        </span>
                                    ) : (
                                        <span className="rounded-lg border border-[#3B2A1E]/30 bg-[#FFF8EC] px-1.5 py-0.5 text-[11px] font-bold text-[#6B5646]">
                                            {moderationNotices.length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B5646]">
                                Urutkan:
                            </span>
                            <div className="flex rounded-xl border-2 border-[#EFE3D0] bg-white p-1">
                                <button
                                    type="button"
                                    onClick={() => setSortBy('trending')}
                                    className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                        sortBy === 'trending'
                                            ? 'border border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E]'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    Paling Marak
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSortBy('latest')}
                                    className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                        sortBy === 'latest'
                                            ? 'border border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E]'
                                            : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    Terbaru
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {categoryList.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    onClick={() => setSelectedCategory(c.key)}
                                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        selectedCategory === c.key
                                            ? 'border-2 border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                                            : 'border-2 border-transparent text-[#6B5646] hover:bg-[#FFE27A]/40 hover:text-[#3B2A1E]'
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Notification Toast */}
            {notification && (
                <div className="mx-auto max-w-5xl px-6 pt-4">
                    <div className="flex items-center justify-between gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFE27A] p-4 text-xs sm:text-sm font-bold text-[#3B2A1E] shadow-[3px_3px_0px_0px_#3B2A1E]">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="size-4.5 shrink-0 text-[#3B2A1E]" />
                            <span>{notification}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setNotification(null)}
                            className="cursor-pointer rounded-lg p-1 hover:bg-white/50"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 1: REAL-TIME COMMUNITY DISCUSSION ROOMS */}
            {activeTab === 'discussions' && (
                <section className="mx-auto max-w-5xl px-6 py-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Sidebar: Discussion Rooms List & Quota */}
                        <div className="space-y-4 lg:col-span-4">
                            {/* Daily Quota Info Card (hidden for admin) */}
                            {!currentUser?.is_admin && (
                                <Card variant="glass" className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#3B2A1E]">
                                            Kuota Ruang Harian
                                        </span>
                                        <Badge variant="warn">
                                            Maks {dailyQuota.max}/Hari
                                        </Badge>
                                    </div>

                                    {currentUser ? (
                                        <>
                                            <div className="mt-3 flex gap-2">
                                                {Array.from({
                                                    length: dailyQuota.max,
                                                }).map((_, idx) => {
                                                    const isUsed =
                                                        idx < dailyQuota.used;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`h-2.5 flex-1 rounded-full border border-[#3B2A1E] ${
                                                                isUsed
                                                                    ? 'bg-[#3B2A1E]'
                                                                    : 'bg-[#8ECDF0]'
                                                            }`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <p className="mt-2 text-xs font-semibold text-[#6B5646]">
                                                Anda telah membuat{' '}
                                                <strong className="text-[#3B2A1E]">
                                                    {dailyQuota.used} dari{' '}
                                                    {dailyQuota.max}
                                                </strong>{' '}
                                                ruang diskusi hari ini.
                                            </p>
                                        </>
                                    ) : (
                                        <p className="mt-2 text-xs font-semibold text-[#6B5646]">
                                            Pengguna terdaftar dapat membuat maksimal{' '}
                                            <strong className="text-[#3B2A1E]">
                                                3 ruang diskusi per hari
                                            </strong>
                                            .
                                        </p>
                                    )}
                                </Card>
                            )}

                            {/* Search Rooms Input */}
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                    <Search className="size-4 text-[#6B5646]" />
                                </div>
                                <input
                                    type="text"
                                    value={roomSearch}
                                    onChange={(e) =>
                                        setRoomSearch(e.target.value)
                                    }
                                    placeholder="Cari ruang diskusi..."
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white pl-10 pr-9 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] transition-all focus:border-[#FF9A3C] focus:bg-[#FFFDF9] focus:outline-none"
                                />
                                {roomSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setRoomSearch('')}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6B5646]/70 hover:text-[#3B2A1E] cursor-pointer"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>

                            {/* Rooms List */}
                            <div className="space-y-3">
                                {filteredRooms.map((room) => {
                                    const isSelected =
                                        activeRoom?.id === room.id;
                                    const catMeta = categoryBadgeMap[
                                        room.category
                                    ] ?? {
                                        label: room.category,
                                        variant: 'neutral' as const,
                                    };

                                    return (
                                        <button
                                            key={room.id}
                                            type="button"
                                            onClick={() =>
                                                handleSelectRoom(room)
                                            }
                                            className={`w-full cursor-pointer rounded-[20px] border-2 border-[#3B2A1E] p-4 text-left transition-all ${
                                                isSelected
                                                    ? 'bg-[#FFE27A] shadow-[4px_4px_0px_0px_#3B2A1E] -translate-y-0.5'
                                                    : 'bg-white shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFF8EC]'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                <Badge
                                                    variant={catMeta.variant}
                                                    className="px-2.5 py-0.5 text-[11px]"
                                                >
                                                    {catMeta.label}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    {room.is_verified_radar && (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-[#3B2A1E] bg-[#FFE27A] px-2 py-0.5 text-[10px] font-extrabold text-[#3B2A1E]">
                                                            <CheckCircle2 className="size-3 text-[#3B2A1E]" />
                                                            Modus Radar
                                                        </span>
                                                    )}
                                                    {room.is_pinned && (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-[#3B2A1E] bg-[#FFF8EC] px-2 py-0.5 text-[10px] font-extrabold text-[#3B2A1E]">
                                                            <Pin className="size-3 text-[#E06812]" />
                                                            Penting
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="mt-2 font-['Fredoka',system-ui,sans-serif] text-base font-bold leading-snug text-[#3B2A1E] line-clamp-2">
                                                {room.title}
                                            </h3>

                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed font-medium text-[#6B5646]">
                                                {room.description}
                                            </p>

                                            <div className="mt-3 flex items-center justify-between border-t border-[#EFE3D0] pt-2.5 text-[11px] font-bold text-[#6B5646]">
                                                <span className="inline-flex items-center gap-1.5 truncate">
                                                    {room.creator.avatar ? (
                                                        <img
                                                            src={room.creator.avatar}
                                                            alt={room.creator.name}
                                                            className="size-4 shrink-0 rounded-full border border-[#3B2A1E] object-cover"
                                                        />
                                                    ) : (
                                                        <Users className="size-3.5 text-[#3B2A1E]" />
                                                    )}
                                                    <span className="truncate">{room.creator.name}</span>
                                                </span>
                                                <span className="inline-flex shrink-0 items-center gap-1 text-[#3B2A1E]">
                                                    <MessageCircle className="size-3.5" />
                                                    {room.messages_count} pesan
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}

                                {filteredRooms.length === 0 && (
                                    <Card
                                        variant="glass"
                                        className="flex flex-col items-center justify-center px-4 py-8 text-center"
                                    >
                                        <img
                                            src="/empty_state.png"
                                            alt="Tidak ada ruang diskusi"
                                            className="mb-2.5 w-20 sm:w-24 h-auto object-contain select-none opacity-90"
                                        />
                                        <h4 className="font-['Fredoka',system-ui,sans-serif] text-sm font-bold text-[#3B2A1E]">
                                            Tidak Ada Ruang Diskusi
                                        </h4>
                                        <p className="mt-1 text-xs leading-relaxed text-[#6B5646]">
                                            Tidak ada ruang diskusi yang cocok dengan kategori atau kata kunci ini.
                                        </p>
                                    </Card>
                                )}
                            </div>
                        </div>

                        {/* Active Discussion Room Stream & Composer */}
                        <div className="lg:col-span-8">
                            {activeRoom ? (
                                <Card
                                    variant="default"
                                    className="flex flex-col overflow-hidden p-0"
                                >
                                    {/* Room Header */}
                                    <div className="border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                                        {/* Top Bar: Category Pill & Actions */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {currentUser?.is_admin ? (
                                                    <div className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3B2A1E] bg-white px-2.5 py-1 shadow-[1.5px_1.5px_0px_0px_#3B2A1E]">
                                                        <span className="text-[11px] font-bold text-[#6B5646]">
                                                            Kategori:
                                                        </span>
                                                        <select
                                                            value={activeRoom.category}
                                                            onChange={(e) =>
                                                                handleUpdateRoomCategory(
                                                                    activeRoom.id,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            disabled={isUpdatingCategory}
                                                            className="cursor-pointer bg-transparent text-xs font-bold text-[#3B2A1E] focus:outline-none"
                                                        >
                                                            {categoryList
                                                                .filter(
                                                                    (c) =>
                                                                        c.key !==
                                                                        'all',
                                                                )
                                                                .map((cat) => (
                                                                    <option
                                                                        key={
                                                                            cat.key
                                                                        }
                                                                        value={
                                                                            cat.key
                                                                        }
                                                                    >
                                                                        {cat.label}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                        {isUpdatingCategory && (
                                                            <Loader2 className="size-3 animate-spin text-[#3B2A1E]" />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge
                                                        variant={
                                                            categoryBadgeMap[
                                                                activeRoom.category
                                                            ]?.variant ?? 'warn'
                                                        }
                                                    >
                                                        {categoryBadgeMap[
                                                            activeRoom.category
                                                        ]?.label ??
                                                            activeRoom.category}
                                                    </Badge>
                                                )}

                                                {activeRoom.is_verified_radar && (
                                                    <span className="inline-flex items-center gap-1 rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] px-2.5 py-1 text-[11px] font-black text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]">
                                                        <CheckCircle2 className="size-3 text-[#3B2A1E]" />
                                                        Terverifikasi di Radar
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {(currentUser?.is_admin ||
                                                (currentUser &&
                                                    currentUser.id ===
                                                        activeRoom.creator.id)) && (
                                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                    {currentUser?.is_admin &&
                                                        !activeRoom.is_verified_radar && (
                                                            <Button
                                                                type="button"
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleOpenVerifyModal(
                                                                        activeRoom,
                                                                    )
                                                                }
                                                                className="cursor-pointer whitespace-nowrap text-xs"
                                                            >
                                                                <Radio className="size-3.5" />
                                                                <span>
                                                                    Jadikan Modus Terverifikasi
                                                                </span>
                                                            </Button>
                                                        )}

                                                    {currentUser &&
                                                        (currentUser.is_admin ||
                                                            currentUser.id ===
                                                                activeRoom.creator.id) && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setConfirmDeleteModal({
                                                                        type: 'room',
                                                                        id: activeRoom.id,
                                                                        title: activeRoom.title,
                                                                    })
                                                                }
                                                                disabled={
                                                                    deletingRoomId ===
                                                                    activeRoom.id
                                                                }
                                                                className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-xl border-2 border-[#D4573A] bg-[#FFF8EC] px-3 text-xs font-bold text-[#D4573A] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] transition-all hover:bg-[#D4573A] hover:text-white disabled:opacity-50 whitespace-nowrap"
                                                                title="Hapus ruang diskusi ini"
                                                            >
                                                                {deletingRoomId ===
                                                                activeRoom.id ? (
                                                                    <Loader2 className="size-3 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="size-3" />
                                                                )}
                                                                <span>Hapus Ruang</span>
                                                            </button>
                                                        )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Room Title & Description */}
                                        <div className="mt-3">
                                            <h2 className="font-['Fredoka',system-ui,sans-serif] text-xl sm:text-2xl font-bold tracking-tight text-[#3B2A1E]">
                                                {activeRoom.title}
                                            </h2>
                                            {activeRoom.description && (
                                                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#6B5646]">
                                                    {activeRoom.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Meta Footer */}
                                        <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-[#EFE3D0] pt-2.5 text-xs text-[#6B5646]">
                                            <div className="flex items-center gap-1.5">
                                                {activeRoom.creator.avatar ? (
                                                    <img
                                                        src={activeRoom.creator.avatar}
                                                        alt={activeRoom.creator.name}
                                                        className="size-4 shrink-0 rounded-full border border-[#3B2A1E] object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-[#3B2A1E] bg-[#FFE27A] text-[9px] font-bold text-[#3B2A1E]">
                                                        {activeRoom.creator.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span>
                                                    Dibuka oleh{' '}
                                                    <strong className="font-bold text-[#3B2A1E]">
                                                        {activeRoom.creator.name}
                                                    </strong>
                                                </span>
                                            </div>

                                            <span className="text-[#3B2A1E]/30">•</span>

                                            <div className="flex items-center gap-1">
                                                <Clock className="size-3.5 shrink-0 text-[#6B5646]" />
                                                <span>{activeRoom.created_at_human}</span>
                                            </div>

                                            <span className="text-[#3B2A1E]/30">•</span>

                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="size-3.5 shrink-0 text-[#6B5646]" />
                                                <span>{activeRoom.messages_count} pesan</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages Stream */}
                                    <div className="max-h-[520px] min-h-[360px] space-y-4 overflow-y-auto bg-[#FFFDF9] p-5 sm:p-6">
                                        {activeRoom.messages.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                                <img
                                                    src="/empty_state.png"
                                                    alt="Belum ada pesan"
                                                    className="mb-3 w-24 sm:w-28 h-auto object-contain select-none opacity-90"
                                                />
                                                <h4 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                                    Belum Ada Percakapan di Ruang Ini
                                                </h4>
                                                <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#6B5646]">
                                                    Jadilah yang pertama memulai percakapan atau berbagi informasi kewaspadaan siber di ruang diskusi ini!
                                                </p>
                                            </div>
                                        )}
                                        {activeRoom.messages.map((msg) => {
                                            const isOwn =
                                                currentUser?.id === msg.user.id;
                                            const likeReaction =
                                                msg.reactions.find(
                                                    (r) => r.emoji === '👍',
                                                );
                                            const hasLiked = currentUser
                                                ? (likeReaction?.user_ids.includes(
                                                      currentUser.id,
                                                  ) ?? false)
                                                : false;

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`rounded-2xl border-2 border-[#3B2A1E] p-4 shadow-[2px_2px_0px_0px_#3B2A1E] transition-all ${
                                                        isOwn
                                                            ? 'bg-[#FFF8EC]'
                                                            : 'bg-white'
                                                    }`}
                                                >
                                                    {/* Message Author */}
                                                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE3D0] pb-2">
                                                        <div className="flex items-center gap-2">
                                                            {msg.user.avatar ? (
                                                                <img
                                                                    src={msg.user.avatar}
                                                                    alt={msg.user.name}
                                                                    className="size-7 shrink-0 rounded-xl border-2 border-[#3B2A1E] object-cover shadow-[1.5px_1.5px_0px_0px_#3B2A1E]"
                                                                />
                                                            ) : (
                                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] text-xs font-extrabold text-[#3B2A1E]">
                                                                    {msg.user.name
                                                                        .charAt(0)
                                                                        .toUpperCase()}
                                                                </div>
                                                            )}
                                                            <span className="text-xs sm:text-sm font-bold text-[#3B2A1E]">
                                                                {msg.user.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-semibold text-[#6B5646]">
                                                                {
                                                                    msg.created_at_human
                                                                }{' '}
                                                                •{' '}
                                                                {
                                                                    msg.created_at_time
                                                                }
                                                            </span>
                                                            {currentUser &&
                                                                (currentUser.is_admin ||
                                                                    currentUser.id ===
                                                                        msg.user.id) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setConfirmDeleteModal({
                                                                                type: 'message',
                                                                                id: msg.id,
                                                                                title:
                                                                                    msg.body
                                                                                        ? msg.body.length >
                                                                                          35
                                                                                            ? msg.body.substring(
                                                                                                  0,
                                                                                                  35,
                                                                                              ) +
                                                                                              '...'
                                                                                            : msg.body
                                                                                        : 'Pesan gambar',
                                                                                roomId:
                                                                                    activeRoom.id,
                                                                            })
                                                                        }
                                                                        disabled={
                                                                            deletingMessageId ===
                                                                            msg.id
                                                                        }
                                                                        className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-[#D4573A]/40 bg-[#FFF8EC] px-2 py-0.5 text-[10px] font-bold text-[#D4573A] transition-all hover:bg-[#D4573A] hover:text-white disabled:opacity-50"
                                                                        title="Hapus pesan ini (Admin / Penulis)"
                                                                    >
                                                                        {deletingMessageId ===
                                                                        msg.id ? (
                                                                            <Loader2 className="size-2.5 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="size-2.5" />
                                                                        )}
                                                                        <span>Hapus</span>
                                                                    </button>
                                                                )}
                                                        </div>
                                                    </div>

                                                    {/* Markdown Message Body */}
                                                    {msg.body && (
                                                        <MarkdownRenderer
                                                            content={msg.body}
                                                        />
                                                    )}

                                                    {/* Uploaded Image */}
                                                    {msg.image_url && (
                                                        <div className="mt-3">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setLightboxImageUrl(
                                                                        msg.image_url,
                                                                    )
                                                                }
                                                                className="group relative inline-block cursor-pointer overflow-hidden rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] shadow-[2px_2px_0px_0px_#3B2A1E]"
                                                            >
                                                                <img
                                                                    src={
                                                                        msg.image_url
                                                                    }
                                                                    alt="Lampiran diskusi"
                                                                    className="max-h-64 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                                                                />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Likes & Keyboard Emoji Reactions */}
                                                    <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
                                                        {/* Like Button */}
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                !currentUser ||
                                                                currentUser.is_admin ||
                                                                Boolean(
                                                                    pendingReactionByMsg[
                                                                        msg.id
                                                                    ],
                                                                )
                                                            }
                                                            onClick={() =>
                                                                handleToggleReaction(
                                                                    msg.id,
                                                                    '👍',
                                                                )
                                                            }
                                                            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1 text-xs font-bold transition-all ${
                                                                hasLiked
                                                                    ? 'border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                                                                    : 'border-[#EFE3D0] bg-white text-[#6B5646] hover:border-[#3B2A1E] hover:text-[#3B2A1E]'
                                                            } disabled:cursor-not-allowed disabled:opacity-70`}
                                                        >
                                                            {pendingReactionByMsg[
                                                                msg.id
                                                            ] === '👍' ? (
                                                                <Loader2 className="size-3.5 animate-spin text-[#3B2A1E]" />
                                                            ) : (
                                                                <ThumbsUp className="size-3.5" />
                                                            )}
                                                            <span>Suka</span>
                                                            {likeReaction &&
                                                                likeReaction.count >
                                                                    0 && (
                                                                    <span className="rounded-md bg-[#3B2A1E] px-1.5 py-0.2 text-[10px] font-extrabold text-[#FFF8EC]">
                                                                        {
                                                                            likeReaction.count
                                                                        }
                                                                    </span>
                                                                )}
                                                        </button>

                                                        {/* Other Emoji Pills */}
                                                        {msg.reactions
                                                            .filter(
                                                                (r) =>
                                                                    r.emoji !==
                                                                    '👍',
                                                            )
                                                            .map((reaction) => {
                                                                const reacted =
                                                                    currentUser
                                                                        ? reaction.user_ids.includes(
                                                                              currentUser.id,
                                                                          )
                                                                        : false;
                                                                const isPendingThisEmoji =
                                                                    pendingReactionByMsg[
                                                                        msg.id
                                                                    ] ===
                                                                    reaction.emoji;
                                                                return (
                                                                    <button
                                                                        key={
                                                                            reaction.emoji
                                                                        }
                                                                        type="button"
                                                                        disabled={
                                                                            !currentUser ||
                                                                            currentUser.is_admin ||
                                                                            Boolean(
                                                                                pendingReactionByMsg[
                                                                                    msg
                                                                                        .id
                                                                                ],
                                                                            )
                                                                        }
                                                                        onClick={() =>
                                                                            handleToggleReaction(
                                                                                msg.id,
                                                                                reaction.emoji,
                                                                            )
                                                                        }
                                                                        className={`cursor-pointer inline-flex items-center gap-1 rounded-xl border-2 px-2.5 py-1 text-xs font-bold transition-all ${
                                                                            reacted
                                                                                ? 'border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E]'
                                                                                : 'border-[#EFE3D0] bg-white text-[#3B2A1E] hover:border-[#3B2A1E]'
                                                                        } disabled:cursor-not-allowed disabled:opacity-70`}
                                                                    >
                                                                        {isPendingThisEmoji ? (
                                                                            <Loader2 className="size-3 animate-spin text-[#3B2A1E]" />
                                                                        ) : (
                                                                            <span>
                                                                                {
                                                                                    reaction.emoji
                                                                                }
                                                                            </span>
                                                                        )}
                                                                        <span>
                                                                            {
                                                                                reaction.count
                                                                            }
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}

                                                        {/* Reaction Picker & Keyboard Emoji Input */}
                                                        {currentUser && !currentUser.is_admin && (
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenReactionMessageId(
                                                                            openReactionMessageId ===
                                                                                msg.id
                                                                                ? null
                                                                                : msg.id,
                                                                        );
                                                                        setKeyboardEmojiInput(
                                                                            '',
                                                                        );
                                                                    }}
                                                                    disabled={Boolean(
                                                                        pendingReactionByMsg[
                                                                            msg
                                                                                .id
                                                                        ],
                                                                    )}
                                                                    className="cursor-pointer inline-flex items-center gap-1 rounded-xl border-2 border-dashed border-[#3B2A1E]/40 bg-[#FFF8EC] px-2.5 py-1 text-xs font-bold text-[#6B5646] hover:border-[#3B2A1E] hover:bg-[#FFE27A]/50 hover:text-[#3B2A1E] disabled:cursor-not-allowed disabled:opacity-70"
                                                                >
                                                                    {pendingReactionByMsg[
                                                                        msg.id
                                                                    ] &&
                                                                    pendingReactionByMsg[
                                                                        msg.id
                                                                    ] !==
                                                                        '👍' ? (
                                                                        <Loader2 className="size-3.5 animate-spin text-[#3B2A1E]" />
                                                                    ) : (
                                                                        <Smile className="size-3.5" />
                                                                    )}
                                                                    <span>
                                                                        + Reaksi
                                                                    </span>
                                                                </button>

                                                                {openReactionMessageId ===
                                                                    msg.id && (
                                                                    <div className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-3.5 shadow-[4px_4px_0px_0px_#3B2A1E]">
                                                                        <div className="mb-2 flex items-center justify-between">
                                                                            <span className="text-[11px] font-extrabold text-[#3B2A1E]">
                                                                                Pilih atau Ketik Emoji Keyboard
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setOpenReactionMessageId(
                                                                                        null,
                                                                                    )
                                                                                }
                                                                                className="cursor-pointer text-[#6B5646] hover:text-[#3B2A1E]"
                                                                            >
                                                                                <X className="size-3.5" />
                                                                            </button>
                                                                        </div>

                                                                        <div className="grid grid-cols-4 gap-1.5">
                                                                            {QUICK_EMOJIS.map(
                                                                                (
                                                                                    emoji,
                                                                                ) => (
                                                                                    <button
                                                                                        key={
                                                                                            emoji
                                                                                        }
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            handleToggleReaction(
                                                                                                msg.id,
                                                                                                emoji,
                                                                                            );
                                                                                            setOpenReactionMessageId(
                                                                                                null,
                                                                                            );
                                                                                        }}
                                                                                        className="cursor-pointer rounded-xl border border-[#3B2A1E] bg-white py-1.5 text-base hover:bg-[#FFE27A]"
                                                                                    >
                                                                                        {
                                                                                            emoji
                                                                                        }
                                                                                    </button>
                                                                                ),
                                                                            )}
                                                                        </div>

                                                                        <div className="mt-2.5 border-t border-[#EFE3D0] pt-2.5">
                                                                            <label className="flex items-center gap-1 text-[10px] font-bold text-[#6B5646]">
                                                                                <Keyboard className="size-3" />
                                                                                <span>
                                                                                    Ketik dari keyboard (Win + . / HP):
                                                                                </span>
                                                                            </label>
                                                                            <div className="mt-1.5 flex gap-1.5">
                                                                                <input
                                                                                    type="text"
                                                                                    value={
                                                                                        keyboardEmojiInput
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        setKeyboardEmojiInput(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    onKeyDown={(
                                                                                        e,
                                                                                    ) => {
                                                                                        if (
                                                                                            e.key ===
                                                                                                'Enter' &&
                                                                                            keyboardEmojiInput.trim()
                                                                                        ) {
                                                                                            e.preventDefault();
                                                                                            handleToggleReaction(
                                                                                                msg.id,
                                                                                                keyboardEmojiInput,
                                                                                            );
                                                                                            setKeyboardEmojiInput(
                                                                                                '',
                                                                                            );
                                                                                            setOpenReactionMessageId(
                                                                                                null,
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    placeholder="Ketik emoji..."
                                                                                    maxLength={
                                                                                        16
                                                                                    }
                                                                                    className="w-full rounded-xl border-2 border-[#3B2A1E] bg-white px-2.5 py-1 text-xs font-bold text-[#3B2A1E] focus:outline-none"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (
                                                                                            keyboardEmojiInput.trim()
                                                                                        ) {
                                                                                            handleToggleReaction(
                                                                                                msg.id,
                                                                                                keyboardEmojiInput,
                                                                                            );
                                                                                            setKeyboardEmojiInput(
                                                                                                '',
                                                                                            );
                                                                                            setOpenReactionMessageId(
                                                                                                null,
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    className="cursor-pointer rounded-xl border-2 border-[#3B2A1E] bg-[#FF9A3C] px-2.5 py-1 text-xs font-bold text-[#3B2A1E]"
                                                                                >
                                                                                    Kirim
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Composer (Markdown + Image) */}
                                    <div className="border-t-2 border-[#EFE3D0] bg-[#FFF8EC] p-4 sm:p-5">
                                        {currentUser?.is_admin ? (
                                            <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                                <span className="text-xs font-bold text-[#6B5646]">
                                                    *Hanya Lihat
                                                </span>
                                                <p className="text-xs sm:text-sm font-semibold leading-relaxed text-[#3B2A1E]">
                                                    Sebagai administrator, Anda berada dalam mode pemantauan murni tanpa interaksi pesan langsung ke anggota. Anda dapat memantau percakapan dan mengelola/menambahkan kategori dari ruang diskusi ini.
                                                </p>
                                            </div>
                                        ) : currentUser ? (
                                            <form
                                                onSubmit={handleSendMessage}
                                                className="space-y-3"
                                            >
                                                {/* Markdown Toolbar */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 py-2 shadow-[2px_2px_0px_0px_#3B2A1E]">
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                insertMarkdownSyntax(
                                                                    '**',
                                                                    '**',
                                                                    'tebal',
                                                                )
                                                            }
                                                            title="Tebal (**teks**)"
                                                            className="cursor-pointer rounded-lg p-1.5 text-[#3B2A1E] hover:bg-[#FFE27A]"
                                                        >
                                                            <Bold className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                insertMarkdownSyntax(
                                                                    '*',
                                                                    '*',
                                                                    'miring',
                                                                )
                                                            }
                                                            title="Miring (*teks*)"
                                                            className="cursor-pointer rounded-lg p-1.5 text-[#3B2A1E] hover:bg-[#FFE27A]"
                                                        >
                                                            <Italic className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                insertMarkdownSyntax(
                                                                    '`',
                                                                    '`',
                                                                    'kode/nomor',
                                                                )
                                                            }
                                                            title="Kode (`teks`)"
                                                            className="cursor-pointer rounded-lg p-1.5 text-[#3B2A1E] hover:bg-[#FFE27A]"
                                                        >
                                                            <Code className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                insertMarkdownSyntax(
                                                                    '\n> ',
                                                                    '',
                                                                    'kutipan',
                                                                )
                                                            }
                                                            title="Kutipan (> teks)"
                                                            className="cursor-pointer rounded-lg p-1.5 text-[#3B2A1E] hover:bg-[#FFE27A]"
                                                        >
                                                            <Quote className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                insertMarkdownSyntax(
                                                                    '\n- ',
                                                                    '',
                                                                    'poin daftar',
                                                                )
                                                            }
                                                            title="Daftar (- item)"
                                                            className="cursor-pointer rounded-lg p-1.5 text-[#3B2A1E] hover:bg-[#FFE27A]"
                                                        >
                                                            <List className="size-4" />
                                                        </button>

                                                        <div className="mx-1 h-4 w-0.5 bg-[#EFE3D0]" />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                fileInputRef.current?.click()
                                                            }
                                                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#3B2A1E] bg-[#FFE27A] px-2.5 py-1 text-xs font-bold text-[#3B2A1E] hover:bg-[#FF9A3C]"
                                                        >
                                                            <ImageIcon className="size-3.5" />
                                                            <span>Gambar</span>
                                                        </button>
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/jpeg,image/png,image/webp"
                                                            className="hidden"
                                                            onChange={(e) =>
                                                                handleImageFile(
                                                                    e.target
                                                                        .files?.[0] ??
                                                                        null,
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setIsMarkdownPreview(
                                                                !isMarkdownPreview,
                                                            )
                                                        }
                                                        className={`cursor-pointer inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-colors ${
                                                            isMarkdownPreview
                                                                ? 'border border-[#3B2A1E] bg-[#8ECDF0] text-[#3B2A1E]'
                                                                : 'text-[#6B5646] hover:text-[#3B2A1E]'
                                                        }`}
                                                    >
                                                        <Eye className="size-3.5" />
                                                        <span>
                                                            {isMarkdownPreview
                                                                ? 'Tulis'
                                                                : 'Pratinjau'}
                                                        </span>
                                                    </button>
                                                </div>

                                                {/* Selected Image Preview */}
                                                {selectedImagePreview && (
                                                    <div className="flex items-center justify-between rounded-2xl border-2 border-[#3B2A1E] bg-white p-2.5">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={
                                                                    selectedImagePreview
                                                                }
                                                                alt="Pratinjau"
                                                                className="size-12 rounded-xl border border-[#3B2A1E] object-cover"
                                                            />
                                                            <span className="text-xs font-bold text-[#3B2A1E]">
                                                                {
                                                                    selectedImage?.name
                                                                }
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleImageFile(
                                                                    null,
                                                                )
                                                            }
                                                            className="cursor-pointer rounded-xl border border-[#3B2A1E] bg-[#D4573A] p-1 text-white"
                                                        >
                                                            <X className="size-4" />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Editor or Markdown Preview */}
                                                {isMarkdownPreview ? (
                                                    <div className="min-h-[88px] rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5">
                                                        {messageBody.trim() ? (
                                                            <MarkdownRenderer
                                                                content={
                                                                    messageBody
                                                                }
                                                            />
                                                        ) : (
                                                            <p className="text-xs italic text-[#6B5646]">
                                                                Belum ada teks
                                                                untuk
                                                                dipratinjau...
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        ref={textareaRef}
                                                        rows={3}
                                                        value={messageBody}
                                                        onChange={(e) =>
                                                            setMessageBody(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onPaste={
                                                            handlePasteImage
                                                        }
                                                        placeholder="Tulis pesan diskusi (mendukung **Markdown**, tempel gambar Ctrl+V, atau ketik emoji Win + .)..."
                                                        className="w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                                    />
                                                )}

                                                {messageError && (
                                                    <p className="text-xs font-bold text-[#D4573A]">
                                                        {messageError}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-semibold text-[#6B5646]">
                                                        Mendukung format Markdown
                                                        & lampiran gambar (maks 5
                                                        MB).
                                                    </span>
                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                        size="sm"
                                                        disabled={
                                                            isSendingMessage
                                                        }
                                                    >
                                                        {isSendingMessage ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Send className="size-3.5" />
                                                        )}
                                                        <span>Kirim Pesan</span>
                                                    </Button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-[#3B2A1E] bg-[#FFF8EC] p-4 sm:p-5 shadow-[3px_3px_0px_0px_#3B2A1E]">
                                                <div className="min-w-0">
                                                    <h4 className="font-['Fredoka',system-ui,sans-serif] text-sm sm:text-base font-bold text-[#3B2A1E] leading-snug">
                                                        Ingin Ikut Berdiskusi?
                                                    </h4>
                                                    <p className="mt-1 text-xs sm:text-[13px] font-semibold text-[#6B5646] leading-relaxed">
                                                        Silakan masuk ke akun Anda untuk mengirim pesan, mengunggah tangkapan layar bukti, dan memberikan reaksi emoji.
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center sm:self-center">
                                                    <Link
                                                        href="/login"
                                                        className={`whitespace-nowrap shrink-0 ${buttonClasses(
                                                            'primary',
                                                            'sm',
                                                        )} px-5 shadow-[2px_2px_0px_0px_#3B2A1E]`}
                                                    >
                                                        <span>Masuk Akun</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ) : (
                                <Card
                                    variant="glass"
                                    className="flex flex-col items-center justify-center px-6 py-12 sm:px-8 sm:py-16 text-center"
                                >
                                    <img
                                        src="/empty_state.png"
                                        alt="Pilih ruang diskusi"
                                        className="mb-3 w-28 sm:w-32 h-auto object-contain select-none opacity-90"
                                    />
                                    <h3 className="font-['Fredoka',system-ui,sans-serif] text-base sm:text-lg font-bold text-[#3B2A1E]">
                                        Pilih Ruang Diskusi Komunitas
                                    </h3>
                                    <p className="mt-1.5 max-w-sm text-xs sm:text-sm leading-relaxed text-[#6B5646]">
                                        Pilih salah satu ruang diskusi di sebelah kiri untuk mulai membaca, membagikan informasi kewaspadaan, atau berinteraksi dengan sesama Guardian.
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* TAB 2: VERIFIED RADAR ALERTS FEED (Original Cekara Layout) */}
            {activeTab === 'radar' && (
                <>
                    <section className="mx-auto max-w-5xl px-6 pt-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            {/* Search */}
                            <div className="relative w-full sm:max-w-md">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                    <Search className="size-4 text-[#6B5646]" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Cari kata kunci atau kota..."
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white pl-10 pr-9 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] transition-all focus:border-[#FF9A3C] focus:bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#FF9A3C]/40"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6B5646]/70 hover:text-[#3B2A1E] transition-colors cursor-pointer"
                                        title="Hapus pencarian"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>

                            {/* CTA Button */}
                            {!currentUser?.is_admin && (
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => {
                                        setActiveTab('discussions');
                                        if (currentUser) {
                                            setIsCreateRoomOpen(true);
                                        }
                                    }}
                                >
                                    <MessageSquarePlus className="size-4" />
                                    <span>Mulai Diskusi Kasus</span>
                                </Button>
                            )}
                        </div>
                    </section>

                    <section className="mx-auto max-w-5xl px-6 py-8">
                        <div className="grid gap-6">
                            {filteredAlerts.map((alert) => {
                                const hasUpvoted = upvotedIds.includes(
                                    alert.id,
                                );
                                const shareUrl = `https://wa.me/?text=${encodeURIComponent(
                                    `⚠️ WASPADA PENIPUAN BARU: ${alert.title}\n\nPlatform: ${alert.platform}\nLokasi: ${
                                        alert.location || 'Indonesia'
                                    }\nModus: ${alert.description}\n\nPantau radar selengkapnya di Cekara: https://cekara.id/radar`,
                                )}`;

                                return (
                                    <Card
                                        key={alert.id}
                                        variant="floating"
                                        className="p-6"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="warn">
                                                        {alert.platform}
                                                    </Badge>
                                                    {alert.location && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B5646]">
                                                            <MapPin className="size-3 text-[#E06812]" />
                                                            {alert.location}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B5646]">
                                                        <Clock className="size-3" />
                                                        {alert.created_at_human}
                                                    </span>
                                                </div>

                                                <h3 className="mt-2 font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                                    {alert.title}
                                                </h3>

                                                <p className="mt-2 text-sm leading-relaxed text-[#4A3B32]">
                                                    {alert.description}
                                                </p>

                                                {alert.evidence_text && (
                                                    <div className="mt-4 rounded-xl border-2 border-[#EFE3D0] bg-[#FFF8EC] p-3 text-xs text-[#6B5646]">
                                                        <span className="font-bold text-[#3B2A1E]">
                                                            Ciri Percakapan /
                                                            Bukti:
                                                        </span>{' '}
                                                        <span className="font-mono italic">
                                                            {
                                                                alert.evidence_text
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpvote(alert.id)
                                                    }
                                                    disabled={hasUpvoted || Boolean(currentUser?.is_admin)}
                                                    title={
                                                        currentUser?.is_admin
                                                            ? 'Administrator dalam mode pemantauan hanya-lihat.'
                                                            : undefined
                                                    }
                                                    className={`cursor-pointer inline-flex h-9 items-center gap-2 rounded-xl border-2 px-3.5 text-xs font-bold transition-all ${
                                                        hasUpvoted
                                                            ? 'border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                                            : 'border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFF8EC]'
                                                    } disabled:cursor-not-allowed disabled:opacity-70`}
                                                >
                                                    <ThumbsUp className="size-3.5" />
                                                    <span>
                                                        Saya Mengalami Ini
                                                    </span>
                                                    <span className="rounded-md bg-[#FFF8EC] border border-[#3B2A1E] px-1.5 py-0.5 text-[11px] font-extrabold text-[#3B2A1E]">
                                                        {alert.upvotes_count}
                                                    </span>
                                                </button>

                                                <a
                                                    href={shareUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`${buttonClasses('ghost', 'sm')} inline-flex items-center gap-1.5 text-xs`}
                                                    title="Bagikan peringatan ini ke grup WhatsApp"
                                                >
                                                    <Share2 className="size-3.5" />
                                                    Bagikan ke WA
                                                </a>

                                                {currentUser?.is_admin && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeletePattern(
                                                                alert.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingPatternId ===
                                                            alert.id
                                                        }
                                                        className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#D4573A] bg-[#FFF8EC] px-2.5 text-[11px] font-bold text-[#D4573A] transition-all hover:bg-[#D4573A] hover:text-white disabled:opacity-50"
                                                        title="Hapus modus penipuan ini (Admin)"
                                                    >
                                                        {deletingPatternId ===
                                                        alert.id ? (
                                                            <Loader2 className="size-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="size-3" />
                                                        )}
                                                        <span>Hapus</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}

                            {filteredAlerts.length === 0 && (
                                <Card
                                    variant="glass"
                                    className="flex flex-col items-center justify-center px-6 py-10 sm:px-8 sm:py-14 text-center"
                                >
                                    <img
                                        src="/empty_state.png"
                                        alt="Belum ada data radar"
                                        className="mb-3 w-28 sm:w-32 h-auto object-contain select-none opacity-90"
                                    />
                                    <h3 className="font-['Fredoka',system-ui,sans-serif] text-base sm:text-lg font-bold text-[#3B2A1E]">
                                        {alerts.length === 0
                                            ? 'Belum Ada Data Modus Penipuan di Radar'
                                            : 'Tidak Ada Laporan Penipuan Ditemukan'}
                                    </h3>
                                    <p className="mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed text-[#6B5646]">
                                        {alerts.length === 0
                                            ? 'Administrator dapat memverifikasi topik dari Ruang Diskusi Komunitas untuk diterbitkan sebagai modus resmi di radar ini.'
                                            : 'Coba pilih kategori lain atau periksa kembali kata kunci pencarian Anda.'}
                                    </p>
                                    {alerts.length === 0 && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setActiveTab('discussions')}
                                            className="mt-4"
                                        >
                                            <MessageSquare className="size-4" />
                                            <span>
                                                Lihat Ruang Diskusi Komunitas
                                            </span>
                                        </Button>
                                    )}
                                </Card>
                            )}
                        </div>
                    </section>
                </>
            )}

            {/* Modal: Create Discussion Room (Cekara Rounded-3xl Style) */}
            {isCreateRoomOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2A1E]/50 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsCreateRoomOpen(false)}
                    />
                    <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_6px_0px_0px_#3B2A1E]">
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                            <div>
                                <h2 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                    Buat Ruang Diskusi Baru
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateRoomOpen(false)}
                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            >
                                <X className="size-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateRoom}
                            className="space-y-4 p-6"
                        >

                            {roomError && (
                                <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#D4573A] p-3.5 text-xs font-bold text-white">
                                    {roomError}
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Judul Topik Diskusi
                                </label>
                                <input
                                    type="text"
                                    required
                                    minLength={5}
                                    maxLength={160}
                                    value={newRoomForm.title}
                                    onChange={(e) =>
                                        setNewRoomForm({
                                            ...newRoomForm,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: Waspada Pesan WA Kurir Paket File .APK"
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Kategori Modus
                                </label>
                                <select
                                    value={newRoomForm.category}
                                    onChange={(e) =>
                                        setNewRoomForm({
                                            ...newRoomForm,
                                            category: e.target.value,
                                        })
                                    }
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                >
                                    {categoryList
                                        .filter((c) => c.key !== 'all')
                                        .map((cat) => (
                                            <option
                                                key={cat.key}
                                                value={cat.key}
                                            >
                                                {cat.label}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Deskripsi & Pesan Pembuka (Mendukung Markdown)
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    minLength={10}
                                    value={newRoomForm.description}
                                    onChange={(e) =>
                                        setNewRoomForm({
                                            ...newRoomForm,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Ceritakan temuan atau pertanyaan Anda. Mendukung **tebal**, `kode`, dan daftar poin..."
                                    className="w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() => setIsCreateRoomOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={
                                        isCreatingRoom ||
                                        dailyQuota.remaining <= 0
                                    }
                                >
                                    {isCreatingRoom && (
                                        <Loader2 className="size-4 animate-spin" />
                                    )}
                                    <span>Buka Ruang Diskusi</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Category (Admin only) */}
            {isAddCategoryOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2A1E]/50 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsAddCategoryOpen(false)}
                    />
                    <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_6px_0px_0px_#3B2A1E]">
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                            <div className="flex items-center gap-2">
                                <h2 className="font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                    Tambah Kategori Percakapan
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddCategoryOpen(false)}
                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            >
                                <X className="size-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleAddCategory}
                            className="space-y-4 p-6"
                        >
                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs font-semibold text-[#6B5646] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                Kategori baru akan langsung dapat digunakan oleh seluruh anggota komunitas saat membuka ruang diskusi baru maupun mengelompokkan percakapan.
                            </div>

                            {categoryError && (
                                <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#D4573A] p-3.5 text-xs font-bold text-white">
                                    {categoryError}
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Nama Kategori (Label Tampilan)
                                </label>
                                <input
                                    type="text"
                                    required
                                    minLength={3}
                                    maxLength={50}
                                    value={newCategoryForm.label}
                                    onChange={(e) =>
                                        setNewCategoryForm({
                                            ...newCategoryForm,
                                            label: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: Modus AI Voice & Deepfake"
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Kunci / Slug Kategori (Opsional)
                                </label>
                                <input
                                    type="text"
                                    maxLength={50}
                                    value={newCategoryForm.key}
                                    onChange={(e) =>
                                        setNewCategoryForm({
                                            ...newCategoryForm,
                                            key: e.target.value,
                                        })
                                    }
                                    placeholder="Otomatis dibuat dari nama jika dikosongkan"
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Warna Lencana (Badge Variant)
                                </label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {[
                                        { val: 'brand' as const, label: 'Brand (Oranye)', bg: 'bg-[#FF9A3C]' },
                                        { val: 'danger' as const, label: 'Bahaya (Merah)', bg: 'bg-[#D4573A]' },
                                        { val: 'warn' as const, label: 'Waspada (Kuning)', bg: 'bg-[#FFE27A]' },
                                        { val: 'neutral' as const, label: 'Netral (Krem)', bg: 'bg-[#FFF8EC]' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.val}
                                            type="button"
                                            onClick={() =>
                                                setNewCategoryForm({
                                                    ...newCategoryForm,
                                                    variant: opt.val,
                                                })
                                            }
                                            className={`cursor-pointer flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 text-xs font-bold transition-all ${
                                                newCategoryForm.variant === opt.val
                                                    ? 'border-[#3B2A1E] bg-[#FFE27A] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                                    : 'border-[#EFE3D0] bg-white text-[#6B5646] hover:border-[#3B2A1E]'
                                            }`}
                                        >
                                            <span className={`size-4 rounded-full border border-[#3B2A1E] ${opt.bg}`} />
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() => setIsAddCategoryOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={
                                        isAddingCategory ||
                                        !newCategoryForm.label.trim()
                                    }
                                >
                                    {isAddingCategory && (
                                        <Loader2 className="size-4 animate-spin" />
                                    )}
                                    <span>Simpan Kategori</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Verify Discussion Room as Radar Pattern (Admin only) */}
            {isVerifyModalOpen && verifyModalRoom && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2A1E]/50 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => {
                            if (!isVerifyingRoom) {
                                setIsVerifyModalOpen(false);
                                setVerifyModalRoom(null);
                            }
                        }}
                    />
                    <div className="relative z-10 flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_6px_0px_0px_#3B2A1E]">
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <Radio className="size-5 text-[#E06812]" />
                                <h3 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                    Jadikan Modus Terverifikasi
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isVerifyingRoom) {
                                        setIsVerifyModalOpen(false);
                                        setVerifyModalRoom(null);
                                    }
                                }}
                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            >
                                <X className="size-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleVerifyRoomAsPattern}
                            className="space-y-4 p-6 overflow-y-auto"
                        >
                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs font-semibold text-[#6B5646] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                Mengkurasi ruang diskusi:{' '}
                                <strong className="text-[#3B2A1E]">
                                    {verifyModalRoom.title}
                                </strong>{' '}
                                dari pelapor{' '}
                                <strong className="text-[#3B2A1E]">
                                    {verifyModalRoom.creator.name}
                                </strong>
                                . Modus yang Anda verifikasi akan tayang di
                                Daftar Modus Radar dan terhubung langsung ke obrolan ini.
                            </div>

                            {verifyError && (
                                <div className="rounded-2xl border-2 border-[#3B2A1E] bg-[#D4573A] p-3.5 text-xs font-bold text-white">
                                    {verifyError}
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Judul Modus Penipuan *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={255}
                                    value={verifyForm.title}
                                    onChange={(e) =>
                                        setVerifyForm({
                                            ...verifyForm,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: Modus Freelance Like & Subscribe Deposit Telegram"
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                        Kategori Modus *
                                    </label>
                                    <select
                                        value={verifyForm.category}
                                        onChange={(e) =>
                                            setVerifyForm({
                                                ...verifyForm,
                                                category: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-3 text-xs sm:text-sm font-bold text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                    >
                                        {categoryList
                                            .filter((c) => c.key !== 'all')
                                            .map((cat) => (
                                                <option
                                                    key={cat.key}
                                                    value={cat.key}
                                                >
                                                    {cat.label}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                        Platform / Media *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={100}
                                        value={verifyForm.platform}
                                        onChange={(e) =>
                                            setVerifyForm({
                                                ...verifyForm,
                                                platform: e.target.value,
                                            })
                                        }
                                        placeholder="Contoh: WhatsApp, Telegram, IG"
                                        className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Wilayah / Lokasi Kejadian (Opsional)
                                </label>
                                <input
                                    type="text"
                                    maxLength={150}
                                    value={verifyForm.location}
                                    onChange={(e) =>
                                        setVerifyForm({
                                            ...verifyForm,
                                            location: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: Jakarta Selatan, Surabaya, Nasional"
                                    className="h-11 w-full rounded-2xl border-2 border-[#3B2A1E] bg-white px-4 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Ringkasan Kronologi / Modus *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={verifyForm.description}
                                    onChange={(e) =>
                                        setVerifyForm({
                                            ...verifyForm,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Jelaskan bagaimana modus ini beroperasi, pancingan awal pelaku, dan kerugian yang ditimbulkan..."
                                    className="w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-[#3B2A1E]">
                                    Ciri Percakapan / Bukti Teks (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={verifyForm.evidence_text}
                                    onChange={(e) =>
                                        setVerifyForm({
                                            ...verifyForm,
                                            evidence_text: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: 'Tugas 1 cair Rp20.000. Untuk misi berikutnya wajib deposit Rp500.000 ke rekening...'"
                                    className="w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() => {
                                        setIsVerifyModalOpen(false);
                                        setVerifyModalRoom(null);
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={
                                        isVerifyingRoom ||
                                        !verifyForm.title.trim() ||
                                        !verifyForm.description.trim()
                                    }
                                >
                                    {isVerifyingRoom && (
                                        <Loader2 className="size-4 animate-spin" />
                                    )}
                                    <span>
                                        Verifikasi & Terbitkan ke Radar
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Image Lightbox */}
            {lightboxImageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2A1E]/70 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setLightboxImageUrl(null)}
                    />
                    <div className="relative z-10 max-w-3xl overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] p-4 shadow-[6px_6px_0px_0px_#3B2A1E]">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                Lampiran Bukti Komunitas
                            </span>
                            <button
                                type="button"
                                onClick={() => setLightboxImageUrl(null)}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] hover:bg-[#FFE27A]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <img
                            src={lightboxImageUrl}
                            alt="Lampiran penuh"
                            className="max-h-[75vh] w-auto rounded-2xl border-2 border-[#3B2A1E] object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Modal: Confirm Delete Room or Message */}
            {confirmDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2A1E]/70 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => {
                            if (!deletingRoomId && !deletingMessageId) {
                                setConfirmDeleteModal(null);
                            }
                        }}
                    />
                    <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_6px_0px_0px_#3B2A1E]">
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-[#D4573A] text-white shadow-[1.5px_1.5px_0px_0px_#3B2A1E]">
                                    <Trash2 className="size-4" />
                                </div>
                                <h3 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                    {confirmDeleteModal.type === 'room'
                                        ? 'Hapus Ruang Diskusi'
                                        : 'Hapus Pesan Diskusi'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!deletingRoomId && !deletingMessageId) {
                                        setConfirmDeleteModal(null);
                                    }
                                }}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                            >
                                <X className="size-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-4 text-xs leading-relaxed text-[#6B5646] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                {confirmDeleteModal.type === 'room' ? (
                                    <>
                                        Apakah Anda yakin ingin menghapus ruang
                                        diskusi{' '}
                                        <strong className="text-[#3B2A1E]">
                                            "{confirmDeleteModal.title}"
                                        </strong>
                                        ? Seluruh pesan dan riwayat di dalamnya
                                        akan dihapus secara permanen untuk
                                        menjaga keamanan dan etika komunitas.
                                    </>
                                ) : (
                                    <>
                                        Apakah Anda yakin ingin menghapus pesan:{' '}
                                        <strong className="text-[#3B2A1E]">
                                            "{confirmDeleteModal.title}"
                                        </strong>
                                        ? Pesan yang mengandung kata-kata tidak
                                        pantas atau informasi yang menyalahi
                                        etika akan dihapus secara permanen.
                                    </>
                                )}
                            </div>

                            {currentUser?.is_admin && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-[#3B2A1E]">
                                            Alasan Penghapusan{' '}
                                            <span className="text-[#D4573A]">
                                                * (Wajib oleh Admin)
                                            </span>
                                        </label>
                                        <span className="text-[10px] font-bold text-[#6B5646]">
                                            {deleteReason.length}/1000
                                        </span>
                                    </div>

                                    {/* Preset Chips */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            'Kata-kata kasar atau tidak pantas',
                                            'Spam / promosi berulang tanpa izin',
                                            'Informasi palsu / disinformasi hoax',
                                            'Potensi penipuan baru / data pribadi',
                                        ].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    setDeleteReason(preset);
                                                    setDeleteReasonError(null);
                                                }}
                                                className="cursor-pointer rounded-lg border border-[#3B2A1E]/30 bg-white px-2 py-0.5 text-[10px] font-bold text-[#3B2A1E] hover:bg-[#FFE27A] transition"
                                            >
                                                + {preset}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        rows={3}
                                        value={deleteReason}
                                        onChange={(e) => {
                                            setDeleteReason(e.target.value);
                                            if (
                                                deleteReasonError &&
                                                e.target.value.trim().length >=
                                                    5
                                            ) {
                                                setDeleteReasonError(null);
                                            }
                                        }}
                                        placeholder="Tuliskan alasan profesional agar pengguna memahami moderasi ini..."
                                        className="w-full rounded-2xl border-2 border-[#3B2A1E] bg-white p-3 text-xs sm:text-sm font-semibold text-[#3B2A1E] placeholder:text-[#6B5646]/60 shadow-[2px_2px_0px_0px_#3B2A1E] focus:border-[#FF9A3C] focus:outline-none"
                                    />

                                    {deleteReasonError ? (
                                        <p className="text-[11px] font-bold text-[#D4573A]">
                                            {deleteReasonError}
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-[#6B5646]">
                                            Alasan ini akan otomatis masuk ke
                                            kotak <strong>Pesan Notif</strong>{' '}
                                            pengguna terkait.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-2.5 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    disabled={Boolean(
                                        deletingRoomId || deletingMessageId,
                                    )}
                                    onClick={() => {
                                        setConfirmDeleteModal(null);
                                        setDeleteReason('');
                                        setDeleteReasonError(null);
                                    }}
                                >
                                    Batal
                                </Button>
                                <button
                                    type="button"
                                    disabled={
                                        Boolean(
                                            deletingRoomId ||
                                                deletingMessageId,
                                        ) ||
                                        Boolean(
                                            currentUser?.is_admin &&
                                                deleteReason.trim().length < 5,
                                        )
                                    }
                                    onClick={() => {
                                        if (confirmDeleteModal.type === 'room') {
                                            handleDeleteRoom(
                                                confirmDeleteModal.id,
                                            );
                                        } else if (confirmDeleteModal.roomId) {
                                            handleDeleteMessage(
                                                confirmDeleteModal.id,
                                                confirmDeleteModal.roomId,
                                            );
                                        }
                                    }}
                                    className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#3B2A1E] bg-[#D4573A] px-5 text-xs font-black text-white shadow-[2px_2px_0px_0px_#3B2A1E] transition-all hover:bg-[#b83c21] disabled:opacity-50"
                                >
                                    {(deletingRoomId || deletingMessageId) && (
                                        <Loader2 className="size-4 animate-spin" />
                                    )}
                                    <span>Ya, Hapus</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal / Drawer: Sandbox Pesan Notifikasi Komunitas */}
            {isNoticeSandboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2A1E]/70 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsNoticeSandboxOpen(false)}
                    />
                    <div className="relative z-10 flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-3xl border-3 border-[#3B2A1E] bg-[#FFF8EC] shadow-[6px_6px_0px_0px_#3B2A1E]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b-2 border-[#EFE3D0] bg-[#FFF8EC] px-6 py-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-['Fredoka',system-ui,sans-serif] text-lg font-bold text-[#3B2A1E]">
                                        Kotak Pesan Notifikasi Komunitas
                                    </h3>
                                    {unreadNoticesCount > 0 && (
                                        <span className="inline-flex items-center rounded-full bg-[#D4573A] px-2 py-0.5 text-[10px] font-black text-white">
                                            {unreadNoticesCount} baru
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] font-semibold text-[#6B5646]">
                                    Transparansi moderasi ruang dan pesan dari Administrator Cekara
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {unreadNoticesCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleMarkAllNoticesAsRead}
                                        disabled={isMarkingAllRead}
                                        className="cursor-pointer inline-flex items-center gap-1 rounded-xl border-2 border-[#3B2A1E] bg-white px-2.5 py-1 text-xs font-bold text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                                        title="Tandai semua sudah dibaca"
                                    >
                                        {isMarkingAllRead ? (
                                            <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                            <CheckCheck className="size-3" />
                                        )}
                                        <span className="hidden sm:inline">
                                            Tandai Semua Dibaca
                                        </span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsNoticeSandboxOpen(false)
                                    }
                                    className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[1.5px_1.5px_0px_0px_#3B2A1E] hover:bg-[#FFE27A] transition"
                                >
                                    <X className="size-4" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 bg-[#FFFDF9]">
                            {moderationNotices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <img
                                        src="/empty_state.png"
                                        alt="Kotak notifikasi bersih"
                                        className="mb-3 w-28 h-auto object-contain select-none opacity-90"
                                    />
                                    <h4 className="font-['Fredoka',system-ui,sans-serif] text-base font-bold text-[#3B2A1E]">
                                        Kotak Notifikasi Bersih!
                                    </h4>
                                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#6B5646]">
                                        Tidak ada catatan teguran atau penghapusan
                                        konten pada akun Anda. Tetap patuhi
                                        panduan komunitas Cekara dan saling
                                        menjaga ruang diskusi yang aman!
                                    </p>
                                </div>
                            ) : (
                                moderationNotices.map((notice) => (
                                    <div
                                        key={notice.id}
                                        className={`rounded-2xl border-2 border-[#3B2A1E] p-4 shadow-[2px_2px_0px_0px_#3B2A1E] transition-all ${
                                            !notice.is_read
                                                ? 'bg-[#FFF8EC] ring-2 ring-[#FF9A3C]/40'
                                                : 'bg-white'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE3D0] pb-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-lg border border-[#3B2A1E] px-2 py-0.5 text-[10px] font-black uppercase ${
                                                        notice.type ===
                                                        'room_deleted'
                                                            ? 'bg-[#D4573A] text-white'
                                                            : 'bg-[#FFE27A] text-[#3B2A1E]'
                                                    }`}
                                                >
                                                    <AlertTriangle className="size-2.5" />
                                                    {notice.type ===
                                                    'room_deleted'
                                                        ? 'Ruang Diskusi Dihapus'
                                                        : 'Pesan Diskusi Dihapus'}
                                                </span>
                                                {!notice.is_read && (
                                                    <span className="size-2 rounded-full bg-[#D4573A] animate-pulse" />
                                                )}
                                            </div>
                                            <span className="text-[11px] font-semibold text-[#6B5646]">
                                                {notice.created_at_human} •{' '}
                                                {notice.created_at_time}
                                            </span>
                                        </div>

                                        {/* Content Details */}
                                        <div className="mt-2.5 space-y-1.5">
                                            {notice.room_title &&
                                                notice.type ===
                                                    'message_deleted' && (
                                                    <div className="text-[11px] font-semibold text-[#6B5646]">
                                                        Ruang Diskusi:{' '}
                                                        <strong className="text-[#3B2A1E]">
                                                            {notice.room_title}
                                                        </strong>
                                                    </div>
                                                )}
                                            <div className="rounded-xl border border-[#3B2A1E]/20 bg-[#FFFDF9] px-3 py-2 text-xs font-medium text-[#4A3B32]">
                                                <span className="font-bold text-[#3B2A1E]">
                                                    Konten terdampak:{' '}
                                                </span>
                                                "{notice.target_title}"
                                            </div>
                                        </div>

                                        {/* Admin Reason Box */}
                                        <div className="mt-2.5 rounded-xl border-2 border-[#D4573A]/40 bg-[#FFF4F0] p-3">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4573A]">
                                                <ShieldAlert className="size-3.5" />
                                                <span>
                                                    Alasan dari Moderator Admin:
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs sm:text-sm font-semibold leading-relaxed text-[#3B2A1E]">
                                                "{notice.reason}"
                                            </p>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="mt-3 flex items-center justify-between border-t border-[#EFE3D0] pt-2 text-[11px] text-[#6B5646]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-[#3B2A1E]">
                                                    {notice.admin_name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {!notice.is_read && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleMarkNoticeAsRead(
                                                                notice.id,
                                                            )
                                                        }
                                                        disabled={
                                                            markingReadNoticeId ===
                                                            notice.id
                                                        }
                                                        className="cursor-pointer font-bold text-[#E06812] hover:underline"
                                                    >
                                                        Tandai Dibaca
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteNotice(
                                                            notice.id,
                                                        )
                                                    }
                                                    className="cursor-pointer text-[#D4573A] hover:underline"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
