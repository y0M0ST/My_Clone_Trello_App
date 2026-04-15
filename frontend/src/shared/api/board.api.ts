import apiFactory from "./api-factory";

export type BoardVisibility = 'private' | 'public' | 'workspace';

export interface Card {
    id: string;
    title: string;
    description?: string;
    coverUrl?: string;
    position?: number;
    isCompleted?: boolean;
    isArchived?: boolean;
    members?: Member[];
    labels?: any[];
    attachments?: any[];
    due?: string;
    start?: string; // Add start date
    dueReminder?: number; // Add due reminder (minutes)
    listId?: string; // Add listId for archived cards context
    listTitle?: string; // Add listTitle for context
}

export interface List {
    id: string;
    title: string;
    position?: number;
    cards: Card[];
}

export interface Member {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    roleId: string;
    roleName?: string;
    /** pending = đã mời, chưa chấp nhận (BE) */
    memberStatus?: "pending" | "active" | "declined";
    role?: {
        id: string;
        name: string;
    };
}
export interface BoardDetail {
    id: string;
    title: string;
    description?: string;
    coverUrl: string | null;
    visibility: BoardVisibility;
    lists: List[];
    members: Member[];
    labels: { id: string; name: string; color: string }[];
    commentPolicy: 'disabled' | 'members' | 'workspace' | 'anyone';
    memberManagePolicy: 'admins_only' | 'all_members';
    /** Server: có link mời thành viên đang bật (không trả raw token) */
    hasInviteLink?: boolean;
}

export interface GenerateInviteLinkResult {
    message: string;
    link: string;
}

export const boardApi = {
    getDetail: (id: string) => {
        return apiFactory.get<BoardDetail>(`/boards/${id}`);
    },

    update: (id: string, data: Partial<BoardDetail>) => {
        return apiFactory.put<BoardDetail>(`/boards/${id}`, data);
    },

    inviteMember: (boardId: string, email: string, roleId: string) => {
        return apiFactory.post<void>(`/boards/${boardId}/invite`, { email, roleId });
    },

    createBoard: (data: { title: string; workspaceId: string; visibility: 'private' | 'public'; description?: string }) => {
        return apiFactory.post('/boards', data);
    },

    deletePermanently: (id: string) => {
        return apiFactory.delete(`/boards/${id}`);
    },

    /** Tạo / làm mới link mời (POST /boards/:id/generate-link) */
    generateInviteLink: (boardId: string) => {
        return apiFactory.post<GenerateInviteLinkResult>(`/boards/${boardId}/generate-link`);
    },

    /** Xóa link mời (DELETE /boards/:id/invite-link) */
    deleteInviteLink: (boardId: string) => {
        return apiFactory.delete(`/boards/${boardId}/invite-link`);
    },

    /** Tham gia bảng qua token trong link (POST /boards/:id/invite/:token) */
    joinBoardByInvite: (boardId: string, inviteToken: string) => {
        return apiFactory.post(`/boards/${boardId}/invite/${inviteToken}`);
    },

    removeMember: (boardId: string, userId: string) => {
        return apiFactory.delete(`/boards/${boardId}/members/${userId}`);
    },

    updateCover: (boardId: string, file: File) => {
        const formData = new FormData();
        formData.append('cover', file);
        return apiFactory.patch(`/boards/${boardId}/settings/cover`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    getActivities: (boardId: string, page = 1, limit = 20) => {
        return apiFactory.get(`/boards/${boardId}/activities?page=${page}&limit=${limit}`);
    },

    getArchivedLists: (boardId: string) => {
        return apiFactory.get<List[]>(`/boards/${boardId}/lists?archived=true`);
    },

    respondToInvitation: (boardId: string, status: 'active' | 'declined') => {
        return apiFactory.post(`/boards/${boardId}/invitations/respond`, { status });
    },

    getArchivedCards: (boardId: string) => {
        return apiFactory.get<Card[]>(`/boards/${boardId}/cards?archived=true`);
    },

    /** Tổng hợp bảng đã đóng + list/card đã archive (GET /boards/my-archived) */
    getMyArchivedOverview: () => {
        return apiFactory.get<{
            closedBoards: {
                id: string;
                title: string;
                workspaceId: string;
                workspaceTitle: string;
            }[];
            archivedLists: {
                id: string;
                title: string;
                boardId: string;
                boardTitle: string;
                boardIsClosed: boolean;
                workspaceTitle: string;
            }[];
            archivedCards: {
                id: string;
                title: string;
                boardId: string;
                listId: string;
                listTitle: string;
                boardTitle: string;
                boardIsClosed: boolean;
                workspaceTitle: string;
            }[];
        }>("/boards/my-archived");
    },

    reopenBoard: (boardId: string) => {
        return apiFactory.patch(`/boards/${boardId}/reopen`);
    },
};