import { useState } from "react";
import { listApi } from "@/shared/api/list.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
    boardId: string;
    onSuccess: () => void; 
}

export const CreateListForm = ({ boardId, onSuccess }: Props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            await listApi.create(boardId, title);
            toast.success("Tạo List thành công! ✨");
            setTitle("");
            setIsEditing(false); 
            onSuccess(); 
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi tạo List.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="w-72 shrink-0 bg-[#f1f2f4] p-3 rounded-xl shadow-md h-fit">
                <form onSubmit={handleSubmit}>
                    <Input
                        autoFocus
                        placeholder="Nhập tiêu đề danh sách..."
                        className="mb-2 bg-white border-blue-500 border-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={isLoading}>
                            {isLoading ? "Đang tạo..." : "Thêm danh sách"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditing(false)}
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    // 2. Trạng thái Nút bấm ban đầu
    return (
        <div className="w-72 shrink-0">
            <Button
                onClick={() => setIsEditing(true)}
                className="w-full justify-start bg-black/20 hover:bg-black/10 text-white font-semibold backdrop-blur-sm h-12 transition-all"
            >
                <Plus className="h-5 w-5 mr-2" />
                Thêm danh sách khác
            </Button>
        </div>
    );
};