"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, LayoutGrid, ListTodo, RotateCcw, SquareKanban, Building2, ExternalLink, Loader2 } from "lucide-react";
import { AppSidebar } from "@/features/sidebar";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { boardApi } from "@/shared/api/board.api";
import { workspaceApi } from "@/shared/api/workspace.api";
import { listApi } from "@/shared/api/list.api";
import { cardApi } from "@/shared/api/card.api";
import { toast } from "sonner";

type ClosedBoard = {
    id: string;
    title: string;
    workspaceId: string;
    workspaceTitle: string;
};

type ArchivedListRow = {
    id: string;
    title: string;
    boardId: string;
    boardTitle: string;
    boardIsClosed: boolean;
    workspaceTitle: string;
};

type ArchivedCardRow = {
    id: string;
    title: string;
    boardId: string;
    listId: string;
    listTitle: string;
    boardTitle: string;
    boardIsClosed: boolean;
    workspaceTitle: string;
};

type ArchivedWorkspace = {
    id: string;
    title: string;
    description?: string;
    isArchived?: boolean;
    boards?: { id: string; title: string; isClosed?: boolean }[];
};

type OverviewPayload = {
    closedBoards: ClosedBoard[];
    archivedLists: ArchivedListRow[];
    archivedCards: ArchivedCardRow[];
};

function unwrapPayload<T>(raw: unknown): T {
    const r = raw as { responseObject?: T; data?: T };
    return (r.responseObject ?? r.data ?? raw) as T;
}

export default function ArchivesPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [workspaces, setWorkspaces] = useState<ArchivedWorkspace[]>([]);
    const [overview, setOverview] = useState<OverviewPayload>({
        closedBoards: [],
        archivedLists: [],
        archivedCards: [],
    });
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        const gone = () => signal?.aborted;
        try {
            const [wsRaw, boardRaw] = await Promise.all([
                workspaceApi.getArchived(),
                boardApi.getMyArchivedOverview(),
            ]);
            if (gone()) return;
            const wsData = unwrapPayload<ArchivedWorkspace[]>(wsRaw);
            setWorkspaces(Array.isArray(wsData) ? wsData : []);
            const ov = unwrapPayload<OverviewPayload>(boardRaw);
            setOverview({
                closedBoards: ov?.closedBoards ?? [],
                archivedLists: ov?.archivedLists ?? [],
                archivedCards: ov?.archivedCards ?? [],
            });
        } catch (e: unknown) {
            if (gone()) return;
            const ax = e as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Không tải được kho lưu trữ");
        } finally {
            if (!gone()) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const ac = new AbortController();
        void load(ac.signal);
        return () => ac.abort();
    }, [load]);

    const handleReopenWorkspace = async (id: string) => {
        setBusyId(`ws-${id}`);
        try {
            await workspaceApi.reopenWorkspace(id);
            toast.success("Đã khôi phục workspace");
            await load();
        } catch (e: unknown) {
            const ax = e as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Không mở lại được workspace");
        } finally {
            setBusyId(null);
        }
    };

    const handleReopenBoard = async (id: string) => {
        setBusyId(`bd-${id}`);
        try {
            await boardApi.reopenBoard(id);
            toast.success("Đã mở lại bảng");
            await load();
        } catch (e: unknown) {
            const ax = e as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Không mở lại được bảng");
        } finally {
            setBusyId(null);
        }
    };

    const handleRestoreList = async (row: ArchivedListRow) => {
        if (row.boardIsClosed) {
            toast.error("Bảng đang đóng — hãy mở lại bảng (tab Bảng đã đóng) trước khi khôi phục danh sách.");
            return;
        }
        setBusyId(`ls-${row.id}`);
        try {
            await listApi.update(row.id, { isArchived: false });
            toast.success("Đã khôi phục danh sách");
            await load();
        } catch (e: unknown) {
            const ax = e as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Không khôi phục được danh sách");
        } finally {
            setBusyId(null);
        }
    };

    const handleRestoreCard = async (row: ArchivedCardRow) => {
        if (row.boardIsClosed) {
            toast.error("Bảng đang đóng — hãy mở lại bảng trước khi khôi phục thẻ.");
            return;
        }
        setBusyId(`cd-${row.id}`);
        try {
            await cardApi.update(row.id, { isArchived: false });
            toast.success("Đã khôi phục thẻ");
            await load();
        } catch (e: unknown) {
            const ax = e as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || "Không khôi phục được thẻ");
        } finally {
            setBusyId(null);
        }
    };

    if (loading) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Đang tải kho lưu trữ…
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Archive className="h-5 w-5 text-orange-500" />
                        Kho lưu trữ
                    </h1>
                </header>

                <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Mục đã lưu trữ của bạn</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Workspace đã archive, bảng đã đóng, danh sách và thẻ đã lưu trữ (dữ liệu từ server).
                        </p>
                    </div>

                    <Tabs defaultValue="boards" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto flex-wrap gap-1">
                            <TabsTrigger value="workspaces" className="gap-1 text-xs sm:text-sm">
                                <Building2 className="h-4 w-4 shrink-0" />
                                Workspace ({workspaces.length})
                            </TabsTrigger>
                            <TabsTrigger value="boards" className="gap-1 text-xs sm:text-sm">
                                <LayoutGrid className="h-4 w-4 shrink-0" />
                                Bảng đóng ({overview.closedBoards.length})
                            </TabsTrigger>
                            <TabsTrigger value="lists" className="gap-1 text-xs sm:text-sm">
                                <SquareKanban className="h-4 w-4 shrink-0" />
                                Danh sách ({overview.archivedLists.length})
                            </TabsTrigger>
                            <TabsTrigger value="cards" className="gap-1 text-xs sm:text-sm">
                                <ListTodo className="h-4 w-4 shrink-0" />
                                Thẻ ({overview.archivedCards.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="workspaces" className="mt-4 space-y-3">
                            {workspaces.length === 0 ? (
                                <EmptyHint text="Không có workspace nào đang ở trạng thái lưu trữ." />
                            ) : (
                                workspaces.map((ws) => (
                                    <Card key={ws.id}>
                                        <CardHeader className="py-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div>
                                                    <CardTitle className="text-base">{ws.title}</CardTitle>
                                                    <CardDescription>
                                                        {ws.boards?.length ?? 0} bảng trong workspace này
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 shrink-0"
                                                    disabled={busyId === `ws-${ws.id}`}
                                                    onClick={() => void handleReopenWorkspace(ws.id)}
                                                >
                                                    {busyId === `ws-${ws.id}` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-4 w-4" />
                                                    )}
                                                    Khôi phục workspace
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="boards" className="mt-4 space-y-3">
                            {overview.closedBoards.length === 0 ? (
                                <EmptyHint text="Không có bảng nào đang đóng." />
                            ) : (
                                overview.closedBoards.map((b) => (
                                    <Card key={b.id}>
                                        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{b.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {b.workspaceTitle || "Workspace"}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1"
                                                    disabled={busyId === `bd-${b.id}`}
                                                    onClick={() => void handleReopenBoard(b.id)}
                                                >
                                                    {busyId === `bd-${b.id}` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-4 w-4" />
                                                    )}
                                                    Mở lại bảng
                                                </Button>
                                                <Button size="sm" variant="ghost" className="gap-1" onClick={() => navigate(`/boards/${b.id}`)}>
                                                    <ExternalLink className="h-4 w-4" />
                                                    Trang bảng
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="lists" className="mt-4 space-y-3">
                            {overview.archivedLists.length === 0 ? (
                                <EmptyHint text="Không có danh sách đã lưu trữ." />
                            ) : (
                                overview.archivedLists.map((row) => (
                                    <Card key={row.id}>
                                        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{row.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Bảng: {row.boardTitle}
                                                    {row.boardIsClosed ? " · đang đóng" : ""} · {row.workspaceTitle}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    disabled={!!row.boardIsClosed || busyId === `ls-${row.id}`}
                                                    className="gap-1"
                                                    onClick={() => void handleRestoreList(row)}
                                                >
                                                    {busyId === `ls-${row.id}` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-4 w-4" />
                                                    )}
                                                    Khôi phục
                                                </Button>
                                                <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/boards/${row.boardId}`)}>
                                                    <ExternalLink className="h-4 w-4" />
                                                    Mở bảng
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="cards" className="mt-4 space-y-3">
                            {overview.archivedCards.length === 0 ? (
                                <EmptyHint text="Không có thẻ đã lưu trữ." />
                            ) : (
                                overview.archivedCards.map((row) => (
                                    <Card key={row.id}>
                                        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{row.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {row.listTitle} · {row.boardTitle}
                                                    {row.boardIsClosed ? " · bảng đang đóng" : ""} · {row.workspaceTitle}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    disabled={!!row.boardIsClosed || busyId === `cd-${row.id}`}
                                                    className="gap-1"
                                                    onClick={() => void handleRestoreCard(row)}
                                                >
                                                    {busyId === `cd-${row.id}` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-4 w-4" />
                                                    )}
                                                    Khôi phục
                                                </Button>
                                                <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/boards/${row.boardId}`)}>
                                                    <ExternalLink className="h-4 w-4" />
                                                    Mở bảng
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

function EmptyHint({ text }: { text: string }) {
    return (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
            {text}
        </div>
    );
}
