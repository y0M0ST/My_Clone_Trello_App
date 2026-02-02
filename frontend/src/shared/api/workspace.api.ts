import apiFactory from "./api-factory";
import { API_ENDPOINTS } from "./api-endpoint";

export interface Workspace {
    id: string;
    title: string;
    description?: string;
    visibility: 'private' | 'public';
    myRole?: { name: string };
}

export interface CreateWorkspacePayload {
    title: string;
    description?: string;
    visibility?: 'private' | 'public';
}

export const workspaceApi = {
    create: (data: CreateWorkspacePayload) => {
        return apiFactory.post(API_ENDPOINTS.WORKSPACES.BASE, data);
    },

    getMyWorkspaces: () => {
        return apiFactory.get<Workspace[]>(API_ENDPOINTS.WORKSPACES.BASE);
    },
    getDetail: (id: string) => {
        return apiFactory.get<Workspace>(`${API_ENDPOINTS.WORKSPACES.BASE}/${id}`);
    },
    delete: (id: string) => {
        return apiFactory.delete(`${API_ENDPOINTS.WORKSPACES.BASE}/${id}`);
    }
};