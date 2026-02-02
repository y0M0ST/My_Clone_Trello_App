import { Request, Response } from 'express';
import { BoardService } from './board.service';
import {
  ServiceResponse,
  ResponseStatus,
} from '@/common/models/serviceResponse';
import { StatusCodes } from 'http-status-codes';
import { uploadBoardCoverToCloudinary } from '@/config/cloudinary';
import {
  boardActivityService,
  BoardActivityService,
} from './board-activity.service';

const boardService = new BoardService();
import { UserService } from '../users/user.service';
const userService = new UserService();

export class BoardController {
  static async create(req: Request): Promise<ServiceResponse<any>> {
    try {
      const { title, workspaceId } = req.body;
      if (!title || !workspaceId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Title and workspaceId are required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }
      const creatorId = req.user?.userId;
      const board = await boardService.createBoard(req.body, creatorId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Board created successfully',
        board,
        StatusCodes.CREATED
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async findAll(req: Request): Promise<ServiceResponse<any>> {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;

      if (!workspaceId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'workspaceId query param is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const boards = await boardService.getBoards(workspaceId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Boards retrieved successfully',
        boards,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async findOne(req: Request): Promise<ServiceResponse<any>> {
    try {
      const board = await boardService.getBoardById(req.params.id as string);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Board retrieved successfully',
        board,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.NOT_FOUND
      );
    }
  }

  static async update(req: Request): Promise<ServiceResponse<any>> {
    try {
      const board = await boardService.updateBoard(req.params.id as string, req.body);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Board updated successfully',
        board,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async closeBoard(req: Request): Promise<ServiceResponse<any>> {
    try {
      const board = await boardService.closeBoard(req.params.id as string);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Board closed successfully',
        board,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async reopenBoard(req: Request): Promise<ServiceResponse<any>> {
    try {
      const board = await boardService.reopenBoard(req.params.id as string);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Board reopened successfully',
        board,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async addMemberToBoard(req: Request): Promise<ServiceResponse<any>> {
    try {
      const boardId = req.params.id as string;
      const currentUserId = req.user?.userId;
      const data = req.body;
      const result = await boardService.addMemberToBoard(
        boardId,
        data,
        currentUserId
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        result,
        StatusCodes.CREATED
      );
    } catch (error: any) {
      if (
        error.message === 'Board not found' ||
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
        error.message.includes('not a board member') ||
        error.message.includes('Only board admin') ||
        error.message.includes('Only board owner') ||
        error.message.includes('already a board member')
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

  static async deleteBoardPermanently(
    req: Request
  ): Promise<ServiceResponse<any>> {
    try {
      const board = await boardService.deleteBoardPermanently(req.params.id as string);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Board deleted permanently',
        board,

        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async createLinkShareBoard(
    req: Request
  ): Promise<ServiceResponse<any>> {
    const boardId = req.params.id as string;
    const currentUserId = req.user?.userId;
    try {
      const link = await boardService.createLinkShareBoard(
        boardId,
        currentUserId
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'Invite link create successfully',
        link,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async deleteLinkShareBoard(
    req: Request
  ): Promise<ServiceResponse<any>> {
    const boardId = req.params.id as string;
    const currentUserId = req.user?.userId;
    try {
      await boardService.deleteLinkShareBoard(boardId, currentUserId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Invite Link delete successfully',
        null,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async JoinBoardByLink(req: Request): Promise<ServiceResponse<any>> {
    const boardId = req.params.id as string;
    const inviteToken = req.params.inviteToken as string;
    const currentUserId = req.user?.userId;
    try {
      const member = await boardService.JoinBoardByLink(
        boardId,
        currentUserId,
        inviteToken
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'You joined this board successfully',
        member,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async transferOwnership(req: Request): Promise<ServiceResponse<any>> {
    try {
      const boardId = req.params.id as string;
      const { newOwnerId } = req.body;

      const currentOwner = await boardService.getBoardOwner(boardId);
      if (currentOwner.userId !== req.user?.userId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Only the current owner can transfer ownership',
          null,
          StatusCodes.FORBIDDEN
        );
      }

      const newOwner = await userService.findUserById(newOwnerId);
      if (!newOwner) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'New owner not found',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      const updatedBoard = await boardService.transferOwnership(
        boardId,
        newOwnerId
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        'Ownership transferred successfully',
        updatedBoard,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error transferring ownership',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async updateSettings(req: Request): Promise<ServiceResponse<any>> {
    try {
      const id = req.params.id as string;
      const {
        visibility,
        coverUrl,
        memberManagePolicy,
        commentPolicy,
        workspaceMembersCanEditAndJoin,
      } = req.body;

      const settings: {
        visibility?: 'private' | 'workspace' | 'public';
        coverUrl?: string;
        memberManagePolicy?: 'admins_only' | 'all_members';
        commentPolicy?: 'disabled' | 'members' | 'workspace' | 'anyone';
        workspaceMembersCanEditAndJoin?: boolean;
      } = {};

      // validate visibility
      if (visibility !== undefined) {
        const validVisibilities = ['private', 'workspace', 'public'];
        if (!validVisibilities.includes(visibility)) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            'Invalid visibility value',
            null,
            StatusCodes.BAD_REQUEST
          );
        }
        settings.visibility = visibility;
      }

      // validate coverUrl
      if (coverUrl !== undefined) {
        if (typeof coverUrl !== 'string' || !coverUrl.trim()) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            'coverUrl must be a non-empty string',
            null,
            StatusCodes.BAD_REQUEST
          );
        }
        settings.coverUrl = coverUrl.trim();
      }

      // validate memberManagePolicy
      if (memberManagePolicy !== undefined) {
        const validMemberPolicies = ['admins_only', 'all_members'];
        if (!validMemberPolicies.includes(memberManagePolicy)) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            'Invalid memberManagePolicy value',
            null,
            StatusCodes.BAD_REQUEST
          );
        }
        settings.memberManagePolicy = memberManagePolicy;
      }

      // validate commentPolicy
      if (commentPolicy !== undefined) {
        const validCommentPolicies = [
          'disabled',
          'members',
          'workspace',
          'anyone',
        ];
        if (!validCommentPolicies.includes(commentPolicy)) {
          return new ServiceResponse(
            ResponseStatus.Failed,
            'Invalid commentPolicy value',
            null,
            StatusCodes.BAD_REQUEST
          );
        }
        settings.commentPolicy = commentPolicy;
      }

      // validate workspaceMembersCanEditAndJoin
      if (workspaceMembersCanEditAndJoin !== undefined) {
        if (typeof workspaceMembersCanEditAndJoin !== 'boolean') {
          return new ServiceResponse(
            ResponseStatus.Failed,
            'workspaceMembersCanEditAndJoin must be boolean',
            null,
            StatusCodes.BAD_REQUEST
          );
        }
        settings.workspaceMembersCanEditAndJoin =
          workspaceMembersCanEditAndJoin;
      }

      if (Object.keys(settings).length === 0) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'No settings provided',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const userId = req.user?.userId;
      const isAdmin = await boardService.checkBoardAdmin(id, userId);
      if (!isAdmin) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'User is not an admin of this board',
          null,
          StatusCodes.FORBIDDEN
        );
      }

      const { board, changedFields } = await boardService.updateBoardSettings(
        id,
        settings
      );

      // Không có field nào thay đổi
      if (!changedFields || Object.keys(changedFields).length === 0) {
        return new ServiceResponse(
          ResponseStatus.Success,
          'No settings changed',
          {
            board,
            changedFields: {},
          },
          StatusCodes.OK
        );
      }

      await boardActivityService.logActivity({
        boardId: id,
        actorId: userId,
        actionType: 'BOARD_SETTINGS_UPDATED',
        targetType: 'BOARD',
        targetId: id,
        metadata: { changedFields },
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Board settings updated successfully',
        { board, changedFields },
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error updating board settings',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async updateCover(req: Request): Promise<ServiceResponse<any>> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;

      const isAdmin = await boardService.checkBoardAdmin(id, userId);
      if (!isAdmin) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'User is not an admin of this board',
          null,
          StatusCodes.FORBIDDEN
        );
      }

      const file = req.file;
      if (!file) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Cover image file is required (field name: cover)',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const coverUrl = await uploadBoardCoverToCloudinary(file);

      const { board, changedFields } = await boardService.updateBoardSettings(
        id,
        {
          coverUrl,
        }
      );

      await boardActivityService.logActivity({
        boardId: id,
        actorId: userId,
        actionType: 'BOARD_SETTINGS_UPDATED',
        targetType: 'BOARD',
        targetId: id,
        metadata: { changedFields },
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Board cover updated successfully',
        { board, changedFields },
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error updating board cover',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async getMembers(req: Request): Promise<ServiceResponse<any>> {
    //Hàm ni dùng để lấy ds thành viên trong board
    try {
      const boardId = req.params.id as string;
      const members = await boardService.getBoardMembers(boardId);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Board members retrieved successfully',
        members,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error retrieving board members',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async removeMemberFromBoard(
    req: Request
  ): Promise<ServiceResponse<any>> {
    try {
      const boardId = req.params.id as string;
      const userIdToRemove = req.params.userId as string;
      const currentUserId = req.user?.userId;

      if (!userIdToRemove) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'userId is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const result = await boardService.removeMemberFromBoard(
        boardId,
        userIdToRemove,
        currentUserId
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
        null,
        StatusCodes.OK
      );
    } catch (error: any) {
      if (
        error.message === 'Board not found' ||
        error.message === 'Member not found in this board'
      ) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          error.message,
          null,
          StatusCodes.NOT_FOUND
        );
      }

      if (
        error.message.includes('You are not a member') ||
        error.message.includes('Only board owner or admin') ||
        error.message.includes('Only board members or admins') ||
        error.message.includes('Cannot remove board owner')
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
        error.message || 'Error removing member',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async searchCards(req: Request): Promise<ServiceResponse<any>> {
    try {
      const boardId =
        (req.params as any).id ||
        (req.params as any).boardId ||
        (req.query.boardId as string | undefined);

      if (!boardId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'boardId is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const { keyword, q, labelIds, memberId, status, dueFrom, dueTo } =
        req.query as any;

      const searchKeyword: string | undefined = keyword || q;

      const parsedLabelIds: string[] | undefined =
        typeof labelIds === 'string'
          ? labelIds
            .split(',')
            .map((id: string) => id.trim())
            .filter(Boolean)
          : Array.isArray(labelIds)
            ? (labelIds as string[])
            : undefined;

      const cards = await boardService.searchCardsInBoard(boardId, {
        keyword: searchKeyword,
        labelIds: parsedLabelIds,
        memberId,
        status,
        dueFrom,
        dueTo,
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Cards fetched successfully',
        cards,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error searching cards',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getActivity(req: Request): Promise<ServiceResponse<any>> {
    try {
      const boardId = (req.params.id ||
        req.params.boardId ||
        (req.query.boardId as string | undefined)) as string | undefined;

      if (!boardId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'boardId is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;

      const result = await boardActivityService.getBoardActivity(
        boardId,
        page,
        limit
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        'Board activity retrieved successfully',
        result,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error while fetching board activity',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }
}
