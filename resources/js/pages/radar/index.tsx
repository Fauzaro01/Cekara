import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bold,
    CheckCircle2,
    Code,
    Eye,
    Flame,
    Filter,
    Hash,
    Image as ImageIcon,
    Italic,
    Keyboard,
    List,
    Loader2,
    Lock,
    MapPin,
    MessageSquare,
    MessageSquarePlus,
    Pin,
    Plus,
    Quote,
    Radio,
    Search,
    Send,
    ShieldAlert,
    ShieldCheck,
    Smile,
    Sparkles,
    ThumbsUp,
    TrendingUp,
    Users,
    Wifi,
    X,
} from 'lucide-react';
import type { ClipboardEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface RadarAlert {
    id: number;
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
    messages_count: number;
    created_at_human: string;
    updated_at_human: string;
    creator: {
        id: number;
        name: string;
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

interface RadarPageProps {
    alerts: RadarAlert[];
    rooms?: CommunityRoomItem[];
    dailyRoomQuota?: DailyRoomQuota;
    realtimeConfig?: RealtimeConfig;
    filters: {
        category: string;
        platform: string;
        sort: string;
        search: string;
    };
    stats: {
        total_alerts: number;
        total_confirmed_cases: number;
        top_targeted_platform: string;
    };
}

interface SharedAuthProps {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            is_admin?: boolean;
        } | null;
    };
}

const CATEGORY_MAP: Record<
    string,
    { label: string; badgeClass: string; bgAccent: string }
> = {
    apk_malware: {
        label: 'Malware .APK / Sadap OTP',
        badgeClass: 'bg-red-100 text-red-900 border-red-900',
        bgAccent: 'bg-red-600',
    },
    phishing_banking: {
        label: 'Phishing Bank / Dompet Digital',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-900',
        bgAccent: 'bg-amber-500',
    },
    social_engineering: {
        label: 'Rekayasa Sosial / QRIS Palsu',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-900',
        bgAccent: 'bg-purple-600',
    },
    fake_job: {
        label: 'Lowongan Kerja & Misi Fiktif',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-900',
        bgAccent: 'bg-blue-600',
    },
    fake_giveaway: {
        label: 'Undian & Hadiah Palsu',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-900',
        bgAccent: 'bg-emerald-600',
    },
};

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🛡️', '⚠️', '🙏', '👏', '😮'];

function getCsrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

/**
 * Safe inline Markdown parser for bold, italic, inline code, and links.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
    const tokens = text.split(
        /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g,
    );

    return tokens.map((token, index) => {
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return (
                <strong key={index} className="font-black text-zinc-950">
                    {token.slice(2, -2)}
                </strong>
            );
        }

        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
            return (
                <code
                    key={index}
                    className="rounded border border-zinc-400 bg-amber-100 px-1.5 py-0.5 font-mono text-xs font-bold text-zinc-900"
                >
                    {token.slice(1, -1)}
                </code>
            );
        }

        if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
            return (
                <em key={index} className="italic text-zinc-800">
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
                    className="font-bold text-blue-700 underline decoration-2 underline-offset-2 hover:text-blue-900"
                >
                    {linkMatch[1]}
                </a>
            );
        }

        return <span key={index}>{token}</span>;
    });
}

/**
 * Safe block Markdown renderer supporting code blocks, blockquotes, lists, headings, and paragraphs.
 */
function MarkdownRenderer({ content }: { content: string }) {
    const segments = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-2 text-sm leading-relaxed text-zinc-800">
            {segments.map((segment, segIdx) => {
                if (segment.startsWith('```') && segment.endsWith('```')) {
                    const rawCode = segment
                        .slice(3, -3)
                        .replace(/^[a-zA-Z0-9_-]+\n/, '');
                    return (
                        <pre
                            key={segIdx}
                            className="overflow-x-auto border-2 border-zinc-900 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-amber-300 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                        >
                            <code>{rawCode.trim()}</code>
                        </pre>
                    );
                }

                const lines = segment.split('\n');
                const elements: React.ReactNode[] = [];
                let listItems: string[] = [];

                const flushList = (keyPrefix: string) => {
                    if (listItems.length > 0) {
                        elements.push(
                            <ul
                                key={`${keyPrefix}-list`}
                                className="ml-5 list-disc space-y-1 font-medium text-zinc-800"
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
                                className="border-l-4 border-zinc-900 bg-amber-50/90 px-3 py-2 font-medium italic text-zinc-800"
                            >
                                {renderInlineMarkdown(trimmed.slice(2))}
                            </blockquote>,
                        );
                        return;
                    }

                    if (trimmed.startsWith('### ')) {
                        elements.push(
                            <h4
                                key={`${segIdx}-${lineIdx}`}
                                className="text-sm font-black tracking-tight text-zinc-950 uppercase"
                            >
                                {renderInlineMarkdown(trimmed.slice(4))}
                            </h4>,
                        );
                        return;
                    }

                    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                        const cleanHeading = trimmed.replace(/^#+\s+/, '');
                        elements.push(
                            <h3
                                key={`${segIdx}-${lineIdx}`}
                                className="text-base font-black tracking-tight text-zinc-950"
                            >
                                {renderInlineMarkdown(cleanHeading)}
                            </h3>,
                        );
                        return;
                    }

                    elements.push(
                        <p key={`${segIdx}-${lineIdx}`} className="break-words">
                            {renderInlineMarkdown(line)}
                        </p>,
                    );
                });

                flushList(`${segIdx}-end`);

                return <div key={segIdx} className="space-y-2">{elements}</div>;
            })}
        </div>
    );
}

export default function CommunityRadarIndex({
    alerts: initialAlerts,
    rooms: initialRooms = [],
    dailyRoomQuota: initialQuota = { used: 0, max: 3, remaining: 3 },
    realtimeConfig,
    filters,
    stats,
}: RadarPageProps) {
    const { auth } = usePage<{ props: SharedAuthProps }>().props as unknown as SharedAuthProps;
    const currentUser = auth?.user ?? null;

    // Navigation between Community Discussion Rooms & Threat Radar Reports
    const [activeSection, setActiveSection] = useState<'discussions' | 'radar'>(
        'discussions',
    );

    // Real-time discussion rooms state
    const [rooms, setRooms] = useState<CommunityRoomItem[]>(initialRooms);
    const [activeRoomId, setActiveRoomId] = useState<number | null>(
        initialRooms[0]?.id ?? null,
    );
    const [roomSearch, setRoomSearch] = useState('');
    const [dailyQuota, setDailyQuota] = useState<DailyRoomQuota>(initialQuota);

    // Real-time connection status
    const [wsConnected, setWsConnected] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string>(() =>
        new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }),
    );

    // Room creation modal state
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
    const [newRoomForm, setNewRoomForm] = useState({
        title: '',
        category: 'apk_malware',
        description: '',
    });
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [roomError, setRoomError] = useState<string | null>(null);
    const [roomSuccessBanner, setRoomSuccessBanner] = useState<string | null>(
        null,
    );

    // Message composer state (Markdown + Image)
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

    // Reaction popover & keyboard emoji input state
    const [openReactionMessageId, setOpenReactionMessageId] = useState<
        number | null
    >(null);
    const [keyboardEmojiInput, setKeyboardEmojiInput] = useState('');
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(
        null,
    );

    // Radar Alerts state
    const [alerts, setAlerts] = useState<RadarAlert[]>(initialAlerts);
    const [upvotedIds, setUpvotedIds] = useState<number[]>([]);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [reportForm, setReportForm] = useState({
        title: '',
        category: 'apk_malware',
        platform: 'WhatsApp',
        location: '',
        description: '',
        evidence_text: '',
    });

    useEffect(() => {
        setAlerts(initialAlerts);
    }, [initialAlerts]);

    const activeRoom = useMemo(
        () => rooms.find((r) => r.id === activeRoomId) ?? rooms[0] ?? null,
        [rooms, activeRoomId],
    );

    const filteredRooms = useMemo(() => {
        if (!roomSearch.trim()) {
            return rooms;
        }
        const q = roomSearch.toLowerCase();
        return rooms.filter(
            (r) =>
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.creator.name.toLowerCase().includes(q),
        );
    }, [rooms, roomSearch]);

    // Merge incoming message into rooms state without duplicates
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

    // Merge updated reactions into a message
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

    // 1. Laravel Reverb WebSocket connection (Pusher protocol v7 compatible)
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

        try {
            const wsUrl = `${wsProtocol}://${host}:${port}/app/${appKey}?protocol=7&client=js&version=8.4.0&flash=false`;
            socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                setWsConnected(true);
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
                    const parsedData =
                        typeof payload.data === 'string'
                            ? JSON.parse(payload.data)
                            : payload.data;

                    if (
                        eventName.endsWith('room.created') &&
                        parsedData?.room
                    ) {
                        const createdRoom: CommunityRoomItem = parsedData.room;
                        setRooms((prev) =>
                            prev.some((r) => r.id === createdRoom.id)
                                ? prev
                                : [createdRoom, ...prev],
                        );
                        setLastSyncTime(
                            new Date().toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            }),
                        );
                    } else if (
                        eventName.endsWith('message.sent') &&
                        parsedData?.message
                    ) {
                        mergeMessageIntoRoom(
                            Number(parsedData.room_id),
                            parsedData.message,
                        );
                        setLastSyncTime(
                            new Date().toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            }),
                        );
                    } else if (
                        eventName.endsWith('message.reacted') &&
                        parsedData?.reactions
                    ) {
                        mergeReactionsIntoMessage(
                            Number(parsedData.room_id),
                            Number(parsedData.message_id),
                            parsedData.reactions,
                        );
                        setLastSyncTime(
                            new Date().toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            }),
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
                    }
                } catch {
                    // Ignore malformed frames
                }
            };

            socket.onerror = () => {
                setWsConnected(false);
            };

            socket.onclose = () => {
                setWsConnected(false);
            };
        } catch {
            setWsConnected(false);
        }

        return () => {
            if (socket && socket.readyState <= 1) {
                socket.close();
            }
        };
    }, [
        realtimeConfig,
        mergeMessageIntoRoom,
        mergeReactionsIntoMessage,
    ]);

    // 2. Real-time Delta Sync Engine (ensures zero-config real-time synchronization)
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
                    setRooms((prevRooms) => {
                        return data.rooms.map((incomingRoom: CommunityRoomItem) => {
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
                        });
                    });
                }
                if (data.daily_room_quota) {
                    setDailyQuota(data.daily_room_quota);
                }
                setLastSyncTime(
                    new Date().toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }),
                );
            } catch {
                // Silent background sync
            }
        }, 3000);

        return () => window.clearInterval(interval);
    }, [activeRoom?.id]);

    // Fetch full messages when switching to a room whose messages aren't loaded yet
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

    // Insert Markdown syntax helper
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

    // Handle image selection or clipboard paste
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
        const objectUrl = URL.createObjectURL(file);
        setSelectedImagePreview(objectUrl);
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

    // Create a new discussion room (enforcing max 3 rooms/day)
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
                    'X-CSRF-TOKEN': getCsrfToken(),
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

            setRoomSuccessBanner(data.message);
            setNewRoomForm({
                title: '',
                category: 'apk_malware',
                description: '',
            });
            setIsCreateRoomOpen(false);
            setTimeout(() => setRoomSuccessBanner(null), 5000);
        } catch {
            setRoomError('Terjadi kesalahan jaringan saat membuat ruang diskusi.');
        } finally {
            setIsCreatingRoom(false);
        }
    };

    // Send a message (Markdown text and/or image upload)
    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!activeRoom || isSendingMessage) {
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
                        'X-CSRF-TOKEN': getCsrfToken(),
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

    // Toggle Like or Emoji Reaction (from quick picker or OS keyboard)
    const handleToggleReaction = async (messageId: number, emoji: string) => {
        if (!currentUser || !activeRoom) {
            return;
        }

        const cleanEmoji = emoji.trim();
        if (!cleanEmoji) {
            return;
        }

        try {
            const res = await fetch(`/radar/messages/${messageId}/reactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ emoji: cleanEmoji }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.reactions) {
                    mergeReactionsIntoMessage(
                        Number(data.room_id || activeRoom.id),
                        messageId,
                        data.reactions,
                    );
                }
            }
        } catch {
            // Silent error
        }
    };

    const applyFilter = (nextParams: Partial<RadarPageProps['filters']>) => {
        router.get(
            '/radar',
            {
                category: nextParams.category ?? filters.category,
                platform: nextParams.platform ?? filters.platform,
                sort: nextParams.sort ?? filters.sort,
                search: nextParams.search ?? searchInput,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilter({ search: searchInput });
    };

    const handleUpvote = async (alertId: number) => {
        if (upvotedIds.includes(alertId)) {
            return;
        }

        setUpvotedIds((prev) => [...prev, alertId]);
        setAlerts((prev) =>
            prev.map((a) =>
                a.id === alertId
                    ? { ...a, upvotes_count: a.upvotes_count + 1 }
                    : a,
            ),
        );

        try {
            await fetch(`/radar/${alertId}/upvote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
        } catch {
            // Keep optimistic update
        }
    };

    const handleReportSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitSuccess(null);

        try {
            const res = await fetch('/radar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(reportForm),
            });

            const data = await res.json();
            if (res.ok) {
                setSubmitSuccess(data.message);
                setReportForm({
                    title: '',
                    category: 'apk_malware',
                    platform: 'WhatsApp',
                    location: '',
                    description: '',
                    evidence_text: '',
                });
                router.reload({ only: ['alerts', 'stats'] });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Komunitas & Ruang Diskusi Real-Time — Cekara" />

            <div className="min-h-screen bg-[#FAFAFA] font-sans text-zinc-900 selection:bg-amber-300 selection:text-zinc-950">
                {/* Hero Banner */}
                <section className="border-b-4 border-zinc-900 bg-amber-300 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                            <div className="space-y-3">
                                <div className=" flex flex-wrap items-center gap-2">
                                    <div className="inline-flex items-center gap-2 border-2 border-zinc-900 bg-zinc-900 px-3 py-1 text-xs font-black tracking-widest text-amber-300 uppercase">
                                        <Radio className="size-4 animate-pulse text-red-400" />
                                        KOMUNITAS GUARDIAN REAL-TIME
                                    </div>
                                    <div className="inline-flex items-center gap-2 border-2 border-zinc-900 bg-white px-3 py-1 text-xs font-black tracking-wider text-zinc-900 uppercase shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                                        <span className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
                                        <Wifi className="size-3.5 text-emerald-700" />
                                        <span>
                                            {wsConnected
                                                ? 'Laravel Reverb WebSocket Aktif'
                                                : 'Sinkronisasi Real-Time Aktif'}{' '}
                                            • {lastSyncTime}
                                        </span>
                                    </div>
                                </div>

                                <h1 className="text-3xl font-black tracking-tight text-zinc-950 uppercase sm:text-5xl">
                                    Ruang Diskusi & Radar Komunitas
                                </h1>
                                <p className="max-w-3xl text-base font-medium text-zinc-800 sm:text-lg">
                                    Berdiskusi secara real-time bersama sesama warganet, kirim peringatan berformat{' '}
                                    <span className="font-black underline">Markdown</span>, unggah tangkapan layar bukti penipuan, dan berikan reaksi emoji langsung dari keyboard Anda.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {currentUser ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRoomError(null);
                                            setIsCreateRoomOpen(true);
                                        }}
                                        disabled={dailyQuota.remaining <= 0}
                                        className="inline-flex items-center gap-2 border-4 border-zinc-900 bg-zinc-900 px-5 py-3.5 text-xs font-black tracking-wider text-amber-300 uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <MessageSquarePlus className="size-4" />
                                        Buat Ruang Diskusi ({dailyQuota.remaining}/{dailyQuota.max} Tersisa Hari Ini)
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 border-4 border-zinc-900 bg-zinc-900 px-5 py-3.5 text-xs font-black tracking-wider text-amber-300 uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all hover:-translate-y-0.5 hover:bg-zinc-800"
                                    >
                                        <Lock className="size-4" />
                                        Masuk untuk Buat Ruang Diskusi
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSubmitSuccess(null);
                                        setIsReportOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 border-4 border-zinc-900 bg-red-600 px-5 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all hover:-translate-y-0.5 hover:bg-red-700"
                                >
                                    <Plus className="size-4" />
                                    Laporkan Modus Baru
                                </button>
                            </div>
                        </div>

                        {/* Top Stats Strip */}
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                            <div className="border-4 border-zinc-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                                <p className="text-xs font-black tracking-wider text-zinc-500 uppercase">
                                    Ruang Diskusi Aktif
                                </p>
                                <p className="mt-1 text-2xl font-black text-zinc-950">
                                    {rooms.length} Ruang
                                </p>
                            </div>
                            <div className="border-4 border-zinc-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                                <p className="text-xs font-black tracking-wider text-zinc-500 uppercase">
                                    Kuota Buat Ruang Hari Ini
                                </p>
                                <p className="mt-1 text-2xl font-black text-emerald-700">
                                    {currentUser
                                        ? `${dailyQuota.remaining} / ${dailyQuota.max} Ruang`
                                        : 'Maks 3 / Hari'}
                                </p>
                            </div>
                            <div className="border-4 border-zinc-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                                <p className="text-xs font-black tracking-wider text-zinc-500 uppercase">
                                    Total Konfirmasi Korban
                                </p>
                                <p className="mt-1 text-2xl font-black text-red-600">
                                    {stats.total_confirmed_cases.toLocaleString(
                                        'id-ID',
                                    )}+ Warga
                                </p>
                            </div>
                            <div className="border-4 border-zinc-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                                <p className="text-xs font-black tracking-wider text-zinc-500 uppercase">
                                    Platform Paling Rawan
                                </p>
                                <p className="mt-1 text-2xl font-black text-zinc-950">
                                    {stats.top_targeted_platform}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content Container */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {roomSuccessBanner && (
                        <div className="mb-6 flex items-center justify-between border-4 border-zinc-900 bg-emerald-300 p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="size-6 shrink-0 text-zinc-900" />
                                <p className="text-sm font-black text-zinc-900">
                                    {roomSuccessBanner}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRoomSuccessBanner(null)}
                                className="border-2 border-zinc-900 bg-white p-1 font-black"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    )}

                    {/* Section Switcher Tabs */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-4 border-zinc-900 pb-4">
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveSection('discussions')}
                                className={`inline-flex items-center gap-2 border-4 border-zinc-900 px-5 py-3 text-xs font-black tracking-wider uppercase transition-all ${
                                    activeSection === 'discussions'
                                        ? 'bg-zinc-900 text-amber-300 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]'
                                        : 'bg-white text-zinc-900 hover:bg-zinc-100'
                                }`}
                            >
                                <MessageSquare className="size-4" />
                                Ruang Diskusi Real-Time ({rooms.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSection('radar')}
                                className={`inline-flex items-center gap-2 border-4 border-zinc-900 px-5 py-3 text-xs font-black tracking-wider uppercase transition-all ${
                                    activeSection === 'radar'
                                        ? 'bg-zinc-900 text-amber-300 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]'
                                        : 'bg-white text-zinc-900 hover:bg-zinc-100'
                                }`}
                            >
                                <ShieldAlert className="size-4" />
                                Radar Laporan Terverifikasi ({alerts.length})
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                            <Keyboard className="size-4 text-zinc-900" />
                            <span>
                                Tips: Tekan{' '}
                                <kbd className="border border-zinc-900 bg-amber-100 px-1.5 py-0.5 font-mono font-black text-zinc-900">
                                    Win + .
                                </kbd>{' '}
                                atau{' '}
                                <kbd className="border border-zinc-900 bg-amber-100 px-1.5 py-0.5 font-mono font-black text-zinc-900">
                                    Cmd + Ctrl + Space
                                </kbd>{' '}
                                untuk ketik emoji langsung dari keyboard!
                            </span>
                        </div>
                    </div>

                    {/* SECTION 1: REAL-TIME DISCUSSION ROOMS */}
                    {activeSection === 'discussions' && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            {/* Left Column: Rooms List & Daily Quota Card */}
                            <div className="space-y-4 lg:col-span-4">
                                {/* Daily Quota Card */}
                                <div className="border-4 border-zinc-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black tracking-wider text-zinc-900 uppercase">
                                            Kuota Ruang Diskusi Harian
                                        </span>
                                        <span className="border-2 border-zinc-900 bg-amber-300 px-2 py-0.5 text-xs font-black text-zinc-950">
                                            Maks {dailyQuota.max} / Hari
                                        </span>
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
                                                            className={`h-3 flex-1 border-2 border-zinc-900 ${
                                                                isUsed
                                                                    ? 'bg-zinc-900'
                                                                    : 'bg-emerald-400'
                                                            }`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <p className="mt-2 text-xs font-bold text-zinc-600">
                                                Terpakai hari ini:{' '}
                                                <strong className="text-zinc-950">
                                                    {dailyQuota.used} dari{' '}
                                                    {dailyQuota.max} ruang
                                                </strong>{' '}
                                                ({dailyQuota.remaining} tersisa).
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRoomError(null);
                                                    setIsCreateRoomOpen(true);
                                                }}
                                                disabled={
                                                    dailyQuota.remaining <= 0
                                                }
                                                className="mt-3 flex w-full items-center justify-center gap-2 border-2 border-zinc-900 bg-amber-300 px-3 py-2.5 text-xs font-black tracking-wider text-zinc-950 uppercase shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                                            >
                                                <Plus className="size-4" />
                                                {dailyQuota.remaining > 0
                                                    ? 'Buat Ruang Diskusi Baru'
                                                    : 'Batas Harian Tercapai (3/3)'}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-zinc-600">
                                                Pengguna yang sudah login dapat membuat hingga{' '}
                                                <strong>3 ruang diskusi per hari</strong>, mengirim pesan Markdown & gambar, serta memberi reaksi.
                                            </p>
                                            <Link
                                                href="/login"
                                                className="inline-flex w-full items-center justify-center gap-2 border-2 border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-black text-amber-300 uppercase"
                                            >
                                                Masuk Akun Sekarang
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Search Rooms */}
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={roomSearch}
                                        onChange={(e) =>
                                            setRoomSearch(e.target.value)
                                        }
                                        placeholder="Cari topik ruang diskusi..."
                                        className="w-full border-4 border-zinc-900 bg-white py-2.5 pr-4 pl-10 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                                    />
                                </div>

                                {/* Rooms List */}
                                <div className="space-y-3">
                                    {filteredRooms.map((room) => {
                                        const isSelected =
                                            activeRoom?.id === room.id;
                                        const catInfo = CATEGORY_MAP[
                                            room.category
                                        ] || {
                                            label: 'Diskusi Umum',
                                            badgeClass:
                                                'bg-zinc-100 text-zinc-900 border-zinc-900',
                                        };

                                        return (
                                            <button
                                                key={room.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectRoom(room)
                                                }
                                                className={`w-full border-4 border-zinc-900 p-4 text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-amber-200 shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] -translate-y-0.5'
                                                        : 'bg-white shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:bg-zinc-50'
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-black uppercase ${catInfo.badgeClass}`}
                                                    >
                                                        <Hash className="size-3" />
                                                        {catInfo.label}
                                                    </span>
                                                    {room.is_pinned && (
                                                        <span className="inline-flex items-center gap-1 border border-zinc-900 bg-zinc-900 px-2 py-0.5 text-[10px] font-black text-amber-300 uppercase">
                                                            <Pin className="size-3" />
                                                            Disematkan
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="mt-2 line-clamp-2 text-sm font-black text-zinc-950">
                                                    {room.title}
                                                </h3>

                                                <p className="mt-1 line-clamp-2 text-xs font-medium text-zinc-600">
                                                    {room.description}
                                                </p>

                                                <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-zinc-300 pt-2 text-[11px] font-bold text-zinc-600">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="size-3.5 text-zinc-900" />
                                                        {room.creator.name}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 font-black text-zinc-900">
                                                        <MessageSquare className="size-3.5" />
                                                        {room.messages_count}{' '}
                                                        pesan
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Column: Active Room Live Chat & Markdown Composer */}
                            <div className="lg:col-span-8">
                                {activeRoom ? (
                                    <div className="flex flex-col border-4 border-zinc-900 bg-white shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
                                        {/* Active Room Header */}
                                        <div className="border-b-4 border-zinc-900 bg-zinc-900 p-4 text-white sm:p-5">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="border-2 border-amber-300 bg-amber-300 px-2.5 py-0.5 text-xs font-black text-zinc-950 uppercase">
                                                        {CATEGORY_MAP[
                                                            activeRoom.category
                                                        ]?.label ||
                                                            activeRoom.category}
                                                    </span>
                                                    <span className="text-xs font-bold text-zinc-300">
                                                        Dibuat oleh{' '}
                                                        <strong className="text-white">
                                                            {
                                                                activeRoom
                                                                    .creator
                                                                    .name
                                                            }
                                                        </strong>{' '}
                                                        •{' '}
                                                        {
                                                            activeRoom.created_at_human
                                                        }
                                                    </span>
                                                </div>

                                                <span className="inline-flex items-center gap-1.5 border border-emerald-400/50 bg-emerald-950 px-2.5 py-1 text-[11px] font-black text-emerald-300 uppercase">
                                                    <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                                                    Real-Time Stream
                                                </span>
                                            </div>

                                            <h2 className="mt-2 text-lg font-black tracking-tight text-white sm:text-xl">
                                                {activeRoom.title}
                                            </h2>
                                            <p className="mt-1 text-xs font-medium text-zinc-300 sm:text-sm">
                                                {activeRoom.description}
                                            </p>
                                        </div>

                                        {/* Messages Stream */}
                                        <div className="max-h-[560px] min-h-[380px] space-y-4 overflow-y-auto bg-[#F8F8F5] p-4 sm:p-6">
                                            {activeRoom.messages.length ===
                                            0 ? (
                                                <div className="py-12 text-center">
                                                    <MessageSquare className="mx-auto size-10 text-zinc-400" />
                                                    <p className="mt-2 text-sm font-black text-zinc-700 uppercase">
                                                        Belum ada pesan di ruang diskusi ini
                                                    </p>
                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        Jadilah yang pertama mengirim informasi atau tangkapan layar!
                                                    </p>
                                                </div>
                                            ) : (
                                                activeRoom.messages.map(
                                                    (msg) => {
                                                        const isOwnMessage =
                                                            currentUser?.id ===
                                                            msg.user.id;
                                                        const likeReaction =
                                                            msg.reactions.find(
                                                                (r) =>
                                                                    r.emoji ===
                                                                    '👍',
                                                            );
                                                        const hasLiked =
                                                            currentUser
                                                                ? (likeReaction?.user_ids.includes(
                                                                      currentUser.id,
                                                                  ) ?? false)
                                                                : false;

                                                        return (
                                                            <div
                                                                key={msg.id}
                                                                className={`border-3 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all ${
                                                                    isOwnMessage
                                                                        ? 'bg-amber-50'
                                                                        : 'bg-white'
                                                                }`}
                                                            >
                                                                {/* Message Author Header */}
                                                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex size-7 items-center justify-center border-2 border-zinc-900 bg-amber-300 text-xs font-black text-zinc-950 uppercase">
                                                                            {msg.user.name
                                                                                .charAt(
                                                                                    0,
                                                                                )
                                                                                .toUpperCase()}
                                                                        </div>
                                                                        <span className="text-xs font-black text-zinc-950">
                                                                            {
                                                                                msg
                                                                                    .user
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                        {msg
                                                                            .user
                                                                            .is_admin && (
                                                                            <span className="inline-flex items-center gap-1 border border-zinc-900 bg-emerald-300 px-1.5 py-0.5 text-[10px] font-black text-zinc-950 uppercase">
                                                                                <ShieldCheck className="size-3" />
                                                                                Moderator
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-zinc-500">
                                                                        {
                                                                            msg.created_at_human
                                                                        }{' '}
                                                                        ({
                                                                            msg.created_at_time
                                                                        })
                                                                    </span>
                                                                </div>

                                                                {/* Markdown Body */}
                                                                {msg.body && (
                                                                    <MarkdownRenderer
                                                                        content={
                                                                            msg.body
                                                                        }
                                                                    />
                                                                )}

                                                                {/* Attached Image */}
                                                                {msg.image_url && (
                                                                    <div className="mt-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setLightboxImageUrl(
                                                                                    msg.image_url,
                                                                                )
                                                                            }
                                                                            className="group relative block overflow-hidden border-2 border-zinc-900 bg-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                                                                        >
                                                                            <img
                                                                                src={
                                                                                    msg.image_url
                                                                                }
                                                                                alt="Lampiran bukti komunitas"
                                                                                className="max-h-72 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                                                                            />
                                                                            <span className="block bg-zinc-900 px-2.5 py-1 text-[10px] font-black text-amber-300 uppercase">
                                                                                Klik untuk perbesar gambar
                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {/* Likes & Emoji Reactions Bar */}
                                                                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
                                                                    {/* Direct Like Button */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            !currentUser
                                                                        }
                                                                        onClick={() =>
                                                                            handleToggleReaction(
                                                                                msg.id,
                                                                                '👍',
                                                                            )
                                                                        }
                                                                        title={
                                                                            currentUser
                                                                                ? 'Berikan Suka (👍)'
                                                                                : 'Login untuk menyukai pesan'
                                                                        }
                                                                        className={`inline-flex items-center gap-1.5 border-2 border-zinc-900 px-2.5 py-1 text-xs font-black transition-all ${
                                                                            hasLiked
                                                                                ? 'bg-emerald-300 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                                                                                : 'bg-white text-zinc-800 hover:bg-amber-100'
                                                                        } disabled:cursor-not-allowed disabled:opacity-60`}
                                                                    >
                                                                        <ThumbsUp className="size-3.5" />
                                                                        <span>
                                                                            Suka
                                                                        </span>
                                                                        {likeReaction &&
                                                                            likeReaction.count >
                                                                                0 && (
                                                                                <span className="ml-0.5 rounded bg-zinc-900 px-1.5 py-0.2 text-[10px] text-white">
                                                                                    {
                                                                                        likeReaction.count
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                    </button>

                                                                    {/* Other Active Reaction Pills */}
                                                                    {msg.reactions
                                                                        .filter(
                                                                            (
                                                                                r,
                                                                            ) =>
                                                                                r.emoji !==
                                                                                '👍',
                                                                        )
                                                                        .map(
                                                                            (
                                                                                reaction,
                                                                            ) => {
                                                                                const userReacted =
                                                                                    currentUser
                                                                                        ? reaction.user_ids.includes(
                                                                                              currentUser.id,
                                                                                          )
                                                                                        : false;
                                                                                return (
                                                                                    <button
                                                                                        key={
                                                                                            reaction.emoji
                                                                                        }
                                                                                        type="button"
                                                                                        disabled={
                                                                                            !currentUser
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleToggleReaction(
                                                                                                msg.id,
                                                                                                reaction.emoji,
                                                                                            )
                                                                                        }
                                                                                        className={`inline-flex items-center gap-1 border-2 border-zinc-900 px-2.5 py-1 text-xs font-black transition-all ${
                                                                                            userReacted
                                                                                                ? 'bg-amber-300 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                                                                                                : 'bg-white text-zinc-800 hover:bg-zinc-100'
                                                                                        } disabled:cursor-not-allowed`}
                                                                                    >
                                                                                        <span>
                                                                                            {
                                                                                                reaction.emoji
                                                                                            }
                                                                                        </span>
                                                                                        <span>
                                                                                            {
                                                                                                reaction.count
                                                                                            }
                                                                                        </span>
                                                                                    </button>
                                                                                );
                                                                            },
                                                                        )}

                                                                    {/* Open Emoji Picker & Keyboard Emoji Input */}
                                                                    {currentUser && (
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
                                                                                className="inline-flex items-center gap-1 border-2 border-dashed border-zinc-900 bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-800 hover:bg-amber-200"
                                                                            >
                                                                                <Smile className="size-3.5" />
                                                                                <span>
                                                                                    + Reaksi / Keyboard
                                                                                </span>
                                                                            </button>

                                                                            {openReactionMessageId ===
                                                                                msg.id && (
                                                                                <div className="absolute bottom-full left-0 z-30 mb-2 w-72 border-4 border-zinc-900 bg-white p-3 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
                                                                                    <div className="mb-2 flex items-center justify-between">
                                                                                        <span className="text-[10px] font-black tracking-wider text-zinc-600 uppercase">
                                                                                            Pilih Cepat atau Ketik Keyboard
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                setOpenReactionMessageId(
                                                                                                    null,
                                                                                                )
                                                                                            }
                                                                                            className="text-zinc-500 hover:text-zinc-900"
                                                                                        >
                                                                                            <X className="size-3.5" />
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Quick Reaction Grid */}
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
                                                                                                    className="border-2 border-zinc-900 bg-zinc-50 py-1.5 text-base hover:bg-amber-300"
                                                                                                >
                                                                                                    {
                                                                                                        emoji
                                                                                                    }
                                                                                                </button>
                                                                                            ),
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Direct OS Keyboard Emoji Input */}
                                                                                    <div className="mt-2.5 border-t-2 border-zinc-200 pt-2">
                                                                                        <label className="block text-[10px] font-black text-zinc-700 uppercase">
                                                                                            Ketik Emoji dari Keyboard (Win + .)
                                                                                        </label>
                                                                                        <div className="mt-1 flex gap-1.5">
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
                                                                                                placeholder="Ketik emoji apa saja..."
                                                                                                maxLength={
                                                                                                    16
                                                                                                }
                                                                                                className="w-full border-2 border-zinc-900 px-2 py-1 text-xs font-bold focus:bg-amber-50 focus:outline-none"
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
                                                                                                className="border-2 border-zinc-900 bg-zinc-900 px-2.5 py-1 text-[10px] font-black text-amber-300 uppercase"
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
                                                    },
                                                )
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Markdown & Image Message Composer */}
                                        <div className="border-t-4 border-zinc-900 bg-white p-4 sm:p-5">
                                            {currentUser ? (
                                                <form
                                                    onSubmit={handleSendMessage}
                                                    className="space-y-3"
                                                >
                                                    {/* Markdown Formatting Toolbar */}
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-zinc-900 bg-zinc-100 p-2">
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    insertMarkdownSyntax(
                                                                        '**',
                                                                        '**',
                                                                        'teks tebal',
                                                                    )
                                                                }
                                                                title="Tebal (**teks**)"
                                                                className="inline-flex items-center gap-1 border border-zinc-900 bg-white px-2 py-1 text-xs font-black hover:bg-amber-200"
                                                            >
                                                                <Bold className="size-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    insertMarkdownSyntax(
                                                                        '*',
                                                                        '*',
                                                                        'teks miring',
                                                                    )
                                                                }
                                                                title="Miring (*teks*)"
                                                                className="inline-flex items-center gap-1 border border-zinc-900 bg-white px-2 py-1 text-xs font-black hover:bg-amber-200"
                                                            >
                                                                <Italic className="size-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    insertMarkdownSyntax(
                                                                        '`',
                                                                        '`',
                                                                        'nomor/rekening/domain',
                                                                    )
                                                                }
                                                                title="Kode Inline (`kode`)"
                                                                className="inline-flex items-center gap-1 border border-zinc-900 bg-white px-2 py-1 text-xs font-black hover:bg-amber-200"
                                                            >
                                                                <Code className="size-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    insertMarkdownSyntax(
                                                                        '\n> ',
                                                                        '',
                                                                        'Kutipan pesan penipu',
                                                                    )
                                                                }
                                                                title="Kutipan (> teks)"
                                                                className="inline-flex items-center gap-1 border border-zinc-900 bg-white px-2 py-1 text-xs font-black hover:bg-amber-200"
                                                            >
                                                                <Quote className="size-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    insertMarkdownSyntax(
                                                                        '\n- ',
                                                                        '',
                                                                        'Poin peringatan',
                                                                    )
                                                                }
                                                                title="Daftar Poin (- item)"
                                                                className="inline-flex items-center gap-1 border border-zinc-900 bg-white px-2 py-1 text-xs font-black hover:bg-amber-200"
                                                            >
                                                                <List className="size-3.5" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    fileInputRef.current?.click()
                                                                }
                                                                className="ml-1 inline-flex items-center gap-1.5 border-2 border-zinc-900 bg-amber-300 px-2.5 py-1 text-xs font-black text-zinc-950 hover:bg-amber-400"
                                                            >
                                                                <ImageIcon className="size-3.5" />
                                                                <span>
                                                                    Unggah Gambar
                                                                </span>
                                                            </button>
                                                            <input
                                                                ref={
                                                                    fileInputRef
                                                                }
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
                                                            className={`inline-flex items-center gap-1 border-2 border-zinc-900 px-2.5 py-1 text-xs font-black uppercase ${
                                                                isMarkdownPreview
                                                                    ? 'bg-zinc-900 text-amber-300'
                                                                    : 'bg-white text-zinc-900'
                                                            }`}
                                                        >
                                                            <Eye className="size-3.5" />
                                                            {isMarkdownPreview
                                                                ? 'Mode Edit'
                                                                : 'Pratinjau Markdown'}
                                                        </button>
                                                    </div>

                                                    {/* Image Attachment Preview */}
                                                    {selectedImagePreview && (
                                                        <div className="flex items-center justify-between border-2 border-zinc-900 bg-amber-50 p-2.5">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={
                                                                        selectedImagePreview
                                                                    }
                                                                    alt="Pratinjau lampiran"
                                                                    className="h-14 w-14 border-2 border-zinc-900 object-cover"
                                                                />
                                                                <div>
                                                                    <p className="text-xs font-black text-zinc-900">
                                                                        {
                                                                            selectedImage?.name
                                                                        }
                                                                    </p>
                                                                    <p className="text-[11px] font-medium text-zinc-600">
                                                                        Siap dikirim ke ruang diskusi
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleImageFile(
                                                                        null,
                                                                    )
                                                                }
                                                                className="border-2 border-zinc-900 bg-red-600 p-1 text-white"
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Textarea or Live Markdown Preview */}
                                                    {isMarkdownPreview ? (
                                                        <div className="min-h-[96px] border-2 border-zinc-900 bg-amber-50/50 p-3">
                                                            {messageBody.trim() ? (
                                                                <MarkdownRenderer
                                                                    content={
                                                                        messageBody
                                                                    }
                                                                />
                                                            ) : (
                                                                <p className="text-xs italic text-zinc-400">
                                                                    Belum ada teks Markdown untuk ditampilkan...
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
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onPaste={
                                                                handlePasteImage
                                                            }
                                                            placeholder="Tulis pesan diskusi... Mendukung **Markdown**, `kode`, > kutipan, tempel gambar langsung (Ctrl+V), dan ketik emoji dari keyboard (Win + .)"
                                                            className="w-full border-2 border-zinc-900 p-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-amber-50/30 focus:outline-none"
                                                        />
                                                    )}

                                                    {messageError && (
                                                        <p className="text-xs font-black text-red-600">
                                                            {messageError}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-[11px] font-bold text-zinc-500">
                                                            Mendukung Markdown penuh & unggah gambar (JPG, PNG, WEBP maks 5MB).
                                                        </span>
                                                        <button
                                                            type="submit"
                                                            disabled={
                                                                isSendingMessage
                                                            }
                                                            className="inline-flex items-center gap-2 border-2 border-zinc-900 bg-zinc-900 px-5 py-2.5 text-xs font-black tracking-wider text-amber-300 uppercase shadow-[3px_3px_0px_0px_rgba(245,158,11,1)] transition-all hover:bg-zinc-800 disabled:opacity-50"
                                                        >
                                                            {isSendingMessage ? (
                                                                <Loader2 className="size-4 animate-spin" />
                                                            ) : (
                                                                <Send className="size-4" />
                                                            )}
                                                            Kirim Pesan Real-Time
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex flex-col items-center justify-between gap-3 border-2 border-dashed border-zinc-900 bg-amber-50 p-4 sm:flex-row">
                                                    <div className="flex items-center gap-3">
                                                        <Lock className="size-5 text-zinc-900" />
                                                        <p className="text-xs font-bold text-zinc-800">
                                                            Silakan masuk menggunakan akun terverifikasi untuk mengirim pesan Markdown, mengunggah gambar, dan memberi reaksi emoji.
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href="/login"
                                                        className="shrink-0 border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-black text-amber-300 uppercase"
                                                    >
                                                        Masuk / Daftar
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-4 border-zinc-900 bg-white p-12 text-center shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
                                        <p className="text-lg font-black text-zinc-800 uppercase">
                                            Pilih atau Buat Ruang Diskusi
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: VERIFIED THREAT RADAR ALERTS */}
                    {activeSection === 'radar' && (
                        <div>
                            {/* Filter & Search Bar */}
                            <div className="mb-8 border-4 border-zinc-900 bg-white p-4 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] sm:p-6">
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                                    <form
                                        onSubmit={handleSearchSubmit}
                                        className="flex gap-2 lg:col-span-5"
                                    >
                                        <div className="relative flex-1">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                value={searchInput}
                                                onChange={(e) =>
                                                    setSearchInput(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Cari modus, kota, atau kata kunci..."
                                                className="w-full border-2 border-zinc-900 py-2.5 pr-3 pl-9 text-sm font-bold text-zinc-900 placeholder:font-medium placeholder:text-zinc-400 focus:bg-amber-50 focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="border-2 border-zinc-900 bg-zinc-900 px-4 py-2.5 text-xs font-black tracking-wider text-white uppercase hover:bg-zinc-800"
                                        >
                                            Cari
                                        </button>
                                    </form>

                                    <div className="lg:col-span-4">
                                        <div className="flex items-center gap-2">
                                            <Filter className="size-4 shrink-0 text-zinc-700" />
                                            <select
                                                aria-label="Filter Kategori Modus"
                                                value={filters.category}
                                                onChange={(e) =>
                                                    applyFilter({
                                                        category:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full border-2 border-zinc-900 bg-white px-3 py-2.5 text-sm font-bold text-zinc-900 focus:bg-amber-50 focus:outline-none"
                                            >
                                                <option value="all">
                                                    Semua Kategori Modus
                                                </option>
                                                <option value="apk_malware">
                                                    Malware .APK / Sadap OTP
                                                </option>
                                                <option value="phishing_banking">
                                                    Phishing Bank & Dompet Digital
                                                </option>
                                                <option value="social_engineering">
                                                    Rekayasa Sosial / QRIS Palsu
                                                </option>
                                                <option value="fake_job">
                                                    Lowongan Kerja & Misi Fiktif
                                                </option>
                                                <option value="fake_giveaway">
                                                    Undian & Hadiah Palsu
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 lg:col-span-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                applyFilter({
                                                    sort: 'trending',
                                                })
                                            }
                                            className={`flex flex-1 items-center justify-center gap-1.5 border-2 border-zinc-900 px-3 py-2.5 text-xs font-black uppercase transition-colors ${
                                                filters.sort !== 'latest'
                                                    ? 'bg-amber-300 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                                                    : 'bg-white text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        >
                                            <Flame className="size-4" />
                                            Populer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                applyFilter({ sort: 'latest' })
                                            }
                                            className={`flex flex-1 items-center justify-center gap-1.5 border-2 border-zinc-900 px-3 py-2.5 text-xs font-black uppercase transition-colors ${
                                                filters.sort === 'latest'
                                                    ? 'bg-amber-300 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                                                    : 'bg-white text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        >
                                            <TrendingUp className="size-4" />
                                            Terbaru
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Radar Feed Grid */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {alerts.map((alert) => {
                                    const categoryInfo = CATEGORY_MAP[
                                        alert.category
                                    ] || {
                                        label: 'Modus Penipuan Umum',
                                        badgeClass:
                                            'bg-zinc-100 text-zinc-900 border-zinc-900',
                                        bgAccent: 'bg-zinc-800',
                                    };
                                    const hasUpvoted = upvotedIds.includes(
                                        alert.id,
                                    );

                                    return (
                                        <article
                                            key={alert.id}
                                            className="flex flex-col justify-between border-4 border-zinc-900 bg-white shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]"
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-zinc-900 bg-zinc-50 px-5 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 border-2 px-2.5 py-0.5 text-xs font-black uppercase ${categoryInfo.badgeClass}`}
                                                    >
                                                        <AlertTriangle className="size-3.5" />
                                                        {categoryInfo.label}
                                                    </span>
                                                    <span className="border-2 border-zinc-900 bg-white px-2.5 py-0.5 text-xs font-black text-zinc-900 uppercase">
                                                        Via: {alert.platform}
                                                    </span>
                                                </div>

                                                <div className="p-5">
                                                    <div className="mb-2 flex items-center gap-3 text-xs font-bold text-zinc-500">
                                                        {alert.location && (
                                                            <span className="inline-flex items-center gap-1 text-zinc-700">
                                                                <MapPin className="size-3.5 text-red-600" />
                                                                {alert.location}
                                                            </span>
                                                        )}
                                                        <span>
                                                            •{' '}
                                                            {
                                                                alert.created_at_human
                                                            }
                                                        </span>
                                                    </div>

                                                    <h2 className="text-lg font-black leading-snug text-zinc-950">
                                                        {alert.title}
                                                    </h2>

                                                    <p className="mt-2.5 text-sm leading-relaxed font-medium text-zinc-700">
                                                        {alert.description}
                                                    </p>

                                                    {alert.evidence_text && (
                                                        <div className="mt-4 border-2 border-dashed border-zinc-900 bg-amber-50/80 p-3.5">
                                                            <p className="text-[11px] font-black tracking-wider text-zinc-900 uppercase">
                                                                Contoh Pesan / Ciri Bukti Penipuan:
                                                            </p>
                                                            <p className="mt-1 font-mono text-xs leading-relaxed text-zinc-800 italic">
                                                                "
                                                                {
                                                                    alert.evidence_text
                                                                }
                                                                "
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t-4 border-zinc-900 bg-zinc-100 px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase">
                                                    <ShieldCheck className="size-4" />
                                                    Terverifikasi Guardian
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={hasUpvoted}
                                                    onClick={() =>
                                                        handleUpvote(alert.id)
                                                    }
                                                    className={`inline-flex items-center gap-2 border-2 border-zinc-900 px-3.5 py-1.5 text-xs font-black uppercase transition-all ${
                                                        hasUpvoted
                                                            ? 'bg-emerald-300 text-zinc-950'
                                                            : 'bg-white text-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:bg-amber-300'
                                                    }`}
                                                >
                                                    <ThumbsUp className="size-3.5" />
                                                    <span>
                                                        {hasUpvoted
                                                            ? 'Terkonfirmasi'
                                                            : 'Saya Juga Mengalami'}
                                                    </span>
                                                    <span className="ml-1 rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] text-white">
                                                        {alert.upvotes_count}
                                                    </span>
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal 1: Create New Discussion Room (Max 3/Day) */}
            {isCreateRoomOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsCreateRoomOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-lg border-4 border-zinc-900 bg-white p-0 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
                        <div className="flex items-start justify-between border-b-4 border-zinc-900 bg-amber-300 p-5">
                            <div>
                                <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-zinc-950 uppercase">
                                    <Sparkles className="size-5" />
                                    Buat Ruang Diskusi Komunitas Baru
                                </h3>
                                <p className="mt-1 text-xs font-bold text-zinc-800">
                                    Setiap pengguna dapat membuat maksimal 3 ruang diskusi per hari. Sisa kuota Anda hari ini:{' '}
                                    <strong>
                                        {dailyQuota.remaining} dari {dailyQuota.max} ruang
                                    </strong>
                                    .
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateRoomOpen(false)}
                                className="border-2 border-zinc-900 bg-white p-1 text-zinc-900 hover:bg-zinc-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRoom} className="space-y-4 p-6">
                            {roomError && (
                                <div className="border-2 border-zinc-900 bg-red-100 p-3 text-xs font-black text-red-900">
                                    {roomError}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                    Judul Ruang Diskusi *
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
                                    placeholder="Contoh: Waspada Nomor WA Mengaku Kurir Paket Kirim File .APK"
                                    className="w-full border-2 border-zinc-900 px-3 py-2 text-sm font-medium focus:bg-amber-50 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                    Kategori Ancaman *
                                </label>
                                <select
                                    value={newRoomForm.category}
                                    onChange={(e) =>
                                        setNewRoomForm({
                                            ...newRoomForm,
                                            category: e.target.value,
                                        })
                                    }
                                    className="w-full border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-bold focus:outline-none"
                                >
                                    <option value="apk_malware">
                                        Malware .APK / Sadap OTP
                                    </option>
                                    <option value="phishing_banking">
                                        Phishing Bank / Dompet Digital
                                    </option>
                                    <option value="social_engineering">
                                        Rekayasa Sosial / QRIS Palsu
                                    </option>
                                    <option value="fake_job">
                                        Lowongan Kerja & Misi Fiktif
                                    </option>
                                    <option value="fake_giveaway">
                                        Undian & Hadiah Palsu
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                    Pesan Pembuka & Deskripsi Topik (Mendukung Markdown) *
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
                                    placeholder="Tuliskan detail topik diskusi. Anda dapat memakai format **tebal**, `kode`, atau daftar poin..."
                                    className="w-full border-2 border-zinc-900 px-3 py-2 text-sm font-medium focus:bg-amber-50 focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    isCreatingRoom || dailyQuota.remaining <= 0
                                }
                                className="flex w-full items-center justify-center gap-2 border-4 border-zinc-900 bg-zinc-900 px-5 py-3 text-xs font-black tracking-wider text-amber-300 uppercase shadow-[4px_4px_0px_0px_rgba(245,158,11,1)] hover:bg-zinc-800 disabled:opacity-50"
                            >
                                {isCreatingRoom && (
                                    <Loader2 className="size-4 animate-spin" />
                                )}
                                Buka & Siarkan Ruang Diskusi Real-Time
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Image Lightbox */}
            {lightboxImageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setLightboxImageUrl(null)}
                    />
                    <div className="relative z-10 w-full max-w-3xl border-4 border-zinc-900 bg-zinc-950 p-4 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-black tracking-wider text-amber-300 uppercase">
                                Lampiran Bukti Gambar Komunitas
                            </span>
                            <button
                                type="button"
                                onClick={() => setLightboxImageUrl(null)}
                                className="border-2 border-amber-300 bg-zinc-900 p-1 text-amber-300"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="flex justify-center overflow-hidden">
                            <img
                                src={lightboxImageUrl}
                                alt="Bukti ukuran penuh"
                                className="max-h-[75vh] w-auto border-2 border-zinc-800 object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 3: Report New Scam Pattern */}
            {isReportOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsReportOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-lg border-4 border-zinc-900 bg-white p-0 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
                        <div className="flex items-start justify-between border-b-4 border-zinc-900 bg-amber-300 p-5">
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-zinc-950 uppercase">
                                    Laporkan Modus Penipuan Baru
                                </h3>
                                <p className="mt-1 text-xs font-bold text-zinc-800">
                                    Bantu lindungi warganet lain dengan membagikan modus penipuan yang baru Anda temui.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReportOpen(false)}
                                className="border-2 border-zinc-900 bg-white p-1 text-zinc-900 hover:bg-zinc-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="p-6">
                            {submitSuccess ? (
                                <div className="space-y-4 text-center">
                                    <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
                                    <p className="text-sm font-bold text-zinc-800">
                                        {submitSuccess}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsReportOpen(false)}
                                        className="w-full border-2 border-zinc-900 bg-zinc-900 py-2.5 text-xs font-black text-white uppercase"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleReportSubmit}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                            Judul Modus Penipuan *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={reportForm.title}
                                            onChange={(e) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    title: e.target.value,
                                                })
                                            }
                                            placeholder="Contoh: Pesan WA Tagihan Listrik PLN Palsu dengan File .APK"
                                            className="w-full border-2 border-zinc-900 px-3 py-2 text-sm font-medium focus:bg-amber-50 focus:outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                                Kategori *
                                            </label>
                                            <select
                                                value={reportForm.category}
                                                onChange={(e) =>
                                                    setReportForm({
                                                        ...reportForm,
                                                        category: e.target.value,
                                                    })
                                                }
                                                className="w-full border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-bold focus:outline-none"
                                            >
                                                <option value="apk_malware">
                                                    Malware .APK / Sadap OTP
                                                </option>
                                                <option value="phishing_banking">
                                                    Phishing Bank / Dompet Digital
                                                </option>
                                                <option value="social_engineering">
                                                    Rekayasa Sosial / QRIS Palsu
                                                </option>
                                                <option value="fake_job">
                                                    Lowongan Kerja Fiktif
                                                </option>
                                                <option value="fake_giveaway">
                                                    Undian Berhadiah Palsu
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                                Platform Penyebaran *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={reportForm.platform}
                                                onChange={(e) =>
                                                    setReportForm({
                                                        ...reportForm,
                                                        platform: e.target.value,
                                                    })
                                                }
                                                placeholder="WhatsApp, Telegram, SMS..."
                                                className="w-full border-2 border-zinc-900 px-3 py-2 text-sm font-medium focus:bg-amber-50 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                            Kota / Lokasi Kejadian (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={reportForm.location}
                                            onChange={(e) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    location: e.target.value,
                                                })
                                            }
                                            placeholder="Contoh: Jakarta Selatan / Seluruh Indonesia"
                                            className="w-full border-2 border-zinc-900 px-3 py-2 text-sm font-medium focus:bg-amber-50 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                            Kronologi / Cara Kerja Penipu *
                                        </label>
                                        <textarea
                                            required
                                            rows={3}
                                            minLength={10}
                                            value={reportForm.description}
                                            onChange={(e) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="Ceritakan bagaimana penipu menghubungi dan mengelabui korban..."
                                            className="w-full border-2 border-zinc-900 px-3 py-2 text-sm font-medium focus:bg-amber-50 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-black text-zinc-900 uppercase">
                                            Kutipan Teks Chat / Tautan Mencurigakan (Opsional)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={reportForm.evidence_text}
                                            onChange={(e) =>
                                                setReportForm({
                                                    ...reportForm,
                                                    evidence_text: e.target.value,
                                                })
                                            }
                                            placeholder="Tempelkan isi chat penipu (jangan sertakan data pribadi Anda)..."
                                            className="w-full border-2 border-zinc-900 px-3 py-2 font-mono text-xs focus:bg-amber-50 focus:outline-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex w-full items-center justify-center gap-2 border-4 border-zinc-900 bg-red-600 px-5 py-3 text-xs font-black tracking-wider text-white uppercase shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {isSubmitting && (
                                            <Loader2 className="size-4 animate-spin" />
                                        )}
                                        Kirim Laporan ke Radar Komunitas
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
