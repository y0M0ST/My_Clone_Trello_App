"use client"

import { ChevronRight, Kanban, MoreHorizontal, Plus, Briefcase, Archive } from "lucide-react"
import { workspaceApi } from "@/shared/api/workspace.api"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/shared/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarMenuAction,
    useSidebar,
} from "@/shared/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import type { Workspace } from "@/shared/types"
import { Link } from "react-router-dom"

export function NavWorkspaces({
    workspaces,
    onDelete,
}: {
    workspaces: Workspace[]
    onDelete?: () => void
}) {
    const { isMobile } = useSidebar()

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Bạn có chắc chắn muốn lưu trữ workspace "${title}" không?`)) return;
        try {
            await workspaceApi.delete(id);
            // toast.success("Đã xóa workspace thành công"); // Assuming direct usage or passed toast
            if (onDelete) onDelete();
        } catch (error) {
            console.error("Lỗi xóa workspace:", error);
            // toast.error("Không thể xóa workspace");
        }
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Your Workspaces</SidebarGroupLabel>
            <SidebarMenu>
                {workspaces.map((workspace) => (
                    <Collapsible
                        key={workspace.id}
                        asChild
                        defaultOpen={false}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip={workspace.title}>
                                    <Briefcase className="text-blue-600 shrink-0 pointer-events-none" />
                                    <span className="truncate font-medium">{workspace.title}</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {workspace.boards && workspace.boards.length > 0 ? (
                                        workspace.boards.map((board: any) => (
                                            <SidebarMenuSubItem key={board.id} className="min-w-0">
                                                <SidebarMenuSubButton asChild>
                                                    <Link to={`/boards/${board.id}`} className="flex items-center w-full min-w-0 group/link">
                                                        <Kanban className="w-4 h-4 mr-2 opacity-70 shrink-0" />
                                                        <span className="truncate flex-1 text-left block" title={board.title}>
                                                            {board.title}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))
                                    ) : (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton className="text-muted-foreground italic cursor-default">
                                                <span>No boards yet</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                    {/* Option to create new board could go here */}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                            {/* Optional: Action menu for workspace */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuAction showOnHover>
                                        <MoreHorizontal />
                                        <span className="sr-only">More</span>
                                    </SidebarMenuAction>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-48 rounded-lg"
                                    side={isMobile ? "bottom" : "right"}
                                    align={isMobile ? "end" : "start"}
                                >
                                    <DropdownMenuItem>
                                        <Plus className="text-muted-foreground mr-2 h-4 w-4" />
                                        <span>New Board</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Briefcase className="text-muted-foreground mr-2 h-4 w-4" />
                                        <span>View Workspace</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                                        onClick={() => handleDelete(workspace.id, workspace.title)}
                                    >
                                        <Archive className="mr-2 h-4 w-4" />
                                        <span>Lưu trữ không gian làm việc</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
