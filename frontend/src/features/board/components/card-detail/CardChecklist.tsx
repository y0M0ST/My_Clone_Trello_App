import { useState, useEffect, useRef } from "react";
import { CheckSquare, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Progress } from "@/shared/ui/progress";
import { cardApi } from "@/shared/api/card.api";
import { toast } from "sonner";
import { Checkbox } from "@/shared/ui/checkbox";

interface CheckItem {
    id: string;
    name: string;
    isChecked: boolean;
    position: number;
}

interface Checklist {
    id: string;
    name: string;
    position: number;
    checkItems: CheckItem[];
}

interface Props {
    cardId: string;
    canEdit?: boolean;
    boardSyncEpoch?: number;
}

export const CardChecklist = ({ cardId, canEdit = true, boardSyncEpoch = 0 }: Props) => {
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newChecklistName, setNewChecklistName] = useState("Việc cần làm");

    // Helper state for adding items to specific checklist
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState("");
    const [hiddenCompleted, setHiddenCompleted] = useState<Record<string, boolean>>({});

    const fetchChecklists = async () => {
        try {
            const response: any = await cardApi.getChecklists(cardId);
            const data = response.responseObject || response.data || response;
            // Ensure data is array
            setChecklists(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch checklists:", error);
        }
    };

    useEffect(() => {
        void fetchChecklists();
    }, [cardId, boardSyncEpoch]);

    const handleCreateChecklist = async () => {
        if (!newChecklistName.trim()) return;
        try {
            await cardApi.createChecklist(cardId, newChecklistName, checklists.length);
            toast.success("Đã tạo danh sách công việc");
            setIsCreating(false);
            setNewChecklistName("Việc cần làm");
            fetchChecklists();
        } catch (error) {
            toast.error("Lỗi khi tạo danh sách");
        }
    };

    const handleDeleteChecklist = async (checklistId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa danh sách công việc này ? Hành động này sẽ không thể hoàn tác !")) return;

        // Optimistic update
        const previousChecklists = [...checklists];
        setChecklists(prev => prev.filter(c => c.id !== checklistId));

        try {
            await cardApi.deleteChecklist(cardId, checklistId);
            toast.success("Đã xóa danh sách");
        } catch (error: any) {
            console.error("Delete checklist error", error);
            toast.error("Lỗi xóa danh sách: " + (error?.message || "Không xác định"));
            setChecklists(previousChecklists); // Revert
        }
    };

    const inputRef = useRef<HTMLInputElement>(null);

    const handleAddItem = async (checklistId: string) => {
        if (!newItemName.trim()) return;
        // console.log("Adding item:", { cardId, checklistId, newItemName }); 
        try {
            const checklist = checklists.find(c => c.id === checklistId);
            const position = checklist?.checkItems?.length || 0;
            // console.log("Payload:", { content: newItemName, position });
            await cardApi.createCheckItem(cardId, checklistId, newItemName, position);
            toast.success("Đã thêm mục");
            // setAddingItemTo(null); // Keep open for multiple entry
            setNewItemName("");
            fetchChecklists();
            // Focus back to input
            setTimeout(() => inputRef.current?.focus(), 0);
        } catch (error) {
            console.error("Add item error:", error);
            toast.error("Lỗi khi thêm mục");
        }
    };

    const handleToggleItem = async (checklistId: string, itemId: string, isChecked: boolean) => {
        // Optimistic update
        setChecklists(prev => prev.map(cl => {
            if (cl.id !== checklistId) return cl;
            const updatedItems = cl.checkItems.map(item =>
                item.id === itemId ? { ...item, isChecked } : item
            );

            // Auto hide if all completed
            const allCompleted = updatedItems.length > 0 && updatedItems.every(i => i.isChecked);
            if (allCompleted && isChecked) {
                setHiddenCompleted(prev => ({ ...prev, [checklistId]: true }));
            }

            return {
                ...cl,
                checkItems: updatedItems
            };
        }));

        try {
            await cardApi.updateCheckItem(cardId, checklistId, itemId, { isChecked });
        } catch (error) {
            toast.error("Lỗi cập nhật trạng thái");
            fetchChecklists(); // Revert
        }
    };

    const handleDeleteItem = async (checklistId: string, itemId: string) => {
        // Optimistic update
        const previousChecklists = [...checklists];
        setChecklists(prev => prev.map(cl => {
            if (cl.id !== checklistId) return cl;
            return {
                ...cl,
                checkItems: cl.checkItems.filter(item => item.id !== itemId)
            };
        }));

        try {
            await cardApi.deleteCheckItem(cardId, checklistId, itemId);
        } catch (error) {
            console.error("Delete item error", error);
            toast.error("Lỗi khi xóa mục");
            setChecklists(previousChecklists); // Revert
        }
    };

    const calculateProgress = (items: CheckItem[]) => {
        if (!items || items.length === 0) return 0;
        const checked = items.filter(i => i.isChecked).length;
        return Math.round((checked / items.length) * 100);
    };

    return (
        <div className="space-y-6">
            {checklists.map((checklist) => {
                const totalItems = checklist.checkItems?.length || 0;
                const completedItems = checklist.checkItems?.filter(i => i.isChecked).length || 0;
                const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
                const isHidden = hiddenCompleted[checklist.id];
                const visibleItems = checklist.checkItems?.filter(item => !isHidden || !item.isChecked) || [];

                return (
                    <div key={checklist.id} className="space-y-3">
                        <div className="flex items-center justify-between group">
                            <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm tracking-wide">
                                <CheckSquare className="w-4 h-4" /> {checklist.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                {totalItems > 0 && completedItems > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setHiddenCompleted(prev => ({ ...prev, [checklist.id]: !isHidden }))}
                                        className="h-7 px-2 text-xs font-medium text-gray-500 hover:bg-gray-200"
                                    >
                                        {isHidden
                                            ? `Hiển thị các mục đã chọn (${completedItems})`
                                            : `Ẩn các mục đã chọn (${completedItems})`}
                                    </Button>
                                )}
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeleteChecklist(checklist.id)}
                                    >
                                        <Trash2 className="w-4 h-4" /> Xóa
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 w-8">{progress}%</span>
                                <Progress value={progress} className="h-2 flex-1" />
                            </div>
                            {progress === 100 && isHidden && (
                                <p className="text-sm text-green-600 italic ml-11">
                                    Mọi thứ trong danh sách công việc này đều đã hoàn tất!
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            {visibleItems.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 group/item">
                                    <Checkbox
                                        checked={item.isChecked}
                                        onCheckedChange={(checked) => handleToggleItem(checklist.id, item.id, checked as boolean)}
                                        className="mt-1"
                                        disabled={!canEdit}
                                    />
                                    <span className={`text-sm flex-1 break-words transition-colors ${item.isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                        {item.name}
                                    </span>
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-gray-400 hover:text-red-500"
                                            onClick={() => handleDeleteItem(checklist.id, item.id)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {addingItemTo === checklist.id ? (
                            <div className="space-y-2 pl-7">
                                <Input
                                    ref={inputRef}
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="Thêm một mục..."
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddItem(checklist.id);
                                        }
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={() => handleAddItem(checklist.id)}>Thêm</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setAddingItemTo(null)}>Hủy</Button>
                                </div>
                            </div>
                        ) : (
                            canEdit && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="ml-0 mt-2"
                                    onClick={() => {
                                        setAddingItemTo(checklist.id);
                                        setNewItemName("");
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Thêm một mục
                                </Button>
                            )
                        )}
                    </div>
                );
            })}

            {/* Create new checklist button/form */}
            {isCreating ? (
                <div className="space-y-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                    <Input
                        value={newChecklistName}
                        onChange={(e) => setNewChecklistName(e.target.value)}
                        placeholder="Việc cần làm"
                        autoFocus
                    />
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleCreateChecklist}>Thêm</Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Hủy</Button>
                    </div>
                </div>
            ) : (
                canEdit && (
                    <Button
                        variant="outline"
                        className="w-full justify-start text-gray-600"
                        onClick={() => setIsCreating(true)}
                    >
                        <CheckSquare className="w-4 h-4 mr-2" /> Thêm danh sách công việc
                    </Button>
                )
            )}
        </div>
    );
};
