/**
 * Workspace Service - Các API liên quan đến Workspace
 */
import type { ServiceResponse } from '@/shared/model/service-response';
import { apiFactory, API_ENDPOINTS, type ApiResponse } from '../index';
import type { Workspace } from '@/shared/types';

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const workspaceService = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<ServiceResponse<Workspace[]>> => {
    return apiFactory.get(API_ENDPOINTS.WORKSPACES.BASE, { params });
  },

  getById: async (id: string): Promise<ApiResponse<Workspace>> => {
    return apiFactory.get(API_ENDPOINTS.WORKSPACES.BY_ID(id));
  },

  create: async (data: CreateWorkspaceRequest): Promise<ApiResponse<Workspace>> => {
    return apiFactory.post(API_ENDPOINTS.WORKSPACES.BASE, data);
  },

  update: async (id: string, data: Partial<CreateWorkspaceRequest>): Promise<ApiResponse<Workspace>> => {
    return apiFactory.put(API_ENDPOINTS.WORKSPACES.BY_ID(id), data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiFactory.delete(API_ENDPOINTS.WORKSPACES.BY_ID(id));
  },

  getMembers: async (workspaceId: string): Promise<ApiResponse<WorkspaceMember[]>> => {
    return apiFactory.get(API_ENDPOINTS.WORKSPACES.MEMBERS(workspaceId));
  },

  addMember: async (workspaceId: string, userId: string, role: string): Promise<ApiResponse<WorkspaceMember>> => {
    return apiFactory.post(API_ENDPOINTS.WORKSPACES.ADD_MEMBER(workspaceId), { userId, role });
  },

  removeMember: async (workspaceId: string, memberId: string): Promise<ApiResponse<void>> => {
    return apiFactory.delete(API_ENDPOINTS.WORKSPACES.REMOVE_MEMBER(workspaceId, memberId));
  },
};
