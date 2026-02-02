import { useState } from "react";
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
import { X, UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { boardApi, type Member } from "@/shared/api/board.api";
import { tokenStorage } from "@/shared/utils/tokenStorage";

interface ManageMembersDialogProps {
    boardId: string;
    members: Member[];
    onUpdate: () => void;
    children?: React.ReactNode;
}

export function ManageMembersDialog({ boardId, members, onUpdate, children }: ManageMembersDialogProps) {
    const [open, setOpen] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);
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
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi xóa thành viên");
        } finally {
            setLoadingId(null);
        }
    };

    const isSelf = (userId: string) => currentUser?.id === userId;

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
                                    <p className="text-sm font-medium leading-none">{member.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                                </div>
                            </div>

                            {!isSelf(member.id) && (
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
            </DialogContent>
        </Dialog>
    );
}
