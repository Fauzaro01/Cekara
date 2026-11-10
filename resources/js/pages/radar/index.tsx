import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bold,
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
    Sparkles,
    ThumbsUp,
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
import type { Auth } from '@/types/auth';

interface SharedProps {
    auth?: Auth;
    [key: string]: unknown;
}

interface ThreatAlert {
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

interface Stats {
    total_alerts: number;
    total_confirmed_cases: number;
    top_targeted_platform: string;
}

interface Props {
    alerts: ThreatAlert[];
    rooms?: CommunityRoomItem[];
    dailyRoomQuota?: DailyRoomQuota;
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
            is_admin?: boolean;
        } | null;
    };
}

const categories = [
    { key: 'all', label: 'Semua Kategori' },
    { key: 'apk_malware', label: 'Malware APK' },
    { key: 'phishing_banking', label: 'Phishing Bank' },
    { key: 'fake_job', label: 'Lowongan Palsu' },
    { key: 'social_engineering', label: 'Rekayasa Sosial' },
    { key: 'fake_giveaway', label: 'Undian Palsu' },
];

const categoryBadgeLabel: Record<
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
    dailyRoomQuota: initialQuota = { used: 0, max: 3, remaining: 3 },
    realtimeConfig,
    filters,
}: Props) {
    const { auth } = usePage<{ props: SharedAuthProps }>().props as unknown as SharedAuthProps;
    const currentUser = auth?.user ?? null;

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

    // Create Room Modal State
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
    const [newRoomForm, setNewRoomForm] = useState({
        title: '',
        category: 'apk_malware',
        description: '',
    });
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [roomError, setRoomError] = useState<string | null>(null);

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
        return rooms.filter((r) => {
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
    }, [rooms, selectedCategory, roomSearch]);

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
        if (!currentUser || !activeRoom || pendingReactionByMsg[messageId]) {
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
        if (upvotedIds.includes(alertId)) {
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

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setIsSubmittingReport(true);

        try {
            const res = await fetch('/komunitas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify(reportForm),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(
                    data.message || 'Laporan modus kejahatan berhasil dikirim.'
                );
                setIsReportModalOpen(false);
                setReportForm({
                    title: '',
                    category: 'apk_malware',
                    platform: '',
                    location: '',
                    description: '',
                    evidence_text: '',
                });
                router.reload({ only: ['alerts', 'stats'] });
            } else {
                setFormError(
                    data.message ||
                        'Gagal mengirim laporan. Pastikan seluruh kolom wajib telah diisi dengan benar.'
                );
            }
        } catch {
            setFormError(
                'Terjadi kesalahan saat mengirim laporan. Silakan coba beberapa saat lagi.'
            );
        } finally {
            setIsSubmittingReport(false);
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

    return (
        <AppLayout>
            <Head title="Radar Ancaman & Diskusi Komunitas - Cekara" />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#FFF8EC] pt-8 pb-4 sm:pt-12 sm:pb-6">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <Badge variant="warn" withDot>
                                    Komunitas Guardian
                                </Badge>
                            </div>

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

                        {/* CTA Create Discussion Room (Max 3/Day) */}
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                            {currentUser ? (
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
                            ) : (
                                <Link
                                    href="/login"
                                    className={buttonClasses('primary', 'md')}
                                >
                                    <Lock className="size-4" />
                                    <span>Masuk untuk Buat Ruang Diskusi</span>
                                </Link>
                            )}
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
                        )}

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
                            {categories.map((c) => (
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
                            {/* Daily Quota Info Card */}
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
                                    const catMeta = categoryBadgeLabel[
                                        room.category
                                    ] ?? {
                                        label: 'Diskusi',
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
                                                {room.is_pinned && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-[#3B2A1E] bg-[#FFF8EC] px-2 py-0.5 text-[10px] font-extrabold text-[#3B2A1E]">
                                                        <Pin className="size-3 text-[#E06812]" />
                                                        Penting
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="mt-2 font-['Fredoka',system-ui,sans-serif] text-base font-bold leading-snug text-[#3B2A1E] line-clamp-2">
                                                {room.title}
                                            </h3>

                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed font-medium text-[#6B5646]">
                                                {room.description}
                                            </p>

                                            <div className="mt-3 flex items-center justify-between border-t border-[#EFE3D0] pt-2.5 text-[11px] font-bold text-[#6B5646]">
                                                <span className="inline-flex items-center gap-1 truncate">
                                                    <Users className="size-3.5 text-[#3B2A1E]" />
                                                    {room.creator.name}
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
                                        variant="subtle"
                                        className="py-10 text-center text-xs font-semibold text-[#6B5646]"
                                    >
                                        Tidak ada ruang diskusi pada kategori
                                        atau kata kunci ini.
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
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant={
                                                        categoryBadgeLabel[
                                                            activeRoom.category
                                                        ]?.variant ?? 'warn'
                                                    }
                                                >
                                                    {categoryBadgeLabel[
                                                        activeRoom.category
                                                    ]?.label ??
                                                        activeRoom.category}
                                                </Badge>
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B5646]">
                                                    <Clock className="size-3.5" />
                                                    Dibuka oleh{' '}
                                                    <strong className="text-[#3B2A1E]">
                                                        {
                                                            activeRoom.creator
                                                                .name
                                                        }
                                                    </strong>{' '}
                                                    •{' '}
                                                    {
                                                        activeRoom.created_at_human
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <h2 className="mt-2 font-['Fredoka',system-ui,sans-serif] text-xl font-bold text-[#3B2A1E]">
                                            {activeRoom.title}
                                        </h2>
                                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#6B5646]">
                                            {activeRoom.description}
                                        </p>
                                    </div>

                                    {/* Messages Stream */}
                                    <div className="max-h-[520px] min-h-[360px] space-y-4 overflow-y-auto bg-[#FFFDF9] p-5 sm:p-6">
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
                                                            <div className="flex size-7 items-center justify-center rounded-xl border-2 border-[#3B2A1E] bg-[#FFE27A] text-xs font-extrabold text-[#3B2A1E]">
                                                                {msg.user.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <span className="text-xs sm:text-sm font-bold text-[#3B2A1E]">
                                                                {msg.user.name}
                                                            </span>
                                                            {msg.user
                                                                .is_admin && (
                                                                <span className="inline-flex items-center gap-1 rounded-lg border border-[#3B2A1E] bg-[#8ECDF0] px-2 py-0.5 text-[10px] font-extrabold text-[#3B2A1E]">
                                                                    <ShieldCheck className="size-3" />
                                                                    Guardian
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-[#6B5646]">
                                                            {
                                                                msg.created_at_human
                                                            }{' '}
                                                            •{' '}
                                                            {
                                                                msg.created_at_time
                                                            }
                                                        </span>
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
                                        {currentUser ? (
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
                                            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[#3B2A1E]/40 bg-white p-4 sm:flex-row">
                                                <p className="text-xs font-semibold text-[#6B5646]">
                                                    Silakan masuk untuk mengirim
                                                    pesan Markdown, mengunggah
                                                    gambar, dan memberikan reaksi
                                                    emoji.
                                                </p>
                                                <Link
                                                    href="/login"
                                                    className={buttonClasses(
                                                        'primary',
                                                        'sm',
                                                    )}
                                                >
                                                    Masuk Akun
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ) : (
                                <Card
                                    variant="subtle"
                                    className="py-16 text-center text-sm font-semibold text-[#6B5646]"
                                >
                                    Pilih ruang diskusi di sebelah kiri untuk
                                    mulai membaca atau mengirim pesan.
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
                            <div className="relative w-full sm:max-w-sm">
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

                            {/* Sort */}
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
                                            <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpvote(alert.id)
                                                    }
                                                    disabled={hasUpvoted}
                                                    className={`cursor-pointer inline-flex h-9 items-center gap-2 rounded-xl border-2 px-3.5 text-xs font-bold transition-all ${
                                                        hasUpvoted
                                                            ? 'border-[#3B2A1E] bg-[#FFE27A] text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E]'
                                                            : 'border-[#3B2A1E] bg-white text-[#3B2A1E] shadow-[2px_2px_0px_0px_#3B2A1E] hover:bg-[#FFF8EC]'
                                                    }`}
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
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}

                            {filteredAlerts.length === 0 && (
                                <Card
                                    variant="subtle"
                                    className="py-16 text-center text-sm font-semibold text-[#6B5646]"
                                >
                                    Tidak ada laporan penipuan yang cocok dengan
                                    pencarian Anda.
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
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="size-5 text-[#E06812]" />
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
                            <div className="rounded-2xl border-2 border-[#3B2A1E] bg-white p-3.5 text-xs font-semibold text-[#6B5646] shadow-[2px_2px_0px_0px_#3B2A1E]">
                                Setiap anggota dapat membuat maksimal{' '}
                                <strong className="text-[#3B2A1E]">
                                    3 ruang diskusi per hari
                                </strong>
                                . Sisa kuota Anda hari ini:{' '}
                                <strong className="text-[#E06812]">
                                    {dailyQuota.remaining} dari {dailyQuota.max}{' '}
                                    ruang
                                </strong>
                                .
                            </div>

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
                                    <option value="apk_malware">
                                        Malware APK
                                    </option>
                                    <option value="phishing_banking">
                                        Phishing Bank
                                    </option>
                                    <option value="social_engineering">
                                        Rekayasa Sosial
                                    </option>
                                    <option value="fake_job">
                                        Lowongan Palsu
                                    </option>
                                    <option value="fake_giveaway">
                                        Undian Palsu
                                    </option>
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
        </AppLayout>
    );
}
