import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { boardApi, type BoardDetail, type BoardVisibility } from "@/shared/api/board.api";
import { listApi } from "@/shared/api/list.api";
import { ListColumn } from "@/features/board/components/ListColumn";
import { CreateListForm } from "@/features/board/components/CreateListForm";
import { apiFactory } from "@/shared/api";
import {
    Loader2,
    Globe,
    Lock,
    Users,
    Share2,
    MoreHorizontal,
    Image as ImageIcon,
    Check,
    ChevronDown
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/popover";
import { toast } from "sonner";

import {
    DndContext,
    closestCorners,
    useSensor,
    useSensors,
    PointerSensor,
    type DragEndEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove
} from "@dnd-kit/sortable";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Send } from "lucide-react";

const VISIBILITY_OPTIONS = [
    {
        value: "private",
        label: "Riêng tư",
        icon: Lock,
        description: "Chỉ thành viên của bảng mới có thể xem và chỉnh sửa.",
    },
    {
        value: "workspace",
        label: "Không gian làm việc",
        icon: Users,
        description: "Tất cả thành viên trong Workspace có thể xem bảng này.",
    },
    {
        value: "public",
        label: "Công khai",
        icon: Globe,
        description: "Bất kỳ ai trên internet đều có thể xem (chỉ thành viên mới được sửa).",
    },
];

const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
};

const BoardPage = () => {
    const { boardId } = useParams();
    const [board, setBoard] = useState<BoardDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [roles, setRoles] = useState<any[]>([]); 
    const [selectedRoleId, setSelectedRoleId] = useState<string>(""); 

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res: any = await apiFactory.get("/roles");
                let data = res.responseObject || res.data || res;
                if (!Array.isArray(data)) {
                    if (data.roles) data = data.roles; 
                    else if (data.items) data = data.items; 
                    else {
                        console.warn("⚠️ API /roles trả về định dạng lạ:", data);
                        data = []; 
                    }
                }

                setRoles(data);

                if (data.length > 0) {
                    const defaultRole = data.find((r: any) => r.name === 'Member') || data[0];
                    if (defaultRole) setSelectedRoleId(defaultRole.id);
                }
            } catch (err) {
                console.error("Lỗi lấy roles:", err);
                setRoles([]); 
            }
        };
        fetchRoles();
    }, []);

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) return;
        if (!selectedRoleId) {
            toast.error("Vui lòng chọn quyền thành viên!");
            return;
        }

        setIsInviting(true);
        try {
            await boardApi.inviteMember(boardId!, inviteEmail.trim());
            toast.success(`Đã mời ${inviteEmail} thành công!`);
            setInviteEmail("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi gửi lời mời");
        } finally {
            setIsInviting(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
    );

    const fetchBoardData = useCallback(async () => {
        if (!boardId) return;
        try {
            const response: any = await boardApi.getDetail(boardId);
            const boardData = response.responseObject || response.data || response;

            if (boardData.lists) {
                boardData.lists.sort((a: any, b: any) => a.position - b.position);
            }

            console.log("🔥 Board Data:", boardData);
            setBoard(boardData);
        } catch (error) {
            console.error("Lỗi tải board:", error);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        fetchBoardData();
    }, [fetchBoardData]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !board) return;
        if (active.id !== over.id) {
            const oldIndex = board.lists.findIndex(l => l.id === active.id);
            const newIndex = board.lists.findIndex(l => l.id === over.id);
            const newLists = arrayMove(board.lists, oldIndex, newIndex);

            setBoard({ ...board, lists: newLists });

            try {
                const currentListId = newLists[newIndex].id;
                const prevListId = newLists[newIndex - 1]?.id || null;
                const nextListId = newLists[newIndex + 1]?.id || null;
                await listApi.reorder(currentListId, prevListId, nextListId);
            } catch (error) {
                toast.error("Lỗi cập nhật vị trí");
                fetchBoardData(); 
            }
        }
    };

    const handleChangeVisibility = async (newVisibility: BoardVisibility) => {
        if (!board || board.visibility === newVisibility) return;

        setIsUpdatingVisibility(true);
        const oldVisibility = board.visibility;
        setBoard({ ...board, visibility: newVisibility });

        try {
            await boardApi.update(board.id, { visibility: newVisibility });
            toast.success(`Đã chuyển sang chế độ ${newVisibility}`);
        } catch (error) {
            toast.error("Lỗi cập nhật chế độ hiển thị");
            setBoard({ ...board, visibility: oldVisibility }); 
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    const MAX_MEMBERS_SHOW = 5;
    const members = board?.members || [];
    const displayedMembers = members.slice(0, MAX_MEMBERS_SHOW);
    const hiddenMembersCount = members.length - MAX_MEMBERS_SHOW;
    const currentVisibility = VISIBILITY_OPTIONS.find(v => v.value === board?.visibility) || VISIBILITY_OPTIONS[0];
    const CurrentIcon = currentVisibility.icon;

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!board) return <div>Not found</div>;

    return (
        <div
            className="h-[calc(100vh-4rem)] w-full flex flex-col bg-cover bg-center transition-all duration-500"
            style={{ backgroundImage: `url('${board.coverUrl || "https://images.unsplash.com/photo-1519681393784-d8e5b5a4570e?q=80&w=2070"}')` }}
        >

            <div className="h-14 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 shrink-0 border-b border-white/10">

                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white shadow-sm cursor-pointer hover:bg-white/20 px-3 py-1 rounded transition">
                        {board.title}
                    </h1>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white bg-white/10 hover:bg-white/20 h-8 px-3 border border-transparent hover:border-white/30 transition-all"
                                disabled={isUpdatingVisibility}
                            >
                                <CurrentIcon className="h-4 w-4 mr-2" />
                                <span className="capitalize hidden sm:inline">{currentVisibility.label}</span>
                                <ChevronDown className="h-3 w-3 ml-2 opacity-70" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent align="start" className="w-[340px] p-0 bg-white shadow-xl rounded-xl">
                            <div className="p-4 border-b">
                                <h4 className="font-semibold text-center text-gray-800">Chế độ hiển thị</h4>
                            </div>
                            <div className="p-2 flex flex-col gap-1">
                                {VISIBILITY_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = board.visibility === option.value;

                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => handleChangeVisibility(option.value as BoardVisibility)}
                                            className={`
                        relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                        ${isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-100"}`}
                                        >
                                            <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                                                    {option.label}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1 leading-tight">
                                                    {option.description}
                                                </p>
                                            </div>
                                            {isSelected && <Check className="h-4 w-4 text-blue-600 mt-1" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 mr-2">
                        <TooltipProvider>
                            {displayedMembers.map((member: any) => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-pointer">
                                            <Avatar className="h-8 w-8 border-2 border-transparent hover:border-white transition ring-2 ring-black/10">
                                                <AvatarImage
                                                    src={member.avatarUrl || ""}
                                                    alt={member.name}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                                                    {getInitials(member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p className="font-semibold">{member.name || "Unnamed"}</p>
                                        <p className="text-xs text-gray-400">{member.email}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}

                            {hiddenMembersCount > 0 && (
                                <div className="h-8 w-8 rounded-full bg-gray-700/90 backdrop-blur flex items-center justify-center text-xs text-white font-bold border-2 border-transparent cursor-pointer hover:bg-gray-600 ring-2 ring-black/10 z-10">
                                    +{hiddenMembersCount}
                                </div>
                            )}
                        </TooltipProvider>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className="bg-white/90 hover:bg-white text-gray-900 h-8 px-3 ml-2 font-medium shadow-sm transition-colors">
                                <Share2 className="h-4 w-4 mr-2" />
                                Chia sẻ
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent align="end" className="w-80 p-4">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold leading-none">Mời vào bảng</h4>
                                    <p className="text-sm text-gray-500">Chọn thành viên và phân quyền.</p>
                                </div>

                                <div className="flex flex-col gap-3">

                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                                        <Input
                                            id="invite-email"
                                            placeholder="name@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold">Tư cách thành viên</Label>
                                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Chọn quyền..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles?.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        size="sm"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-1"
                                        onClick={handleInviteMember}
                                        disabled={isInviting || !inviteEmail || !selectedRoleId}
                                    >
                                        {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                        Gửi lời mời
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel>Menu bảng</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast.info("Mở modal đổi hình nền")}>
                                <ImageIcon className="mr-2 h-4 w-4" /> Đổi hình nền
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Users className="mr-2 h-4 w-4" /> Quản lý thành viên
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                Đóng bảng này
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>

            <div className="flex-1 overflow-x-auto p-4 custom-scrollbar">
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                    <div className="flex h-full gap-4 items-start pb-2">
                        <SortableContext items={board.lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
                            {board.lists.map((list) => (
                                <ListColumn key={list.id} list={list} onReload={fetchBoardData} />
                            ))}
                        </SortableContext>
                        <CreateListForm boardId={boardId!} onSuccess={fetchBoardData} />
                    </div>
                </DndContext>
            </div>

        </div>
    );
};

export default BoardPage;