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
    Share2,
    MoreHorizontal,
    Image as ImageIcon,
    Check,
    ChevronDown,
    Trash2,
    XCircle
} from "lucide-react";
import { Button } from "@/shared/ui/button";
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
    closestCorners,
    useSensor,
    useSensors,
    PointerSensor,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    type DropAnimation,
    KeyboardSensor
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
];

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
    const roleName = (currentMember as any)?.roleName?.toLowerCase() || "";
    const isOwnerOrAdmin = ["board_owner", "board_admin", "owner", "admin"].includes(roleName);
    const canEdit = isOwnerOrAdmin;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchBoardData = useCallback(async () => {
        if (!boardId) return;
        try {
            const response: any = await boardApi.getDetail(boardId);
            const boardData = response.responseObject || response.data || response;

            if (boardData.lists) {
                boardData.lists.sort((a: any, b: any) => a.position - b.position);
            }
            if (boardData.members) {
                // Ensure members is array
            }

            console.log("🔥 Board Data:", boardData);
            setBoard(boardData);
        } catch (error) {
            console.error("Lỗi tải board:", error);
            toast.error("Không thể tải thông tin bảng");
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    }, [boardId, navigate]);

    useEffect(() => {
        fetchBoardData();
    }, [fetchBoardData]);

    const findColumn = (lists: any[], uniqueId: string) => {
        if (!uniqueId) return null;
        if (lists.some((c) => c.id === uniqueId)) {
            return lists.find((c) => c.id === uniqueId);
        }
        return lists.find((c) => c.cards?.some((card: any) => card.id === uniqueId));
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

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
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
            const isOverColumn = prevLists.some((col) => col.id === overId);

            if (activeIndex < 0) return prevBoard;

            let newIndex = overItems.length;
            if (!isOverColumn && overIndex >= 0) {
                const isBelowOverItem =
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;
                newIndex = overIndex + (isBelowOverItem ? 1 : 0);
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
                    // Check if card is already there to avoid dupes in strict mode
                    const exists = overItems.find((i: any) => i.id === activeId);
                    if (exists) return c;

                    const nextCards = overItems.filter((item: any) => item.id !== activeId);
                    return {
                        ...c,
                        cards: [
                            ...nextCards.slice(0, newIndex),
                            movingCard,
                            ...nextCards.slice(newIndex),
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

        const overColumn = findColumn(board.lists, overId);

        if (!overColumn) return;

        const prevColumnId = dragMeta?.columnId;
        const prevIndex = dragMeta?.index;
        const nextColumnId = overColumn.id;

        // Prevent moving if we don't know where it came from
        if (!prevColumnId || prevIndex === undefined || prevIndex < 0) return;

        let nextIndex = 0;

        if (prevColumnId === nextColumnId) {
            // Same column
            const currentCards = overColumn.cards || [];
            const oldIndex = currentCards.findIndex((c: any) => c.id === activeId);
            const rawNewIndex = currentCards.findIndex((c: any) => c.id === overId);
            const newIndex = rawNewIndex >= 0 ? rawNewIndex : Math.max(currentCards.length - 1, 0);

            if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

            nextIndex = newIndex;

            const newLists = board.lists.map((col) => {
                if (col.id === nextColumnId) {
                    return {
                        ...col,
                        cards: arrayMove(col.cards, oldIndex, newIndex),
                    };
                }
                return col;
            });
            setBoard({ ...board, lists: newLists });

        } else {
            // Different column (handled mostly by DragOver, need to finalize index)
            const currentCards = overColumn.cards || [];
            const uiIndex = currentCards.findIndex((c: any) => c.id === activeId);

            // If UI index is found, use it. If not, fallback logic (should generally be found due to DragOver)
            const fallbackCards = currentCards.filter((c: any) => c.id !== activeId);
            const fallbackIndex = fallbackCards.findIndex((c: any) => c.id === overId);
            nextIndex = uiIndex >= 0 ? uiIndex : (fallbackIndex >= 0 ? fallbackIndex : fallbackCards.length);

            // State is likely already updated by DragOver, but ensure consistency if needed
            // With dnd-kit, DragOver usually does the optimistic UI update
        }

        try {
            // For cross-column, the activeItem might be part of 'overColumn' in state now,
            // so we need careful index calculation based on the *current* state (which includes the moved item).
            // However, the API typically expects the clean 'target' state.

            // Let's recalculate apiNextIndex based on what the UI shows now
            const currentCards = overColumn.cards || [];
            // The card IS in the list now (due to dragOver).
            // We need to know its index excluding itself? No, standard array index is usually fine for these APIs
            // BUT your API might expect "insert before/after" logic or specific index. Assuming 0-based index.

            // If it's same column, we just moved it.
            // If it's different column, we inserted it.

            // API param 'nextIndex' usually means "position index in the target column".

            await cardApi.moveCard({
                cardId: activeId,
                prevColumnId,
                prevIndex,
                nextColumnId,
                nextIndex: nextIndex < 0 ? 0 : nextIndex,
            });
            console.log(`Moved Card: ${prevColumnId} -> ${nextColumnId} at index ${nextIndex}`);

        } catch (error) {
            console.error("Moved card failed:", error);
            toast.error("Lỗi di chuyển thẻ");
            fetchBoardData();
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
            await boardApi.update(board!.id, { isClosed: true } as any); // Type cast if needed
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
        } catch (error) {
            toast.error("Lỗi khi xóa bảng");
        }
    };

    // This function handles background update from picker
    const handleBackgroundUpdate = (newUrl: string) => {
        if (board) setBoard({ ...board, coverUrl: newUrl });
    };

    const MAX_MEMBERS_SHOW = 5;
    const members = board?.members || [];
    const displayedMembers = members.slice(0, MAX_MEMBERS_SHOW);
    const hiddenMembersCount = members.length - MAX_MEMBERS_SHOW;
    const currentVisibility = VISIBILITY_OPTIONS.find(v => v.value === board?.visibility) || VISIBILITY_OPTIONS[0];
    const CurrentIcon = currentVisibility.icon;

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!board) return <div>Not found</div>;

    return (
        <div
            className="h-[calc(100vh-4rem)] w-full flex flex-col bg-cover bg-center transition-all duration-500"
            style={{ backgroundImage: `url('${board.coverUrl || "https://images.unsplash.com/photo-1519681393784-d8e5b5a4570e?q=80&w=2070"}')` }}
        >

            <div className="h-14 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 shrink-0 border-b border-white/10">

                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white shadow-sm cursor-pointer hover:bg-white/20 px-3 py-1 rounded transition">
                        {board.title}
                    </h1>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white bg-white/10 hover:bg-white/20 h-8 px-3 border border-transparent hover:border-white/30 transition-all"
                                disabled={isUpdatingVisibility || !canEdit}
                            >
                                <CurrentIcon className="h-4 w-4 mr-2" />
                                <span className="capitalize hidden sm:inline">{currentVisibility.label}</span>
                                <ChevronDown className="h-3 w-3 ml-2 opacity-70" />
                            </Button>
                        </PopoverTrigger>

                        {canEdit && (
                            <PopoverContent align="start" className="w-[340px] p-0 bg-white shadow-xl rounded-xl">
                                <div className="p-4 border-b">
                                    <h4 className="font-semibold text-center text-gray-800">Chế độ hiển thị</h4>
                                </div>
                                <div className="p-2 flex flex-col gap-1">
                                    {VISIBILITY_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = board.visibility === option.value;

                                        return (
                                            <div
                                                key={option.value}
                                                onClick={() => handleChangeVisibility(option.value as BoardVisibility)}
                                                className={`
                            relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                            ${isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-100"}`}
                                            >
                                                <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1 leading-tight">
                                                        {option.description}
                                                    </p>
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
                    <div className="flex -space-x-2 mr-2">
                        <TooltipProvider>
                            {displayedMembers.map((member: any) => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-pointer">
                                            <Avatar className="h-8 w-8 border-2 border-transparent hover:border-white transition ring-2 ring-black/10">
                                                <AvatarImage
                                                    src={member.avatarUrl || ""}
                                                    alt={member.name}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                                                    {getInitials(member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p className="font-semibold">{member.name || "Unnamed"}</p>
                                        <p className="text-xs text-gray-400">{member.email}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{member.roleName}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}

                            {hiddenMembersCount > 0 && (
                                <div className="h-8 w-8 rounded-full bg-gray-700/90 backdrop-blur flex items-center justify-center text-xs text-white font-bold border-2 border-transparent cursor-pointer hover:bg-gray-600 ring-2 ring-black/10 z-10">
                                    +{hiddenMembersCount}
                                </div>
                            )}
                        </TooltipProvider>
                    </div>

                    {/* Only show Invite if Admin/Owner */}
                    {isOwnerOrAdmin && (
                        <InviteMemberDialog boardId={boardId!} onSuccess={fetchBoardData}>
                            <Button className="bg-white/90 hover:bg-white text-gray-900 h-8 px-3 ml-2 font-medium shadow-sm transition-colors">
                                <Share2 className="h-4 w-4 mr-2" />
                                Chia sẻ / Mời
                            </Button>
                        </InviteMemberDialog>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel>Menu bảng</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Change Background */}
                            <BackgroundPicker boardId={boardId!} currentCover={board.coverUrl} onUpdate={handleBackgroundUpdate}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <ImageIcon className="mr-2 h-4 w-4" /> Đổi hình nền
                                </DropdownMenuItem>
                            </BackgroundPicker>

                            {/* Manage Members - Admin Only */}
                            {isOwnerOrAdmin && (
                                <ManageMembersDialog boardId={boardId!} members={board.members} onUpdate={fetchBoardData}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Users className="mr-2 h-4 w-4" /> Quản lý thành viên
                                    </DropdownMenuItem>
                                </ManageMembersDialog>
                            )}

                            <DropdownMenuSeparator />

                            {/* Close Board - Admin Only */}
                            {isOwnerOrAdmin && (
                                <DropdownMenuItem
                                    className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                                    onClick={handleCloseBoard}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Đóng bảng này
                                </DropdownMenuItem>
                            )}

                            {/* Delete Board - Admin Only */}
                            {isOwnerOrAdmin && (
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={handleDeleteBoard}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa bảng vĩnh viễn
                                </DropdownMenuItem>
                            )}

                            {!isOwnerOrAdmin && (
                                <DropdownMenuItem disabled>
                                    <span className="text-xs text-gray-400 italic">Bạn chỉ có quyền xem</span>
                                </DropdownMenuItem>
                            )}

                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>

            <div className="flex-1 overflow-x-auto p-4 custom-scrollbar">
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
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
                    />
                )
            }

        </div >
    );
};

export default BoardPage;
