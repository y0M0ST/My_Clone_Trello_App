import type { Card } from "@/shared/api/board.api";
import { cardApi } from "@/shared/api/card.api";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/shared/ui/context-menu";
import { toast } from "sonner";
import { Copy, Trash2, UserPlus, ArrowRight, Link as LinkIcon, Edit3, Circle, CheckCircle2, Archive } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { forwardRef, useEffect, useState } from "react";

interface Props {
    card: Card;
    onReload?: () => void;
    onClick?: () => void;
}

interface CardContentProps extends Props {
    style?: React.CSSProperties;
    attributes?: any;
    listeners?: any;
    isDragging?: boolean;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ card, onReload, onClick, style, attributes, listeners, isDragging }, ref) => {
        const [isHovered, setIsHovered] = useState(false);
        const [localCompleted, setLocalCompleted] = useState(card.isCompleted);

        // ✅ FIX 1: Chỉ đồng bộ khi dữ liệu từ cha (Server) thực sự thay đổi
        useEffect(() => {
            setLocalCompleted(card.isCompleted);
        }, [card.isCompleted]);

        const handleArchive = async (e?: React.MouseEvent) => {
            e?.stopPropagation();
            if (!confirm("Bạn có chắc chắn muốn lưu trữ thẻ này?")) return;
            try {
                await cardApi.update(card.id, { isArchived: true });
                toast.success("Đã lưu trữ thẻ");
                if (onReload) onReload();
            } catch (error) {
                toast.error("Lỗi khi lưu trữ thẻ");
            }
        };

        const toggleComplete = async (e: React.MouseEvent) => {
            e.stopPropagation();
            const newState = !localCompleted;

            // Optimistic Update: Đổi màu ngay lập tức
            setLocalCompleted(newState);

            try {
                await cardApi.update(card.id, { isCompleted: newState });
                if (onReload) onReload();
            } catch (error) {
                // Nếu lỗi thì quay xe (Revert)
                setLocalCompleted(!newState);
                toast.error("Lỗi cập nhật trạng thái");
            }
        };

        const copyLink = () => {
            navigator.clipboard.writeText(`${window.location.origin}/c/${card.id}`);
            toast.success("Đã sao chép liên kết thẻ!");
        };

        return (
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        ref={ref}
                        style={style}
                        {...attributes}
                        {...listeners}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group relative ${isDragging ? 'opacity-50' : ''} ${localCompleted ? 'opacity-75 bg-green-50/50' : ''}`}
                    >
                        {/* Hover Actions: Checkbox (Top Left) */}
                        <div className={`absolute top-2 left-2 z-20 transition-opacity duration-200 ${isHovered || localCompleted ? 'opacity-100' : 'opacity-0'}`}>
                            <div
                                onClick={toggleComplete}
                                className={`p-1.5 rounded-full cursor-pointer transition-colors backdrop-blur-sm shadow-sm border ${localCompleted
                                    ? "bg-green-100/90 text-green-600 border-green-200 hover:bg-green-200"
                                    : "bg-white/90 text-gray-400 border-gray-200 hover:text-green-600 hover:border-green-400 hover:bg-white"
                                    }`}
                                title={localCompleted ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
                            >
                                {localCompleted ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <Circle className="h-4 w-4" />
                                )}
                            </div>
                        </div>

                        {/* Hover Actions: Edit (Top Right) */}
                        <div className={`absolute top-2 right-2 z-20 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="p-1.5 bg-white/90 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 backdrop-blur-sm shadow-sm border border-gray-200/50">
                                <Edit3 className="h-3.5 w-3.5" />
                            </div>
                        </div>

                        {/* Archive Button (Bottom Right) */}
                        {/* ✅ FIX 2: Thêm pointer-events-none để khi ẩn đi thì không bấm nhầm được */}
                        <div className={`absolute bottom-2 right-2 z-20 transition-all duration-200 ${isHovered && localCompleted ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                            <div
                                onClick={handleArchive}
                                className="p-1.5 bg-white/90 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 backdrop-blur-sm shadow-sm border border-gray-200/50"
                                title="Lưu trữ thẻ"
                            >
                                <Archive className="h-3.5 w-3.5" />
                            </div>
                        </div>

                        {card.coverUrl && (
                            <img
                                src={card.coverUrl}
                                alt="cover"
                                className="w-full h-32 object-cover rounded-md mb-2"
                            />
                        )}
                        <div className={`text-sm text-gray-800 font-medium transition-all duration-200 ${!card.coverUrl && (isHovered || localCompleted) ? 'pl-8' : ''
                            } ${localCompleted ? 'line-through text-gray-500' : ''}`}>
                            {card.title}
                        </div>

                        {/* Badges/Info could go here */}
                    </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-64">
                    <ContextMenuItem onClick={() => toast.info(`Mở card: ${card.title}`)}>
                        <Edit3 className="mr-2 h-4 w-4" /> Mở thẻ
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => toast.info("Chỉnh sửa nhãn")}>
                        <Circle className="mr-2 h-4 w-4 text-blue-500" /> Chỉnh sửa nhãn
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => toast.info("Thay đổi thành viên")}>
                        <UserPlus className="mr-2 h-4 w-4" /> Thay đổi thành viên
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    <ContextMenuItem onClick={() => toast.info("Di chuyển thẻ")}>
                        <ArrowRight className="mr-2 h-4 w-4" /> Di chuyển...
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => toast.info("Sao chép thẻ")}>
                        <Copy className="mr-2 h-4 w-4" /> Sao chép...
                    </ContextMenuItem>
                    <ContextMenuItem onClick={copyLink}>
                        <LinkIcon className="mr-2 h-4 w-4" /> Sao chép liên kết
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    <ContextMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={handleArchive}
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Lưu trữ
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
    }
);

export const CardItem = ({ card, onReload, onClick }: Props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { ...card },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Handle opacity here specifically for the original item
    };

    return (
        <CardContent
            ref={setNodeRef}
            card={card}
            onReload={onReload}
            onClick={onClick}
            style={style}
            attributes={attributes}
            listeners={listeners}
            isDragging={isDragging}
        />
    );
};