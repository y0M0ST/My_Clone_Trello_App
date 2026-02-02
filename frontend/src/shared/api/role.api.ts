import apiFactory from "./api-factory";

export interface Role {
    id: string;
    name: string;
    description?: string;
}

export const roleApi = {
    getAll: () => {
        return apiFactory.get<Role[]>('/roles');
    },

    getByGroup: (group: 'system' | 'workspace' | 'board' | 'basic') => {
        return apiFactory.get<Role[]>(`/roles/group/${group}`);
    },

    getById: (id: string) => {
        return apiFactory.get<Role>(`/roles/id/${id}`);
    }
};
