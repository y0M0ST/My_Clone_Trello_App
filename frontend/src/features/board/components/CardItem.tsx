import type { Card } from "@/shared/api/board.api";
import { cardApi } from "@/shared/api/card.api";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent
} from "@/shared/ui/context-menu";
import { toast } from "sonner";
import { Copy, Trash2, UserPlus, ArrowRight, Link as LinkIcon, Edit3 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
interface Props {
    card: Card;
    onReload: () => void;
}

export const CardItem = ({ card, onReload }: Props) => {
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
        opacity: isDragging ? 0.5 : 1, 
    };
    const handleArchive = async () => {
        try {
            await cardApi.update(card.id, { isArchived: true });
            toast.success("Đã lưu trữ thẻ");
            onReload();
        } catch (error) {
            toast.error("Lỗi khi lưu trữ thẻ");
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/c/${card.id}`);
        toast.success("Đã sao chép liên kết thẻ!");
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group relative">
                    {card.coverUrl && (
                        <img src={card.coverUrl} alt="cover" className="w-full h-32 object-cover rounded-md mb-2" />
                    )}
                    <div className="text-sm text-gray-800 font-medium">
                        {card.title}
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-100 p-1 rounded hover:bg-gray-200">
                        <Edit3 className="h-3 w-3 text-gray-600" />
                    </div>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-64">
                <ContextMenuItem onClick={() => toast.info(`Mở card: ${card.title}`)}>
                    <Edit3 className="mr-2 h-4 w-4" /> Mở thẻ
                </ContextMenuItem>
                <ContextMenuItem onClick={() => toast.info("Chỉnh sửa nhãn")}>
                    🏷️ Chỉnh sửa nhãn
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

                <ContextMenuItem className="text-red-600 focus:text-red-600" onClick={handleArchive}>
                    <Trash2 className="mr-2 h-4 w-4" /> Lưu trữ
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};