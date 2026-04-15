"use client"



import { NavUser } from "./sidebar-user"
import { NavWorkspaces } from "./sidebar-workspaces"
import { workspaceApi } from "@/shared/api/workspace.api"
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

import { tokenStorage } from "@/shared/utils/tokenStorage"
import { Link } from "react-router-dom"
import { ROUTES } from "@/shared/config"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [user, setUser] = useState<User | null>(null)

  const fetchWorkspaces = async () => {
    try {
      const wsResponse: any = await workspaceApi.getMyWorkspaces();
      const data = wsResponse.responseObject || wsResponse.data || [];
      if (Array.isArray(data)) {
        setWorkspaces(data);
      }
    } catch (e) {
      console.error(e)
      setWorkspaces([]);
    }
  };

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

      // console.log("User final:", currentUser);
      setUser(currentUser);
      await fetchWorkspaces();
    };

    initData();
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={workspaces} /> */}
        <Link
          to={ROUTES.DASHBOARD}
          title="Về Dashboard"
          className="group flex min-w-0 items-center gap-2 rounded-md px-4 py-2 text-sidebar-foreground outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold overflow-hidden transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
            <img src="/taskflow.png" alt="TaskFlow" className="w-full h-full object-contain p-1" />
          </div>
          <div className="truncate font-semibold text-lg group-data-[collapsible=icon]:hidden">
            TaskFlow
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavWorkspaces workspaces={workspaces} onDelete={fetchWorkspaces} />
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