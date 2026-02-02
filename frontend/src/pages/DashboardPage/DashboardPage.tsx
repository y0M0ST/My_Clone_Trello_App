"use client"

import { useEffect, useState, useCallback } from "react"
import { AppSidebar } from "@/features/sidebar"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { CreateWorkspaceDialog } from "@/features/workspace/CreateWorkspaceDialog"
import { CreateBoardDialog } from "@/features/board/CreateBoardDialog"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/ui/sidebar"
import { useNavigate } from "react-router-dom";
import { Plus, ChartNoAxesColumn, Users, Lock, Globe } from "lucide-react"
import { workspaceApi } from "@/shared/api/workspace.api"

interface Board {
  id: string
  title: string
  description?: string
  coverUrl?: string
  visibility: 'private' | 'public'
}

interface WorkspaceRole {
  id: string
  name: string
}

interface Workspace {
  id: string
  title: string
  description?: string
  visibility: 'private' | 'public'
  myRole?: WorkspaceRole
  boards?: Board[]
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true)
      const response: any = await workspaceApi.getMyWorkspaces()
      console.log("🔥 API Response:", response)
      const data = response.responseObject || response.data || []
      setWorkspaces(data)
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading workspaces...</p>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Your Workspaces</h2>
              <p className="text-muted-foreground mt-1">
                Manage your workspaces and boards efficiently.
              </p>
            </div>

            <CreateWorkspaceDialog onSuccess={fetchWorkspaces}>
              <Button size="lg" className="shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                New Workspace
              </Button>
            </CreateWorkspaceDialog>
          </div>

          <Separator />

          <div className="space-y-10">
            {workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/50">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ChartNoAxesColumn className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No workspaces found</h3>
                <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                  You haven't created any workspaces yet. Start by creating one to organize your boards.
                </p>
                <CreateWorkspaceDialog onSuccess={fetchWorkspaces}>
                  <Button variant="outline">Create Workspace</Button>
                </CreateWorkspaceDialog>
              </div>
            ) : (
              workspaces.map((workspace) => (
                <div key={workspace.id} className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                        {workspace.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold tracking-tight truncate" title={workspace.title}>
                            {workspace.title}
                          </h3>
                          <div className="flex shrink-0 gap-2">
                            {workspace.myRole && (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 shrink-0">
                                {workspace.myRole.name.replace('workspace_', '')}
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 capitalize shrink-0">
                              {workspace.visibility === 'public' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                              {workspace.visibility}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-md truncate" title={workspace.description}>
                          {workspace.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <CreateBoardDialog workspaceId={workspace.id} onSuccess={fetchWorkspaces}>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Board
                      </Button>
                    </CreateBoardDialog>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(!workspace.boards || workspace.boards.length === 0) ? (
                      <div className="col-span-full py-8 text-center bg-muted/30 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">No boards in this workspace yet.</p>
                      </div>
                    ) : (
                      workspace.boards.map((board) => (
                        <Card
                          key={board.id}
                          className="group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                          onClick={() => navigate(`/boards/${board.id}`)}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 opacity-0 transition-opacity group-hover:opacity-100" />

                          <CardHeader className="pb-3 min-w-0">
                            <CardTitle className="text-base font-semibold leading-tight flex items-start gap-2 min-w-0">
                              <span
                                className="min-w-0 flex-1 truncate"
                                title={board.title}
                              >
                                {board.title}
                              </span>

                              {board.visibility === "private" && (
                                <Lock className="w-3 h-3 text-muted-foreground shrink-0 mt-[2px]" />
                              )}
                            </CardTitle>
                            <CardDescription
                              className="line-clamp-2 text-xs mt-1 break-words"
                              title={board.description || ""}
                            >
                              {board.description || "No description"}
                            </CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {/* <div className="flex items-center gap-1">
                                 <ChartNoAxesColumn className="h-3 w-3" />
                                 <span>0 lists</span>
                               </div>
                               <div className="flex items-center gap-1">
                                 <Users className="h-3 w-3" />
                                 <span>0 members</span>
                               </div> */}
                              <span className="text-xs text-muted-foreground italic">
                                View details →
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}