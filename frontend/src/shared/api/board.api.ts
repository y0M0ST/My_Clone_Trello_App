import apiFactory, { API_ENDPOINTS } from "./api-factory";

export type BoardVisibility = 'private' | 'public' | 'workspace';

export interface Card {
    id: string;
    title: string;
    coverUrl?: string;
    position?: number;
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
}
export interface BoardDetail {
    id: string;
    title: string;
    description?: string;
    coverUrl: string | null;
    visibility: BoardVisibility;
    lists: List[];
    members: Member[];
}

export const boardApi = {
    getDetail: (id: string) => {
        return apiFactory.get<BoardDetail>(`/boards/${id}`);
    },

    update: (id: string, data: Partial<BoardDetail>) => {
        return apiFactory.put<BoardDetail>(`/boards/${id}`, data);
    },

    inviteMember: (boardId: string, email: string) => {
        return apiFactory.post<void>(`/boards/${boardId}/invite`, { email });
    },

    createBoard: (data: { title: string; workspaceId: string; visibility: 'private' | 'public'; description?: string }) => {
        return apiFactory.post('/boards', data);
    },
};