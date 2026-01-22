"use client"

import { Kanban, LayoutDashboard } from "lucide-react"
import { NavMain } from "./sidebar-main"
import { NavUser } from "./sidebar-user"
import { TeamSwitcher } from "./sidebar-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/shared/ui/sidebar"

import { apiFactory } from "@/shared/api"
import { API_ENDPOINTS } from "@/shared/api/api-endpoint"
import type { Workspace, User } from "@/shared/types" 
import { useEffect, useState } from "react"
import { workspaceService } from "@/shared/api/services/workspaceService"
import { tokenStorage } from "@/shared/utils/tokenStorage"

interface WorkspaceWithLogo extends Workspace {
  logo: React.ElementType
}

const navMain = [
  {
    title: "All Boards",
    url: "#",
    icon: LayoutDashboard,
    isActive: true,
    items: [
      { title: "History", url: "#" },
      { title: "Starred", url: "#" },
      { title: "Settings", url: "#" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithLogo[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const initData = async () => {
      let currentUser = tokenStorage.getUser();
      if (!currentUser && tokenStorage.getAccessToken()) {
        try {
          const response = await apiFactory.get(API_ENDPOINTS.AUTH.ME);
          currentUser = response.responseObject; 
          if (currentUser) {
            tokenStorage.setUser(currentUser);
          }
        } catch (err) {
          console.error("Không lấy được thông tin user:", err);
        }
      }

      console.log("User final:", currentUser);
      setUser(currentUser);
      try {
        const wsResponse = await workspaceService.getAll();
        if (Array.isArray(wsResponse?.responseObject)) {
          setWorkspaces(wsResponse.responseObject.map(w => ({ ...w, logo: Kanban })));
        }
      } catch (e) { console.error(e) }
    };

    initData();
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={workspaces} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: user.avatarUrl || "https://github.com/shadcn.png",
            }}
          />
        ) : (
          <div className="p-4 text-xs text-muted-foreground text-center">
            Loading user...
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}