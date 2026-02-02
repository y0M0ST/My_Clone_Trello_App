import { Request } from 'express';
import { CommentService } from './comment.service';
import {
  ServiceResponse,
  ResponseStatus,
} from '@/common/models/serviceResponse';
import { StatusCodes } from 'http-status-codes';

const commentService = new CommentService();

export class CommentController {
  static async create(req: Request): Promise<ServiceResponse<any>> {
    try {
      const userId = req.user?.userId;
      const { cardId, content } = req.body;

      if (!cardId || !content) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'cardId and content are required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const comment = await commentService.createComment(
        cardId,
        userId,
        content
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        'Comment created successfully',
        comment,
        StatusCodes.CREATED
      );
    } catch (error: any) {
      const status = error.statusCode || StatusCodes.BAD_REQUEST;
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Failed to create comment',
        null,
        status
      );
    }
  }

  static async listByCard(req: Request): Promise<ServiceResponse<any>> {
    try {
      const { cardId } = req.params;

      if (!cardId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'cardId is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const comments = await commentService.getCommentsByCard(cardId);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Comments retrieved successfully',
        comments,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Failed to get comments',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async update(req: Request): Promise<ServiceResponse<any>> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { content } = req.body;

      if (!content) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'content is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const comment = await commentService.updateComment(id, userId, content);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Comment updated successfully',
        comment,
        StatusCodes.OK
      );
    } catch (error: any) {
      const status = error.statusCode || StatusCodes.BAD_REQUEST;
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Failed to update comment',
        null,
        status
      );
    }
  }

  static async delete(req: Request): Promise<ServiceResponse<any>> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      await commentService.deleteComment(id, userId);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Comment deleted successfully',
        null,
        StatusCodes.OK
      );
    } catch (error: any) {
      const status = error.statusCode || StatusCodes.BAD_REQUEST;
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Failed to delete comment',
        null,
        status
      );
    }
  }
}
