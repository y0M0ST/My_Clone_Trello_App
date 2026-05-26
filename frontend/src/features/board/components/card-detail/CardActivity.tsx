import { useState, useEffect } from "react";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import { MessageSquare, Activity as ActivityIcon, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { RichTextEditor } from "@/shared/ui/rich-text-editor";
import { cardApi } from "@/shared/api/card.api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Action {
    id: string;
    type: string;
    date: string;
    memberCreator: {
        id: string;
        name?: string;
        email?: string;
        avatarUrl?: string;
    };
    data?: {
        text?: string;
        [key: string]: any;
    };
}

import type { BoardDetail } from "@/shared/api/board.api";

interface Props {
    cardId: string;
    board?: BoardDetail;
    canEdit?: boolean;
    boardSyncEpoch?: number;
}

const getInitials = (name: string) => {
    if (!name) return "??";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
};

export const CardActivity = ({ cardId, board, canEdit = true, boardSyncEpoch = 0 }: Props) => {
    const [actions, setActions] = useState<Action[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const currentUser = tokenStorage.getUser();

    // Check permissions
    const canComment = (() => {
        if (!canEdit) return false; // Force read-only for observers
        if (!board || !currentUser) return false;
        const policy = board.commentPolicy || 'members';

        // 1. Anyone
        if (policy === 'anyone') return true;

        // Find current member
        const currentMember = board.members?.find(m => m.id === currentUser.id);
        const isMember = !!currentMember;

        // 2. Disabled
        if (policy === 'disabled') {
            return false;
        }

        // 3. Members
        if (policy === 'members') return isMember;

        // 4. Workspace
        if (policy === 'workspace') return isMember;

        return false;
    })();

    const fetchActions = async () => {
        try {
            const response: any = await cardApi.getActions(cardId);
            const data = response.responseObject || response.data || response;
            // Ensure data is array or object with actions
            const actionsList = data.actions || (Array.isArray(data) ? data : []);
            setActions(actionsList);
        } catch (error) {
            console.error("Failed to fetch actions:", error);
        }
    };

    useEffect(() => {
        void fetchActions();
    }, [cardId, boardSyncEpoch]);

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        setIsSending(true);
        try {
            await cardApi.addComment(cardId, commentText);
            toast.success("Đã thêm bình luận");
            setCommentText("");
            setIsFocused(false);
            fetchActions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi gửi bình luận");
        } finally {
            setIsSending(false);
        }
    };

    const handleStartEdit = (action: Action) => {
        setEditingCommentId(action.id);
        setEditCommentText(action.data?.text || "");
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditCommentText("");
    };

    const handleSaveEdit = async (actionId: string) => {
        if (!editCommentText.trim()) return;
        try {
            await cardApi.updateComment(cardId, actionId, editCommentText);
            toast.success("Đã cập nhật bình luận");
            setEditingCommentId(null);
            fetchActions();
        } catch (error) {
            toast.error("Lỗi khi cập nhật bình luận");
        }
    };

    const handleDeleteComment = async (actionId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
        try {
            await cardApi.deleteComment(cardId, actionId);
            toast.success("Đã xóa bình luận");
            fetchActions();
        } catch (error) {
            toast.error("Lỗi khi xóa bình luận");
        }
    };

    const comments = actions.filter(a => a.type === "commentCard");
    const history = actions.filter(a => a.type !== "commentCard");

    return (
        <div className="space-y-8">
            {/* COMMENTS SECTION */}
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm uppercase tracking-wide">
                    <MessageSquare className="w-4 h-4" /> Bình luận
                </h3>


                {/* Comment Input */}
                {canComment ? (
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={currentUser?.avatarUrl || ""} />
                            <AvatarFallback>{getInitials(currentUser?.name || "ME")}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            {!isFocused && !commentText ? (
                                <div
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 cursor-text bg-white hover:bg-gray-50 shadow-sm transition-colors"
                                    onClick={() => setIsFocused(true)}
                                >
                                    Viết bình luận...
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                    <RichTextEditor
                                        placeholder="Viết bình luận..."
                                        value={commentText}
                                        onChange={setCommentText}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" onClick={handleSendComment} disabled={isSending}>
                                            {isSending ? "Đang gửi..." : "Lưu"}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => { setIsFocused(false); setCommentText(""); }}>
                                            Hủy
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="italic text-gray-500 text-sm p-3 border rounded bg-gray-50 text-center">
                        Bình luận đã bị tắt trên bảng này.
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-4 mt-4">
                    {comments.map((action) => {
                        const isOwner = currentUser?.id === action.memberCreator.id;
                        const isEditing = editingCommentId === action.id;

                        return (
                            <div key={action.id} className="flex gap-3 group">
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarImage src={action.memberCreator?.avatarUrl || ""} />
                                    <AvatarFallback>{getInitials(action.memberCreator?.name || "U")}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-gray-900">
                                                {action.memberCreator?.name || action.memberCreator?.email || "Unknown"}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(action.date), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>

                                        {isOwner && !isEditing && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleStartEdit(action)}>
                                                        <Pencil className="h-3.5 w-3.5 mr-2" /> Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteComment(action.id)}>
                                                        <Trash className="h-3.5 w-3.5 mr-2" /> Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <RichTextEditor
                                                value={editCommentText}
                                                onChange={setEditCommentText}
                                            />
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={() => handleSaveEdit(action.id)}>Lưu</Button>
                                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Hủy</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="p-3 bg-white border border-gray-200 rounded-md text-sm text-gray-800 shadow-sm prose prose-sm max-w-none [&>p]:m-0"
                                            dangerouslySetInnerHTML={{ __html: action.data?.text || '' }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ACTIVITY LOG SECTION */}
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm uppercase tracking-wide">
                    <ActivityIcon className="w-4 h-4" /> Hoạt động
                </h3>
                <div className="space-y-2 pl-2">
                    {history.map((action) => (
                        <div key={action.id} className="flex gap-3 items-center">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={action.memberCreator?.avatarUrl || ""} />
                                <AvatarFallback className="text-[10px]">{getInitials(action.memberCreator?.name || "U")}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">
                                    {action.memberCreator?.name || action.memberCreator?.email || "Unknown"}
                                </span>
                                <span>
                                    {action.type === "createCard" && "đã tạo thẻ này"}
                                    {action.type === "updateCard" && "đã cập nhật thẻ này"}
                                    {!["createCard", "updateCard"].includes(action.type) && "đã thực hiện hoạt động"}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">
                                    {formatDistanceToNow(new Date(action.date), { addSuffix: true, locale: vi })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <p className="text-sm text-gray-500 italic pl-10">Chưa có hoạt động nào khác.</p>
                    )}
                </div>
            </div>
        </div >
    );
};
