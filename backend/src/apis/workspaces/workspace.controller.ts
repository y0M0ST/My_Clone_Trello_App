// @ts-nocheck
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { WorkspaceService } from './workspace.service';
import {
  createWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
  UpdateMemberRoleDto,
  InviteMemberDto,
} from './workspace.dto';
import {
  ResponseStatus,
  ServiceResponse,
} from '@/common/models/serviceResponse';

const workspaceService = new WorkspaceService();
export class WorkspaceController {
  static async createWorkspace(req: Request): Promise<ServiceResponse<any>> {
    const userId = req.user?.userId;
    const data: createWorkspaceDto = req.body;
    if (!data.title || data.title.trim() === '') {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'Workspace title is required',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
    try {
      const result = await workspaceService.createWorkspace(userId, data);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Workspace created successfully',
        result,
        StatusCodes.CREATED
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getAllWorkspaces(): Promise<ServiceResponse<any>> {
    try {
      const workspaces = await workspaceService.getAllWorkspaces();
      return new ServiceResponse(
        ResponseStatus.Success,
        'Workspaces retrieved successfully',
        workspaces,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getWorkspaceById(req: Request): Promise<ServiceResponse<any>> {
    try {
      const id = req.params.id;
      const workspace = await workspaceService.getWorkspaceById(id);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Workspace retrieved successfully',
        workspace,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.NOT_FOUND
      );
    }
  }

  static async updateWorkspace(req: Request): Promise<ServiceResponse<any>> {
    try {
      const id = req.params.id;
      const data: UpdateWorkspaceDto = req.body;

      const updated = await workspaceService.updateWorkspace(id, data);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Workspace updated successfully',
        updated,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async deleteWorkspace(req: Request): Promise<ServiceResponse<any>> {
    try {
      const id = req.params.id;
      const result = await workspaceService.deleteWorkspace(id);
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getUserWorkspaces(req: Request): Promise<ServiceResponse<any>> {
    try {
      const userId = req.user?.userId;
      console.log('Fetching workspaces for user ID:', userId);
      const workspaces = await workspaceService.getWorkspacesByUserId(userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'User workspaces retrieved successfully',
        workspaces,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Get archived workspaces
  static async getArchivedWorkspaces(
    req: Request
  ): Promise<ServiceResponse<any>> {
    try {
      const userId = req.user?.userId;
      console.log('Fetching archived workspaces for user ID:', userId);
      const workspaces =
        await workspaceService.getArchivedWorkspacesByUserId(userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Archived workspaces retrieved successfully',
        workspaces,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Archive workspace
  static async archiveWorkspace(req: Request): Promise<ServiceResponse<any>> {
    try {
      const id = req.params.id;
      const userId = req.user?.userId;
      const result = await workspaceService.archiveWorkspace(id, userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.OK
      );
    } catch (error) {
      if (error.message === 'Workspace not found') {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }
      if (
        error.message.includes('not a member') ||
        error.message.includes('Only workspace admin')
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.FORBIDDEN
        );
      }
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Reopen workspace
  static async reopenWorkspace(req: Request): Promise<ServiceResponse<any>> {
    try {
      const id = req.params.id;
      const userId = req.user?.userId;
      const result = await workspaceService.reopenWorkspace(id, userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.OK
      );
    } catch (error) {
      if (error.message === 'Workspace not found') {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }
      if (
        error.message.includes('not a member') ||
        error.message.includes('Only workspace admin')
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.FORBIDDEN
        );
      }
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Add member to workspace
  static async addMember(req: Request): Promise<ServiceResponse<any>> {
    try {
      const workspaceId = req.params.id;
      const currentUserId = req.user?.userId;
      const data: AddMemberDto = req.body;

      const result = await workspaceService.addMember(
        workspaceId,
        data,
        currentUserId
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.CREATED
      );
    } catch (error) {
      if (
        error.message === 'Workspace not found' ||
        error.message === 'User not found' ||
        error.message === 'Role not found'
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }
      if (
        error.message.includes('not a member') ||
        error.message.includes('Only workspace admin') ||
        error.message.includes('already a member')
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.FORBIDDEN
        );
      }
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Update member role
  static async updateMemberRole(req: Request): Promise<ServiceResponse<any>> {
    try {
      const workspaceId = req.params.id;
      const memberId = req.params.memberId;
      const currentUserId = req.user?.userId;
      const data: UpdateMemberRoleDto = req.body;

      const result = await workspaceService.updateMemberRole(
        workspaceId,
        memberId,
        data,
        currentUserId
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.OK
      );
    } catch (error) {
      if (
        error.message === 'Workspace not found' ||
        error.message === 'Member not found in this workspace' ||
        error.message === 'Role not found'
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }
      if (
        error.message.includes('not a member') ||
        error.message.includes('Only workspace admin')
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.FORBIDDEN
        );
      }
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Get workspace members
  static async getWorkspaceMembers(
    req: Request
  ): Promise<ServiceResponse<any>> {
    try {
      const workspaceId = req.params.id;
      const members = await workspaceService.getWorkspaceMembers(workspaceId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Workspace members retrieved successfully',
        members,
        StatusCodes.OK
      );
    } catch (error) {
      if (error.message === 'Workspace not found') {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Remove member
  static async removeMember(req: Request): Promise<ServiceResponse<any>> {
    try {
      const workspaceId = req.params.id;
      const memberId = req.params.memberId;
      const currentUserId = req.user?.userId;

      const result = await workspaceService.removeMember(
        workspaceId,
        memberId,
        currentUserId
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.OK
      );
    } catch (error) {
      if (
        error.message === 'Workspace not found' ||
        error.message === 'Member not found in this workspace'
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }
      if (
        error.message.includes('not a member') ||
        error.message.includes('Only workspace admin') ||
        error.message.includes('Cannot remove the last admin')
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.FORBIDDEN
        );
      }
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Invite member by email
  static async inviteMemberByEmail(
    req: Request
  ): Promise<ServiceResponse<any>> {
    try {
      const workspaceId = req.params.id;
      const currentUserId = req.user?.userId;
      const data: InviteMemberDto = req.body;

      const result = await workspaceService.inviteMemberByEmail(
        workspaceId,
        data,
        currentUserId
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.CREATED
      );
    } catch (error) {
      if (
        error.message === 'Workspace not found' ||
        error.message === 'Role not found'
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }
      if (
        error.message.includes('not a member') ||
        error.message.includes('Only workspace admin') ||
        error.message.includes('already a member') ||
        error.message.includes('Invalid email') ||
        error.message.includes('Invalid role')
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.BAD_REQUEST
        );
      }
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Update workspace visibility
  static async updateVisibility(req: Request): Promise<ServiceResponse<any>> {
    try {
      const workspaceId = req.params.id;
      const currentUserId = req.user?.userId;
      const { visibility } = req.body;

      if (
        !visibility ||
        (visibility !== 'private' && visibility !== 'public')
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Visibility must be private or public',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const result = await workspaceService.updateVisibility(
        workspaceId,
        visibility,
        currentUserId
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.OK
      );
    } catch (error) {
      if (error.message === 'Workspace not found') {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }
      if (
        error.message.includes('not a member') ||
        error.message.includes('Only workspace owner')
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.FORBIDDEN
        );
      }
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }
}
