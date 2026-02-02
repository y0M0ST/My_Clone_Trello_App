import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import {
    UserPlus, Tag, CheckSquare, Paperclip, Clock,
    AlignLeft, Activity
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Card } from "@/shared/api/board.api";
import { cardApi } from "@/shared/api/card.api";
import { toast } from "sonner";

interface Props {
    card: Card;
    open: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function CardDetailDialog({ card, open, onClose, onUpdate }: Props) {
    const [description, setDescription] = useState(card.description || "");
    const [comment, setComment] = useState("");

    useEffect(() => {
        setDescription(card.description || "");
        setComment("");
    }, [card]);

    const handleSaveDescription = async () => {
        if (description === card.description) return;
        try {
            await cardApi.update(card.id, { description });
            onUpdate();
            toast.success("Đã cập nhật mô tả");
        } catch (error) {
            toast.error("Lỗi cập nhật mô tả");
        }
    };

    const handleArchive = async () => {
        if (!confirm("Bạn có chắc chắn muốn lưu trữ thẻ này?")) return;
        try {
            await cardApi.update(card.id, { isArchived: true });
            onUpdate();
            onClose();
            toast.success("Đã lưu trữ thẻ");
        } catch (error) {
            toast.error("Lỗi lưu trữ thẻ");
        }
    };

    // Auto-save description on blur
    const handleDescriptionBlur = () => {
        handleSaveDescription();
    };

    if (!card) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-6 gap-6 overflow-hidden sm:rounded-xl shadow-xl bg-white/90 backdrop-blur-lg">
                {/* --- 1. HEADER & TOOLBAR (Horizontal) --- */}
                <div className="flex flex-col border-b bg-white z-10">
                    <div className="px-6 py-4 pb-2">
                        <DialogTitle className="text-xl font-bold flex items-start gap-3 text-gray-800">
                            <AlignLeft className="h-5 w-5 text-gray-500" />
                            <div className="flex flex-col gap-1 w-full">
                                <Input
                                    defaultValue={card.title}
                                    readOnly
                                    className="text-xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 px-2 -ml-2 text-gray-700"
                                />
                                <p className="text-sm font-normal text-gray-500 px-1">
                                    trong danh sách <span className="underline decoration-dotted">Tạm thời</span>
                                </p>
                            </div>
                        </DialogTitle>
                    </div>

                    {/* 🔥 HORIZONTAL TOOLBAR */}
                    <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar bg-gray-50/50 border-t">
                        <span className="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap mr-2">
                            Thêm vào thẻ:
                        </span>
                        <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-blue-50 hover:text-blue-600 border-dashed">
                            <UserPlus className="w-3.5 h-3.5 mr-2" /> Thành viên
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-blue-50 hover:text-blue-600 border-dashed">
                            <Tag className="w-3.5 h-3.5 mr-2" /> Nhãn
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-blue-50 hover:text-blue-600 border-dashed">
                            <CheckSquare className="w-3.5 h-3.5 mr-2" /> Việc cần làm
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-blue-50 hover:text-blue-600 border-dashed">
                            <Clock className="w-3.5 h-3.5 mr-2" /> Ngày
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-blue-50 hover:text-blue-600 border-dashed">
                            <Paperclip className="w-3.5 h-3.5 mr-2" /> Đính kèm
                        </Button>
                        <div className="flex-1"></div>
                        <Button variant="ghost" size="sm" onClick={handleArchive} className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700">
                            Lưu trữ
                        </Button>
                    </div>
                </div>

                {/* --- 2. MAIN CONTENT (50/50 Split) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden h-full">
                    {/* LEFT COLUMN (50%): Activity & Comments */}
                    <div className="flex flex-col h-full border-r bg-gray-50/30 order-2 md:order-1">
                        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-gray-50/30 backdrop-blur z-10">
                            <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                                <Activity className="w-4 h-4" /> Hoạt động
                            </h3>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Hiện chi tiết</Button>
                        </div>

                        {/* List Comment & History */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Input Comment */}
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <Textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Viết bình luận..."
                                        className="min-h-[80px] bg-white resize-none"
                                    />
                                    <div className="flex justify-end">
                                        <Button size="sm" disabled={!comment.trim()}>Lưu</Button>
                                    </div>
                                </div>
                            </div>

                            {/* History Items (Mock) */}
                            <div className="flex gap-3 items-start opacity-75">
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarFallback>M</AvatarFallback>
                                </Avatar>
                                <div className="text-sm">
                                    <span className="font-semibold">Member</span> đã thêm thẻ này
                                    <div className="text-xs text-muted-foreground mt-0.5">Vừa xong</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (50%): Description & Details */}
                    <div className="flex flex-col h-full overflow-y-auto p-6 gap-8 bg-white order-1 md:order-2">
                        {/* Description */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm uppercase tracking-wide">
                                <AlignLeft className="w-4 h-4" /> Mô tả
                            </h3>
                            <div className="relative group">
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleDescriptionBlur}
                                    placeholder="Thêm mô tả chi tiết hơn..."
                                    className="min-h-[120px] resize-none bg-gray-50 border-gray-200 focus:bg-white transition-all p-3"
                                />
                                <div className="absolute bottom-2 right-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <Button size="sm" onClick={handleSaveDescription}>Lưu</Button>
                                </div>
                            </div>
                        </div>

                        {/* Checklist (Example) */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm uppercase tracking-wide">
                                    <CheckSquare className="w-4 h-4" /> Việc cần làm
                                </h3>
                                <Button variant="secondary" size="sm" className="h-6 text-xs" onClick={() => toast.info("Tính năng đang phát triển")}>Xóa</Button>
                            </div>

                            <div className="space-y-2">
                                {/* Progress Bar */}
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-medium w-8">0%</span>
                                    <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-0 rounded-full" />
                                    </div>
                                </div>

                                <div className="text-center text-sm text-gray-400 py-2">
                                    Chưa có mục nào
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>


    );
}
