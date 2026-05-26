
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
    Activity, Archive, Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Card } from "@/shared/api/board.api";
import type { Member } from "@/shared/api/board.api";
import { cardApi } from "@/shared/api/card.api";
import { toast } from "sonner";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import { CardDescription } from "@/features/board/components/card-detail/CardDescription";
import { CardMembers } from "@/features/board/components/card-detail/CardMembers";
import { CardChecklist } from "@/features/board/components/card-detail/CardChecklist";
import { CardActivity } from "@/features/board/components/card-detail/CardActivity";
import { CardLabels } from "@/features/board/components/card-detail/CardLabels";
import { CardDate } from "@/features/board/components/card-detail/CardDate";
import { CardAttachments } from "@/features/board/components/card-detail/CardAttachments";

import type { BoardDetail } from "@/shared/api/board.api";

interface Props {
    card: Card;
    open: boolean;
    onClose: () => void;
    onUpdate: () => void;
    members?: Member[]; // Available board members
    labels?: any[]; // Available board labels
    board?: BoardDetail;
    /** Tăng khi board refetch (socket / manual) — đồng bộ tab chi tiết thẻ */
    boardSyncEpoch?: number;
}

export function CardDetailDialog({ card, open, onClose, onUpdate, members = [], labels = [], board, boardSyncEpoch = 0 }: Props) {
    const [title, setTitle] = useState(card.title);

    useEffect(() => {
        setTitle(card.title);
    }, [card.title]);

    const handleUpdateTitle = async () => {
        if (title === card.title) return;
        try {
            await cardApi.update(card.id, { title });
            onUpdate();
        } catch (error) {
            toast.error("Lỗi cập nhật tên thẻ");
        }
    };

    const handleArchive = async () => {
        if (!confirm("Bạn có chắc chắn muốn lưu trữ thẻ này?")) return;
        try {
            await cardApi.update(card.id, { isArchived: true });
            toast.success("Đã lưu trữ thẻ");
            onUpdate();
            onClose();
        } catch (error) {
            toast.error("Lỗi lưu trữ thẻ");
        }
    };

    const handleDelete = async () => {
        if (!confirm("CẢNH BÁO: HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!\n\nBạn có chắc chắn muốn xóa vĩnh viễn thẻ này?")) return;
        try {
            await cardApi.delete(card.id);
            toast.success("Đã xóa thẻ vĩnh viễn");
            onClose();
            onUpdate();
        } catch (error) {
            toast.error("Lỗi khi xóa thẻ");
        }
    };

    const currentUser = tokenStorage.getUser();
    const currentMember = board?.members.find(m => m.id === currentUser?.id);
    const roleName = currentMember?.roleName?.toLowerCase() || currentMember?.role?.name?.toLowerCase() || "";
    const isObserver = roleName.includes("observer");
    // Explicitly check for owner/admin/member or just explicitly deny observer?
    // User said "Observer cannot do anything".
    // Safer to whitelist: Owner, Admin, Member can edit. Observer cannot.
    // Or just simple: !isObserver && !isPublicVisitor?
    // Let's use: canEdit = !isObserver (assuming member is default active)
    const canEdit = !isObserver;

    if (!card) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[70vw] w-full h-[60vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl shadow-xl bg-[#F4F5F7] border-0 top-[32%]">
                <DialogTitle className="sr-only">Chi tiết thẻ</DialogTitle>
                <DialogDescription className="sr-only">Xem và chỉnh sửa chi tiết thẻ</DialogDescription>
                {/* --- HEADER --- */}
                <div className="relative pt-6 px-6 pb-2 bg-[#F4F5F7]">
                    <div className="flex items-start gap-4 mb-4">
                        <Activity className="h-6 w-6 text-gray-700 mt-1" /> {/* Icon card */}
                        <div className="flex-1">
                            <Input
                                value={title}
                                maxLength={100}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleUpdateTitle}
                                disabled={!canEdit}
                                className={`text-xl font-bold border-transparent bg-transparent px-2 py-1 -ml-2 w-full shadow-none h-auto ${canEdit ? "focus:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600" : "cursor-default"}`}
                            />
                            <p className="text-sm text-gray-500 px-1 mt-1">
                                trong danh sách <span className="underline decoration-dotted cursor-pointer">{card.listTitle || "Danh sách này"}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT & SIDEBAR --- */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-8 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] lg:grid-cols-[2.5fr_0.8fr_2fr] gap-6">

                        {/* --- COLUMN 1: Main Content --- */}
                        <div className="space-y-8">

                            {/* Properties (Members, Labels, Date) */}
                            <div className="flex flex-wrap gap-6">
                                <CardMembers
                                    cardId={card.id}
                                    members={card.members || []}
                                    boardMembers={members}
                                    onUpdate={onUpdate}
                                    canEdit={canEdit}
                                />
                                <CardLabels
                                    cardId={card.id}
                                    labels={card.labels || []}
                                    boardLabels={labels}
                                    onUpdate={onUpdate}
                                    canEdit={canEdit}
                                />
                                <CardDate
                                    cardId={card.id}
                                    dueDate={card.due}
                                    startDate={card.start} // Pass start date
                                    dueReminder={card.dueReminder} // Pass reminder
                                    isCompleted={card.isCompleted}
                                    onUpdate={onUpdate}
                                    canEdit={canEdit}
                                />
                            </div>

                            {/* Description */}
                            <CardDescription
                                cardId={card.id}
                                initialDescription={card.description}
                                onUpdate={onUpdate}
                                canEdit={canEdit}
                            />

                            {/* Attachments */}
                            <CardAttachments
                                cardId={card.id}
                                attachments={card.attachments || []}
                                onUpdate={onUpdate}
                                canEdit={canEdit}
                            />

                            {/* Checklists */}
                            <CardChecklist
                                cardId={card.id}
                                canEdit={canEdit}
                                boardSyncEpoch={boardSyncEpoch}
                            />

                        </div>

                        {/* --- COLUMN 2: Sidebar Actions --- */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Thao tác</span>
                                {canEdit && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full justify-start bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-600 h-8 font-normal shadow-sm"
                                            onClick={handleArchive}
                                        >
                                            <Archive className="w-3.5 h-3.5 mr-2" /> Lưu trữ
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full justify-start bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-600 h-8 font-normal shadow-sm mt-2"
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa vĩnh viễn
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* --- COLUMN 3: Activity & Comments --- */}
                        <div className="flex flex-col h-full border-l pl-6 border-gray-200">
                            <CardActivity
                                cardId={card.id}
                                board={board}
                                canEdit={canEdit}
                                boardSyncEpoch={boardSyncEpoch}
                            />
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
