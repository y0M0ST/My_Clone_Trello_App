import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/shared/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { UserX, Loader2, Plus, Link2, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { boardApi, type Member } from "@/shared/api/board.api";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import { InviteMemberDialog } from "./InviteMemberDialog";

interface ManageMembersDialogProps {
    boardId: string;
    members: Member[];
    /** Board đang có invite token (từ GET board) */
    hasInviteLink?: boolean;
    /** Owner/Admin: tạo & thu hồi link (khớp MEMBERS_INVITE / MEMBERS_MANAGE) */
    canManageInviteLink?: boolean;
    onUpdate: () => void;
    children?: React.ReactNode;
}

function unwrapInvitePayload(data: unknown): { link?: string; message?: string } {
    const d = data as { responseObject?: { link?: string; message?: string }; link?: string; message?: string };
    if (d?.responseObject && typeof d.responseObject === "object") return d.responseObject;
    return d ?? {};
}

export function ManageMembersDialog({
    boardId,
    members,
    hasInviteLink = false,
    canManageInviteLink = false,
    onUpdate,
    children,
}: ManageMembersDialogProps) {
    const [open, setOpen] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [shareBusy, setShareBusy] = useState(false);
    const [localHasLink, setLocalHasLink] = useState(hasInviteLink);

    useEffect(() => {
        setLocalHasLink(hasInviteLink);
    }, [hasInviteLink, open]);
    const currentUser = tokenStorage.getUser();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi bảng không?")) return;

        try {
            setLoadingId(userId);
            await boardApi.removeMember(boardId, userId);
            toast.success("Đã xóa thành viên thành công");
            onUpdate();
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Lỗi xóa thành viên");
        } finally {
            setLoadingId(null);
        }
    };

    const handleGenerateAndCopyLink = async () => {
        setShareBusy(true);
        try {
            const raw = await boardApi.generateInviteLink(boardId);
            const { link } = unwrapInvitePayload(raw);
            if (link) {
                await navigator.clipboard.writeText(link);
                toast.success("Đã tạo link và sao chép vào clipboard");
                setLocalHasLink(true);
            } else {
                toast.error("Không nhận được link từ server");
            }
            onUpdate();
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Không tạo được link mời");
        } finally {
            setShareBusy(false);
        }
    };

    const handleRevokeInviteLink = async () => {
        if (!confirm("Thu hồi link mời? Người khác sẽ không thể dùng link cũ nữa.")) return;
        setShareBusy(true);
        try {
            await boardApi.deleteInviteLink(boardId);
            toast.success("Đã thu hồi link mời");
            setLocalHasLink(false);
            onUpdate();
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Không thu hồi được link");
        } finally {
            setShareBusy(false);
        }
    };

    const isSelf = (userId: string) => currentUser?.id === userId;

    // Check if current user is Admin or Owner
    const currentUserMember = members.find(m => m.id === currentUser?.id);
    const roleName = currentUserMember?.roleName?.toLowerCase() || currentUserMember?.role?.name?.toLowerCase() || "";
    const canManageMembers = ["board_owner", "board_admin", "owner", "admin"].includes(roleName);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quản lý thành viên</DialogTitle>
                    <DialogDescription>
                        Danh sách các thành viên hiện tại trong bảng.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={member.avatarUrl || ""} />
                                    <AvatarFallback className="bg-sky-100 text-sky-600 font-bold">
                                        {getInitials(member.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                                        {member.name}
                                        {/* Helper to check role safely */}
                                        {(() => {
                                            const r = member.roleName?.toLowerCase() || member.role?.name?.toLowerCase() || "";
                                            if (r.includes('owner')) return <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded font-normal">Owner</span>;
                                            if (r.includes('admin')) return <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-normal">Admin</span>;
                                            if (r.includes('observer')) return <span className="text-[10px] bg-green-100 text-green-800 px-1 py-0.5 rounded font-normal">Observer</span>;
                                            if (r.includes('member')) return <span className="text-[10px] bg-gray-100 text-gray-800 px-1 py-0.5 rounded font-normal">Member</span>;
                                            return <span className="text-[10px] bg-gray-100 text-gray-800 px-1 py-0.5 rounded font-normal capitalize">{member.roleName || "Member"}</span>;
                                        })()}
                                        {member.memberStatus === "pending" && (
                                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-normal">Chờ chấp nhận</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                                </div>
                            </div>

                            {!isSelf(member.id) && canManageMembers && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                    disabled={loadingId === member.id}
                                    onClick={() => handleRemoveMember(member.id)}
                                    title="Xóa thành viên"
                                >
                                    {loadingId === member.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <UserX className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                            {isSelf(member.id) && (
                                <span className="text-xs text-gray-400 italic px-2">Bạn</span>
                            )}
                        </div>
                    ))}

                    {members.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4">Chưa có thành viên nào.</p>
                    )}
                </div>

                {canManageInviteLink && (
                    <div className="pt-4 mt-2 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Link2 className="h-3.5 w-3.5" /> Link mời vào bảng
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            Người nhận link cần đăng nhập, mở link rồi hệ thống sẽ thêm họ vào bảng.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full gap-2"
                                disabled={shareBusy}
                                onClick={() => void handleGenerateAndCopyLink()}
                            >
                                <Copy className="h-4 w-4" />
                                {shareBusy ? "Đang xử lý..." : "Tạo / làm mới link và sao chép"}
                            </Button>
                            {localHasLink && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full gap-2 text-destructive hover:text-destructive"
                                    disabled={shareBusy}
                                    onClick={() => void handleRevokeInviteLink()}
                                >
                                    <Trash2 className="h-4 w-4" /> Thu hồi link hiện tại
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                <div className="pt-4 mt-2 border-t flex justify-center">
                    <InviteMemberDialog boardId={boardId} onSuccess={onUpdate}>
                        <Button variant="outline" className="w-full gap-2 border-dashed">
                            <Plus className="h-4 w-4" /> Thêm thành viên
                        </Button>
                    </InviteMemberDialog>
                </div>
            </DialogContent>
        </Dialog>
    );
}
