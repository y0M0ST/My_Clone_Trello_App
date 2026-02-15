import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { boardApi } from "@/shared/api/board.api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
    boardId: string;
    children?: React.ReactNode;
}

export function BoardActivitySidebar({ boardId, children }: Props) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res: any = await boardApi.getActivities(boardId);
            // Backend returns: { items: [...], total: ..., page: ..., pageSize: ... }
            // Wrapped in ServiceResponse: res.responseObject
            const data = res.responseObject || res.data || {};
            const items = Array.isArray(data.items) ? data.items : [];
            setActivities(items);
        } catch (error) {
            console.error("Failed to fetch activities", error);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (boardId) {
            fetchActivities();
        }
    }, [boardId]);

    const getInitials = (name: string) => {
        if (!name) return "??";
        return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    };

    // Helper to get display name
    const getDisplayName = (actor: any) => {
        if (!actor) return 'Unknown';
        return actor.name || actor.email || 'Unknown';
    };

    const getActionDescription = (action: any) => {
        const type = action.actionType;
        const meta = action.metadata || {};

        switch (type) {
            case 'BOARD_CREATED': return 'đã tạo bảng này';
            case 'BOARD_SETTINGS_UPDATED': return 'đã cập nhật cài đặt bảng';
            case 'BOARD_ARCHIVED': return 'đã lưu trữ bảng';
            case 'BOARD_REOPENED': return 'đã mở lại bảng';
            case 'LIST_CREATED': return `đã tạo danh sách "${meta.listTitle || 'mới'}"`;
            case 'LIST_RENAMED': return `đã đổi tên danh sách thành "${meta.listTitle}"`;
            case 'LIST_ARCHIVED': return `đã lưu trữ danh sách "${meta.listTitle}"`;
            case 'CARD_CREATED': return `đã tạo thẻ "${meta.cardTitle || 'mới'}"`;
            case 'CARD_UPDATED': return `đã cập nhật thẻ "${meta.cardTitle || ''}"`;
            case 'CARD_ARCHIVED': return `đã lưu trữ thẻ "${meta.cardTitle}"`;
            case 'MEMBER_ADDED': return 'đã thêm thành viên vào bảng';
            case 'MEMBER_REMOVED': return 'đã xóa thành viên khỏi bảng';
            case 'COMMENT_ADDED': return `đã bình luận vào thẻ "${meta.cardTitle || 'thẻ'}"`;
            default: return 'đã thực hiện một hành động';
        }
    };

    const comments = activities.filter(a => a.actionType === 'COMMENT_ADDED');

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Hoạt động
                    </SheetTitle>
                </SheetHeader>

                <Tabs defaultValue="all" className="w-full mt-4 flex-1 flex flex-col" onValueChange={(val) => {
                    if (val === 'all' || val === 'comments') fetchActivities();
                }}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                        <TabsTrigger value="comments">Bình luận</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
                        <TabsContent value="all" className="mt-0 space-y-4">
                            {loading ? (
                                <p className="text-center text-gray-500 text-sm py-4">Đang tải...</p>
                            ) : activities.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-4">Chưa có hoạt động nào.</p>
                            ) : (
                                activities.map((action) => (
                                    <div key={action.id} className="flex gap-3 items-start text-sm">
                                        <Avatar className="h-8 w-8 mt-1">
                                            <AvatarImage src={action.actor?.avatarUrl} />
                                            <AvatarFallback>{getInitials(getDisplayName(action.actor))}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p>
                                                <span className="font-semibold text-gray-900">{getDisplayName(action.actor)}</span>
                                                {" "}
                                                <span className="text-gray-600">
                                                    {getActionDescription(action)}
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true, locale: vi })}
                                            </p>
                                            {/* Show comment text if it's a comment */}
                                            {action.actionType === 'COMMENT_ADDED' && action.metadata?.text && (
                                                <div
                                                    className="mt-1 p-2 bg-gray-100 rounded text-gray-700 italic border border-gray-200 prose prose-sm max-w-none [&>p]:m-0"
                                                    dangerouslySetInnerHTML={{ __html: action.metadata.text }}
                                                />
                                            )}
                                            {/* Show changed fields for updates */}
                                            {action.actionType === 'BOARD_SETTINGS_UPDATED' && action.metadata?.changedFields && (
                                                <div className="mt-1 text-xs text-gray-500">
                                                    {Object.keys(action.metadata.changedFields).map(key => (
                                                        <div key={key}>
                                                            • Thay đổi {key}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="comments" className="mt-0 space-y-4">
                            {loading ? (
                                <p className="text-center text-gray-500 text-sm py-4">Đang tải...</p>
                            ) : comments.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-4">Chưa có bình luận nào.</p>
                            ) : (
                                comments.map((action) => (
                                    <div key={action.id} className="flex gap-3 items-start text-sm">
                                        <Avatar className="h-8 w-8 mt-1">
                                            <AvatarImage src={action.actor?.avatarUrl} />
                                            <AvatarFallback>{getInitials(getDisplayName(action.actor))}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {getDisplayName(action.actor)}
                                            </p>
                                            <p className="text-xs text-gray-500 mb-1">
                                                trong thẻ "{action.metadata?.cardTitle}"
                                            </p>
                                            <div
                                                className="mt-1 p-3 bg-white border border-gray-200 rounded shadow-sm text-gray-800 prose prose-sm max-w-none [&>p]:m-0"
                                                dangerouslySetInnerHTML={{ __html: action.metadata?.text || '' }}
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true, locale: vi })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
