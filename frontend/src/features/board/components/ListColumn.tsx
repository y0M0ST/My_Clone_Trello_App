import { useState } from "react";
import type { List, Card } from "@/shared/api/board.api";
import { cardApi } from "@/shared/api/card.api";
import { listApi } from "@/shared/api/list.api";
import { CardItem } from "./CardItem";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
    MoreHorizontal,
    Plus,
    X,
    Pencil,
    Copy,
    ArrowRightLeft,
    Archive
} from "lucide-react";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from "@/shared/ui/dropdown-menu";

interface Props {
    list: List;
    onReload: () => void;
    readonly?: boolean;
    onCardClick?: (card: Card) => void;
}

export const ListColumn = ({ list, onReload, readonly, onCardClick }: Props) => {
    // ...
    // (We need to keep the existing hooks and logic, just updating the prop and usage)
    // Actually, replace_file_content is for contiguous block. I need to be careful not to delete hooks.
    // I will use multiple smaller replacements or one careful one if the file structure permits.
    // The previous view showed hooks are at the top. I can replace the interface and component signature.
    // And then the usage of CardItem.
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: list.id,
        data: { ...list }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [isRenaming, setIsRenaming] = useState(false);
    const [listTitle, setListTitle] = useState(list.title);
    const cardIds = list.cards?.map(c => c.id) || [];
    const handleAddCard = async () => {
        if (!newCardTitle.trim()) return;
        setIsLoading(true);
        try {
            await cardApi.create({ listId: list.id, title: newCardTitle });
            toast.success("Đã thêm thẻ mới");
            setNewCardTitle("");
            onReload();
        } catch (error) {
            toast.error("Lỗi thêm thẻ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenameList = async () => {
        if (!listTitle.trim() || listTitle === list.title) {
            setIsRenaming(false);
            return;
        }
        try {
            await listApi.update(list.id, listTitle);
            toast.success("Đã đổi tên danh sách");
            onReload();
        } catch (error) {
            toast.error("Lỗi đổi tên danh sách");
            setListTitle(list.title);
        } finally {
            setIsRenaming(false);
        }
    };

    const handleArchiveAllCards = async () => {
        if (!confirm("Bạn có chắc muốn cất hết thẻ trong list này đi không?")) return;
        try {
            await listApi.archiveAllCards(list.id);
            toast.success("Đã lưu trữ tất cả thẻ");
            onReload();
        } catch (error) {
            toast.error("Lỗi khi lưu trữ thẻ");
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-72 shrink-0 h-full select-none"
        >
            <div className="w-full bg-[#f1f2f4] rounded-xl shadow-sm pb-2 max-h-full flex flex-col">

                <div
                    className="flex items-center justify-between px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                >
                    {isRenaming && !readonly ? (
                        <Input
                            value={listTitle}
                            onChange={(e) => setListTitle(e.target.value)}
                            onBlur={handleRenameList}
                            onKeyDown={(e) => e.key === "Enter" && handleRenameList()}
                            autoFocus
                            className="h-8 text-sm font-semibold bg-white"
                        />
                    ) : (
                        <h3
                            onClick={() => !readonly && setIsRenaming(true)}
                            className={`font-semibold text-sm text-gray-700 w-full px-1 py-1 rounded truncate ${!readonly ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                        >
                            {list.title}
                        </h3>
                    )}

                    {!readonly && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-300 ml-1">
                                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64">
                                <DropdownMenuLabel className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                                    Thao tác danh sách
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Đổi tên danh sách</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => setIsAddingCard(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>Thêm thẻ mới...</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => toast.info("Tính năng đang phát triển")}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    <span>Sao chép danh sách</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => toast.info("Tính năng đang phát triển")}>
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    <span>Di chuyển danh sách</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={handleArchiveAllCards}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Archive className="mr-2 h-4 w-4" />
                                    <span>Lưu trữ tất cả thẻ</span>
                                </DropdownMenuItem>

                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="px-2 flex flex-col gap-2 overflow-y-auto mx-1 custom-scrollbar min-h-[10px]">
                    <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                        {list.cards?.map((card) => (
                            <CardItem key={card.id} card={card} onReload={onReload} onClick={() => onCardClick?.(card)} />
                        ))}
                    </SortableContext>
                </div>

                <div className="px-2 pt-2">
                    {!readonly && (isAddingCard ? (
                        <div className="fade-in">
                            <Textarea
                                autoFocus
                                placeholder="Nhập tiêu đề thẻ..."
                                className="min-h-[80px] bg-white shadow-sm mb-2 resize-none"
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddCard()}
                            />
                            <div className="flex items-center gap-2 pb-2">
                                <Button size="sm" onClick={handleAddCard} disabled={isLoading}>
                                    {isLoading ? "..." : "Thêm thẻ"}
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setIsAddingCard(false)}>
                                    <X className="h-5 w-5 text-gray-500" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={() => setIsAddingCard(true)}
                            className="w-full justify-start text-gray-600 hover:bg-gray-300 text-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Thêm thẻ
                        </Button>
                    ))}
                </div>

            </div>
        </div>
    );
};