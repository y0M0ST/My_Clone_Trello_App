import {
    Folder,
    MoreHorizontal,
    Share,
    Trash2,
    Layout,
    ChevronRight,
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/shared/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { Link } from "react-router-dom"; // Hoặc dùng a tag nếu chưa config Link

// Định nghĩa lại type cho chắc ăn (hoặc import từ file type của bà)
interface Board {
    id: string;
    title: string;
    // ...
}

interface Workspace {
    id: string;
    name: string;
    boards: Board[]; // Quan trọng: Phải có mảng boards
    // ...
}

interface NavWorkspacesProps {
    workspaces: Workspace[];
}

export function NavWorkspaces({ workspaces }: NavWorkspacesProps) {
    const { isMobile } = useSidebar();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
            <SidebarMenu>
                {workspaces.map((ws) => (
                    <Collapsible key={ws.id} asChild defaultOpen={false} className="group/collapsible">
                        <SidebarMenuItem>
                            {/* Trigger để mở/đóng Workspace */}
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip={ws.name}>
                                    <Folder className="h-4 w-4" /> {/* Icon Folder cho Workspace */}
                                    <span>{ws.name}</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>

                            {/* Nội dung xổ xuống: Danh sách Boards */}
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {ws.boards && ws.boards.length > 0 ? (
                                        ws.boards.map((board) => (
                                            <SidebarMenuSubItem key={board.id}>
                                                <SidebarMenuSubButton asChild>
                                                    <Link to={`/boards/${board.id}`}>
                                                        <Layout className="h-4 w-4 mr-2" /> {/* Icon Layout cho Board */}
                                                        <span>{board.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))
                                    ) : (
                                        <SidebarMenuSubItem>
                                            <span className="text-xs text-muted-foreground px-2 py-1">Trống trơn à...</span>
                                        </SidebarMenuSubItem>
                                    )}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}