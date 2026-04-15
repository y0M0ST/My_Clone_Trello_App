import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { boardApi, type BoardDetail, type BoardVisibility } from "@/shared/api/board.api";
import { listApi } from "@/shared/api/list.api";
import { ListColumn } from "@/features/board/components/ListColumn";
import { CreateListForm } from "@/features/board/components/CreateListForm";
import { CardContent } from "@/features/board/components/CardItem";
import {
    Loader2,
    Globe,
    Lock,
    Users,
    MoreHorizontal,
    Check,
    ChevronDown,
    Trash2,
    XCircle,
    Activity, Archive, Info,
    Image as ImageIcon,
    type LucideIcon
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/popover";
import { toast } from "sonner";
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    type DropAnimation,
    KeyboardSensor,
    pointerWithin,
    closestCorners,
    type CollisionDetection
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import { InviteMemberDialog } from "@/features/board/InviteMemberDialog";
import { ManageMembersDialog } from "@/features/board/ManageMembersDialog";
import { BackgroundPicker } from "@/features/board/BackgroundPicker";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import { cardApi } from "@/shared/api/card.api";
import { CardDetailDialog } from "./CardDetailDialog";
import { BoardInfoDialog } from "@/features/board/components/board-menu/BoardInfoDialog";
import { BoardActivitySidebar } from "@/features/board/components/board-menu/BoardActivitySidebar";
import { BoardArchivedItemsDialog } from "@/features/board/components/board-menu/BoardArchivedItemsDialog";
import { BoardSettingsDialog } from "@/features/board/components/board-menu/BoardSettingsDialog";
import { Settings } from "lucide-react";

const VISIBILITY_OPTIONS = [
    {
        value: "private",
        label: "Riêng tư",
        icon: Lock,
        description: "Chỉ thành viên của bảng mới có thể xem và chỉnh sửa.",
    },
    {
        value: "workspace",
        label: "Không gian làm việc",
        icon: Users,
        description: "Tất cả thành viên trong Workspace có thể xem bảng này.",
    },
    {
        value: "public",
        label: "Công khai",
        icon: Globe,
        description: "Bất kỳ ai trên internet đều có thể xem (chỉ thành viên mới được sửa).",
    },
] as const;

const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
};

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: "0.5" },
        },
    }),
};

const BoardPage = () => {
    const { boardId } = useParams();
    const navigate = useNavigate();
    const [board, setBoard] = useState<BoardDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

    // DND States
    const [activeDragItem, setActiveDragItem] = useState<any>(null);
    const [activeDragType, setActiveDragType] = useState<"COLUMN" | "CARD" | null>(null);
    const dragMetaRef = useRef<{ columnId: string; index: number } | null>(null);
    const [selectedCard, setSelectedCard] = useState<any>(null);

    const currentUser = tokenStorage.getUser();

    // Permission Calculation
    const currentMember = board?.members.find(m => m.id === currentUser?.id);
    const roleName = currentMember?.roleName?.toLowerCase() || currentMember?.role?.name?.toLowerCase() || "";
    const isOwnerOrAdmin = ["board_owner", "board_admin", "owner", "admin"].includes(roleName);
    const isObserver = roleName.includes("observer");

    // Regular members can edit. Only Observers are read-only.
    // isOwnerOrAdmin is used for administrative tasks (Settings, Delete Board).
    const canEdit = !isObserver;

    // Allow managing members if admin or policy allows all members (but NEVER Observers)
    const canManageMembers = !isObserver && (isOwnerOrAdmin || (board?.memberManagePolicy === 'all_members'));

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchBoardData = useCallback(async (signal?: AbortSignal) => {
        if (!boardId) return;
        const gone = () => signal?.aborted;
        try {
            const invite = new URLSearchParams(window.location.search).get("invite");
            if (invite) {
                try {
                    await boardApi.joinBoardByInvite(boardId, invite);
                    if (gone()) return;
                    toast.success("Đã tham gia bảng qua link mời");
                } catch (joinErr: unknown) {
                    if (gone()) return;
                    const ax = joinErr as { response?: { data?: { message?: string } } };
                    toast.error(ax.response?.data?.message || "Link mời không hợp lệ hoặc đã hết hạn");
                }
                if (gone()) return;
                navigate(`/boards/${boardId}`, { replace: true });
            }

            const response: unknown = await boardApi.getDetail(boardId);
            if (gone()) return;
            const res = response as { responseObject?: BoardDetail; data?: BoardDetail };
            const boardData = res.responseObject || res.data || (response as BoardDetail);

            // if (boardData.lists) {
            //     boardData.lists.sort((a: any, b: any) => a.position - b.position);
            //     boardData.lists.forEach((list: any) => {
            //         if (list.cards) {
            //             list.cards.sort((a: any, b: any) => a.position - b.position);
            //         }
            //     });
            // }
            // if (boardData.members) {
            //     // Ensure members is array
            // }

            // console.log("🔥 Board Data:", boardData);
            setBoard(boardData);
        } catch (error) {
            if (gone()) return;
            console.error("Lỗi tải board:", error);
            toast.error("Không thể tải thông tin bảng");
            navigate("/dashboard");
        } finally {
            if (!gone()) setLoading(false);
        }
    }, [boardId, navigate]);

    useEffect(() => {
        const ac = new AbortController();
        void fetchBoardData(ac.signal);
        return () => ac.abort();
    }, [fetchBoardData]);

    // Sync selectedCard when board data updates
    useEffect(() => {
        if (selectedCard && board) {
            let foundCard = null;
            let listTitle = "";
            for (const list of board.lists) {
                const c = list.cards?.find((c: any) => c.id === selectedCard.id);
                if (c) {
                    foundCard = c;
                    listTitle = list.title;
                    break;
                }
            }

            if (foundCard) {
                // Only update if data actually changed to avoid infinite loops if objects are new ref but same content
                // But simplified: just set it. React handles equality checks mostly, or we can rely on it being a different object ref from fetch.
                setSelectedCard({ ...foundCard, listTitle });
            }
        }
    }, [board]);

    const findColumn = (lists: any[], uniqueId: string) => {
        if (!uniqueId) return null;

        // Handle explicit droppable zone IDs
        const normalizedId = uniqueId.includes("::droppable")
            ? uniqueId.replace("::droppable", "")
            : uniqueId;

        if (lists.some((c) => c.id === normalizedId)) {
            return lists.find((c) => c.id === normalizedId);
        }
        return lists.find((c) => c.cards?.some((card: any) => card.id === normalizedId));
    };

    const handleDragStart = (event: DragStartEvent) => {
        if (!canEdit || !board) return;

        const activeId = event.active.id as string;
        const activeData = event.active.data.current;
        setActiveDragItem(activeData);

        if (activeData?.hasOwnProperty("cards")) {
            setActiveDragType("COLUMN");
            return;
        } else {
            setActiveDragType("CARD");
        }

        const column = findColumn(board.lists, activeId);
        const index = column?.cards?.findIndex((c: any) => c.id === activeId) ?? -1;

        if (column && index >= 0) {
            dragMetaRef.current = { columnId: column.id, index };
        } else {
            dragMetaRef.current = null;
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        if (!canEdit || !board) return;
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // If dragging a column, do nothing in dragOver
        if (activeDragType === "COLUMN") return;

        // Ensure we are dragging a card
        const activeColumn = findColumn(board.lists, activeId as string);
        const overColumn = findColumn(board.lists, overId as string);

        if (!activeColumn || !overColumn) return;

        if (activeColumn.id === overColumn.id) {
            // Same column sorting is handled by SortableContext, but key part is
            // we don't need to do complex state updates here for same column
            // UNLESS we want real-time reorder visualization, which dnd-kit does by default??
            // Actually dnd-kit needs arrayMove in dragOver OR dragEnd.
            // For different containers, we MUST do it in dragOver.
            return;
        }

        // Moving between columns
        setBoard((prevBoard) => {
            if (!prevBoard) return null;

            const prevLists = [...prevBoard.lists];
            const activeItems = activeColumn.cards || [];
            const overItems = overColumn.cards || [];
            const activeIndex = activeItems.findIndex((i: any) => i.id === activeId);
            const overIndex = overItems.findIndex((i: any) => i.id === overId);
            const isOverColumn = overId === overColumn.id || overId === `${overColumn.id}::droppable`;

            if (activeIndex < 0) return prevBoard;

            let newIndex;
            if (isOverColumn) {
                // If over column, put at end
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            const movingCard = activeItems[activeIndex];

            const newLists = prevLists.map((c) => {
                if (c.id === activeColumn.id) {
                    return {
                        ...c,
                        cards: activeItems.filter((item: any) => item.id !== activeId),
                    };
                }
                if (c.id === overColumn.id) {
                    const exists = overItems.find((i: any) => i.id === activeId);
                    if (exists) return c;

                    const nextCards = overItems.filter((item: any) => item.id !== activeId);

                    // Safely insert
                    const safeIndex = Math.min(newIndex, nextCards.length);

                    return {
                        ...c,
                        cards: [
                            ...nextCards.slice(0, safeIndex),
                            movingCard,
                            ...nextCards.slice(safeIndex),
                        ],
                    };
                }
                return c;
            });

            return { ...prevBoard, lists: newLists };
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        if (!canEdit || !board) return;
        const { active, over } = event;

        // Clean up
        setActiveDragItem(null);
        setActiveDragType(null);
        const dragMeta = dragMetaRef.current;
        dragMetaRef.current = null;

        if (!over) return;

        // --- 1. HANDLE COLUMN REORDER ---
        if (active.data.current?.hasOwnProperty("cards") || board.lists.some(l => l.id === active.id)) {
            if (active.id !== over.id) {
                const oldIndex = board.lists.findIndex(l => l.id === active.id);
                const newIndex = board.lists.findIndex(l => l.id === over.id);
                const newLists = arrayMove(board.lists, oldIndex, newIndex);

                setBoard({ ...board, lists: newLists });

                try {
                    const currentListId = newLists[newIndex].id;
                    const prevListId = newLists[newIndex - 1]?.id || null;
                    const nextListId = newLists[newIndex + 1]?.id || null;
                    await listApi.reorder(currentListId, prevListId, nextListId);
                } catch (error) {
                    toast.error("Lỗi cập nhật vị trí danh sách");
                    fetchBoardData();
                }
            }
            return;
        }

        // --- 2. HANDLE CARD REORDER ---
        const activeId = active.id as string;
        const overId = over.id as string;

        // Determine destination column
        const overColumn = findColumn(board.lists, overId);

        // If dropped over a column container properly (likely empty or at end)
        // or dropped over a card in a column
        if (!overColumn) return;

        const prevColumnId = dragMeta?.columnId;
        const prevIndex = dragMeta?.index;
        const nextColumnId = overColumn.id;

        // Prevent moving if we don't know where it came from
        if (!prevColumnId || prevIndex === undefined || prevIndex < 0) return;

        let nextIndex = 0;
        const currentCards = overColumn.cards || [];

        // Logic to calculate index based on where we dropped
        if (overId === nextColumnId || overId === `${nextColumnId}::droppable`) {
            // Dropped on the column container itself (e.g. empty list or at bottom)
            nextIndex = currentCards.length;
        } else {
            // Dropped on a card
            const overCardIndex = currentCards.findIndex((c: any) => c.id === overId);

            if (overCardIndex >= 0) {
                // Calculate if dropped above or below
                const isBelowOverItem =
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                nextIndex = overCardIndex + (isBelowOverItem ? 1 : 0);
            } else {
                nextIndex = currentCards.length;
            }
        }

        // Adjust index if moving within same column
        if (prevColumnId === nextColumnId) {
            const oldIndex = currentCards.findIndex((c: any) => c.id === activeId);
            // ArrayMove handles the index logic, but for API we might need the "visual" index
            // if moving down, index increases, but arrayMove accounts for removal.
            // Simplest way: update local state first using dnd-kit utils, then send that state to API?
            // Or reuse the logic from dragOver?

            // Actually, simply using arrayMove on local state is best for UI
            const newLists = board.lists.map(col => {
                if (col.id === nextColumnId) {
                    return {
                        ...col,
                        cards: arrayMove(col.cards, oldIndex, nextIndex > oldIndex ? nextIndex - 1 : nextIndex) // Adjust for removal
                    };
                }
                return col;
            });
            // However, for API, let's just trust our calculation or current UI state?
            // Let's rely on standard arrayMove behavior first for UI

            // Recalculate distinct old/new indices for arrayMove
            // 'overId' might be the card we dropped ON. 
            // If we dropped on column, we put at end.

            const finalOldIndex = currentCards.findIndex((c: any) => c.id === activeId);
            let finalNewIndex = nextIndex;

            // Fix bounds
            if (finalNewIndex > currentCards.length) finalNewIndex = currentCards.length;

            // If we rely on dnd-kit's sortable context, the 'over' gives us the target.
            const overCardIndexForSortable = currentCards.findIndex((c: any) => c.id === overId);
            if (overId !== nextColumnId && overCardIndexForSortable >= 0) {
                finalNewIndex = overCardIndexForSortable;
                // dnd-kit handles the "swapping" logic naturally if we use standard strategies
                // But here we doing manual calc. 
                // Let's use arrayMove with the `active` and `over` indices directly if in same column
                const newListsMap = board.lists.map(col => {
                    if (col.id === nextColumnId) {
                        return {
                            ...col,
                            cards: arrayMove(col.cards, finalOldIndex, overCardIndexForSortable)
                        };
                    }
                    return col;
                });
                setBoard({ ...board, lists: newListsMap });
                nextIndex = overCardIndexForSortable; // Update for API
            } else {
                // Dropped on column -> move to end
                // ... logic for move to end
            }
        } else {
            // Different column: UI already updated in DragOver
            // We just need to calculate correct API index.
            // In dragOver, we inserted the card into the new column.
            // So in dry run, 'active' card IS in 'overColumn' now??
            // No, 'board' state was updated in dragOver. So 'activeId' SHOULD be in 'overColumn' in 'board' state.

            const updatedOverColumn = board.lists.find(l => l.id === nextColumnId);
            const indexInNewList = updatedOverColumn?.cards?.findIndex((c: any) => c.id === activeId);

            if (indexInNewList !== undefined && indexInNewList >= 0) {
                nextIndex = indexInNewList;
            }
        }

        try {
            await cardApi.moveCard({
                cardId: activeId,
                prevColumnId,
                prevIndex,
                nextColumnId,
                nextIndex: nextIndex < 0 ? 0 : nextIndex,
            });
            // console.log(`Moved Card: ${prevColumnId} -> ${nextColumnId} at index ${nextIndex}`);

        } catch (error) {
            console.error("Moved card failed:", error);
            toast.error("Lỗi di chuyển thẻ");
            fetchBoardData(); // Revert on error
        }
    };

    const handleChangeVisibility = async (newVisibility: BoardVisibility) => {
        if (!canEdit) return; // Permission check
        if (!board || board.visibility === newVisibility) return;

        setIsUpdatingVisibility(true);
        const oldVisibility = board.visibility;
        setBoard({ ...board, visibility: newVisibility });

        try {
            await boardApi.update(board.id, { visibility: newVisibility });
            toast.success(`Đã chuyển sang chế độ ${newVisibility}`);
        } catch (error) {
            toast.error("Lỗi cập nhật chế độ hiển thị");
            setBoard({ ...board, visibility: oldVisibility });
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    const handleCloseBoard = async () => {
        if (!confirm("Bạn có chắc chắn muốn đóng bảng này không?")) return;
        try {
            await boardApi.update(board!.id, { isClosed: true } as any);
            toast.success("Đã đóng bảng thành công");
            navigate("/dashboard");
        } catch (error) {
            toast.error("Lỗi khi đóng bảng");
        }
    };

    const handleDeleteBoard = async () => {
        if (!confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn bảng và không thể khôi phục! Bạn có chắc chắn không?")) return;
        try {
            await boardApi.deletePermanently(board!.id);
            toast.success("Đã xóa bảng vĩnh viễn");
            navigate("/dashboard");
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Lỗi khi xóa bảng (kiểm tra quyền Owner hoặc ràng buộc dữ liệu)");
        }
    };

    const handleBackgroundUpdate = (newUrl: string) => {
        if (board) setBoard({ ...board, coverUrl: newUrl });
    };

    const MAX_MEMBERS_SHOW = 5;
    const members = board?.members || [];
    const displayedMembers = members.slice(0, MAX_MEMBERS_SHOW);
    const hiddenMembersCount = members.length - MAX_MEMBERS_SHOW;
    const currentVisibility = VISIBILITY_OPTIONS.find(v => v.value === board?.visibility) || VISIBILITY_OPTIONS[0];
    const CurrentIcon = currentVisibility.icon as LucideIcon;

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!board) return <div>Not found</div>;

    // Custom collision detection strategy
    const customCollisionDetection: CollisionDetection = (args) => {
        const pointerCollisions = pointerWithin(args);

        // If pointer is inside a droppable, prioritize it
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }

        return closestCorners(args);
    };

    return (
        <div
            className="h-screen w-full flex flex-col bg-cover bg-center transition-all duration-500"
            style={{ backgroundImage: `url('${board.coverUrl || "https://images.unsplash.com/photo-1519681393784-d8e5b5a4570e?q=80&w=2070"}')` }}
        >

            <div className="h-14 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 shrink-0 border-b border-white/10">
                {/* ... Header content ... */}
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity mr-2">
                        {/* ... */}
                        <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <img src="/taskflow.png" alt="TaskFlow Logo" className="w-8 h-8 object-contain" />
                        </div>
                    </a>
                    {/* ... rest of header ... */}
                    <Input
                        value={board.title}
                        onChange={(e) => setBoard({ ...board, title: e.target.value })}
                        onBlur={async () => {
                            if (!board || !board.title.trim()) return;
                            try {
                                await boardApi.update(board.id, { title: board.title });
                            } catch (error) {
                                toast.error("Lỗi cập nhật tên bảng");
                            }
                        }}
                        className="text-xl font-bold text-white bg-transparent border-transparent hover:bg-white/20 focus:bg-white/20 focus:border-white/30 h-9 px-3 py-1 rounded transition w-auto min-w-[150px] shadow-sm"
                    />

                    {/* ... Rest of existing header ... */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-white bg-white/10 hover:bg-white/20 h-8 px-3" disabled={isUpdatingVisibility || !canEdit}>
                                <CurrentIcon className="h-4 w-4 mr-2" />
                                <span className="capitalize hidden sm:inline">{currentVisibility.label}</span>
                                <ChevronDown className="h-3 w-3 ml-2 opacity-70" />
                            </Button>
                        </PopoverTrigger>
                        {/* ... PopoverContent ... */}
                        {canEdit && (
                            <PopoverContent align="start" className="w-[340px] p-0 bg-white shadow-xl rounded-xl">
                                <div className="p-4 border-b">
                                    <h4 className="font-semibold text-center text-gray-800">Chế độ hiển thị</h4>
                                </div>
                                <div className="p-2 flex flex-col gap-1">
                                    {VISIBILITY_OPTIONS.map((option) => {
                                        const Icon = option.icon as LucideIcon;
                                        const isSelected = board.visibility === option.value;
                                        return (
                                            <div key={option.value} onClick={() => handleChangeVisibility(option.value as BoardVisibility)} className={`relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-100"}`}>
                                                <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-900"}`}>{option.label}</p>
                                                    <p className="text-xs text-gray-500 mt-1 leading-tight">{option.description}</p>
                                                </div>
                                                {isSelected && <Check className="h-4 w-4 text-blue-600 mt-1" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        )}
                    </Popover>
                </div>



                <div className="flex items-center gap-2">
                    {/* Members List */}
                    <div className="flex -space-x-2 overflow-hidden mr-2">
                        {displayedMembers.map((member) => (
                            <TooltipProvider key={member.id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-7 w-7 border-2 border-[#0055CC] cursor-pointer hover:z-10 transition-transform">
                                            <AvatarImage src={member.avatarUrl || undefined} />
                                            <AvatarFallback className="text-[10px] bg-slate-200">
                                                {getInitials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{member.name} ({member.email})</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        {hiddenMembersCount > 0 && (
                            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium border-2 border-white z-10">
                                +{hiddenMembersCount}
                            </div>
                        )}
                    </div>

                    {/* Invite Button */}
                    {canManageMembers && (
                        <InviteMemberDialog boardId={boardId!} onSuccess={fetchBoardData}>
                            <Button variant="secondary" size="sm" className="h-8 bg-blue-100 text-blue-700 hover:bg-blue-200 mr-2">
                                <Users className="h-4 w-4 mr-2" />
                                Chia sẻ
                            </Button>
                        </InviteMemberDialog>
                    )}
                    {/* ... Right side actions ... */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        {/* ... Menu content ... */}
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            {/* ... dropdown items ... */}
                            <DropdownMenuLabel>Menu bảng</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {canEdit && (
                                <BackgroundPicker boardId={boardId!} currentCover={board.coverUrl} onUpdate={handleBackgroundUpdate}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}> <ImageIcon className="mr-2 h-4 w-4" /> Đổi hình nền </DropdownMenuItem>
                                </BackgroundPicker>
                            )}
                            {canManageMembers && (
                                <ManageMembersDialog
                                    boardId={boardId!}
                                    members={board.members}
                                    hasInviteLink={Boolean(board.hasInviteLink)}
                                    canManageInviteLink={isOwnerOrAdmin}
                                    onUpdate={fetchBoardData}
                                >
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}> <Users className="mr-2 h-4 w-4" /> Quản lý thành viên </DropdownMenuItem>
                                </ManageMembersDialog>
                            )}
                            <DropdownMenuSeparator />
                            {isOwnerOrAdmin && (
                                <DropdownMenuItem className="text-orange-600 focus:text-orange-600 focus:bg-orange-50" onClick={handleCloseBoard}> <XCircle className="mr-2 h-4 w-4" /> Đóng bảng này </DropdownMenuItem>
                            )}
                            {isOwnerOrAdmin && (
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleDeleteBoard}> <Trash2 className="mr-2 h-4 w-4" /> Xóa bảng vĩnh viễn </DropdownMenuItem>
                            )}
                            {!canEdit && (<DropdownMenuItem disabled> <span className="text-xs text-gray-400 italic">Bạn chỉ có quyền xem</span> </DropdownMenuItem>)}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Cài đặt</DropdownMenuLabel>
                            {isOwnerOrAdmin && (
                                <BoardSettingsDialog
                                    boardId={boardId!}
                                    currentCommentPolicy={board.commentPolicy}
                                    currentMemberPolicy={board.memberManagePolicy}
                                    onUpdate={fetchBoardData}
                                >
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}> <Settings className="mr-2 h-4 w-4" /> Cài đặt quyền </DropdownMenuItem>
                                </BoardSettingsDialog>
                            )}
                            <DropdownMenuSeparator />

                            <DropdownMenuLabel>Tiện ích</DropdownMenuLabel>
                            <BoardInfoDialog boardId={boardId!} currentDescription={board.description} onUpdate={fetchBoardData} canEdit={canEdit}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}> <Info className="mr-2 h-4 w-4" /> Giới thiệu bảng </DropdownMenuItem>
                            </BoardInfoDialog>
                            <BoardActivitySidebar boardId={boardId!}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}> <Activity className="mr-2 h-4 w-4" /> Hoạt động </DropdownMenuItem>
                            </BoardActivitySidebar>
                            <BoardArchivedItemsDialog boardId={boardId!} onUpdate={fetchBoardData} canEdit={canEdit}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}> <Archive className="mr-2 h-4 w-4" /> Mục đã lưu trữ </DropdownMenuItem>
                            </BoardArchivedItemsDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto p-4 custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    collisionDetection={customCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex h-full gap-4 items-start pb-2">
                        <SortableContext items={board.lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
                            {board.lists.map((list) => (
                                <ListColumn
                                    key={list.id}
                                    list={list}
                                    onReload={fetchBoardData}
                                    readonly={!canEdit}
                                    onCardClick={(card: any) => setSelectedCard(card)}
                                />
                            ))}
                        </SortableContext>

                        {/* Only show CreateList if canEdit */}
                        {canEdit && <CreateListForm boardId={boardId!} onSuccess={fetchBoardData} />}
                    </div>

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeDragItem ? (
                            activeDragType === "COLUMN" ? (
                                <div className="opacity-80 rotate-2 cursor-grabbing">
                                    <ListColumn list={activeDragItem} onReload={() => { }} readonly={true} />
                                </div>
                            ) : (
                                <CardContent card={activeDragItem} onReload={() => { }} isDragging={true} />
                            )
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Card Detail Dialog */}
            {
                selectedCard && (
                    <CardDetailDialog
                        card={selectedCard}
                        open={!!selectedCard}
                        onClose={() => setSelectedCard(null)}
                        onUpdate={fetchBoardData}
                        members={board?.members || []}
                        labels={board?.labels || []}
                        board={board || undefined}
                    />
                )
            }

        </div >
    );
};

export default BoardPage;
