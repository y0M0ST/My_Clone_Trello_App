import { StatusCodes } from 'http-status-codes';
import {
  ResponseStatus,
  ServiceResponse,
} from '@/common/models/serviceResponse';
import { Request, Response } from 'express';
import { CardService } from './card.service';

const cardService = new CardService();

export class CardController {
  static async getCard(req: Request): Promise<ServiceResponse> {
    try {
      const cardId = req.params.id;
      const query = req.query;
      const card = await cardService.getCard(cardId, query);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Get card successfully',
        card,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async createCard(req: Request): Promise<ServiceResponse> {
    try {
      const cardData = req.body;
      const userId = (req as any).user?.userId;
      const newCard = await cardService.createCard(cardData, userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Create card successfully',
        newCard,
        StatusCodes.CREATED
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async updateCard(req: Request): Promise<ServiceResponse> {
    try {
      const cardId = req.params.id;
      const updateData = req.body;
      const userId = (req as any).user?.userId;
      const updatedCard = await cardService.updateCard(
        cardId,
        updateData,
        userId
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'Update card successfully',
        updatedCard,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async deleteCard(req: Request): Promise<ServiceResponse> {
    try {
      const cardId = req.params.id;
      await cardService.deleteCard(cardId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Delete card successfully',
        null,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async addLabelToCard(req: Request): Promise<ServiceResponse> {
    try {
      const { id, labelId } = req.params;
      const userId = (req as any).user?.userId;
      const updatedCard = await cardService.addLabelToCard(id, labelId, userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Label added to card successfully',
        updatedCard,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async removeLabelFromCard(req: Request): Promise<ServiceResponse> {
    try {
      const { id, labelId } = req.params;
      const userId = (req as any).user?.userId;
      const updatedCard = await cardService.removeLabelFromCard(
        id,
        labelId,
        userId
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'Label removed from card successfully',
        updatedCard,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async addMemberToCard(req: Request): Promise<ServiceResponse> {
    try {
      const { id, memberId } = req.params;
      const userId = (req as any).user?.userId;
      await cardService.addMemberToCard(id, memberId, userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Member added to card successfully',
        null,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async removeMemberFromCard(req: Request): Promise<ServiceResponse> {
    try {
      const { id, memberId } = req.params;
      const userId = (req as any).user?.userId;
      await cardService.removeMemberFromCard(id, memberId, userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Member removed from card successfully',
        null,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getActions(
    req: Request
  ): Promise<ServiceResponse<{ actions: any[]; total: number }>> {
    try {
      const cardId = req.params.id;
      const { filter, page } = req.query;
      const result = await cardService.getActions(
        cardId,
        filter as string,
        page ? Number(page) : undefined
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'Get actions successfully',
        result,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async addComment(req: Request): Promise<ServiceResponse> {
    try {
      const cardId = req.params.id;
      const { text } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'User not authenticated',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      const action = await cardService.addComment(cardId, userId, text);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Comment added successfully',
        action,
        StatusCodes.CREATED
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async updateComment(req: Request): Promise<ServiceResponse> {
    try {
      const { id, actionId } = req.params;
      const { text } = req.body;
      const action = await cardService.updateComment(id, actionId, text);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Comment updated successfully',
        action,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async deleteComment(req: Request): Promise<ServiceResponse> {
    try {
      const { id, actionId } = req.params;
      await cardService.deleteComment(id, actionId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Comment deleted successfully',
        null,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async createAttachment(req: Request): Promise<ServiceResponse> {
    try {
      const cardId = req.params.id;
      const userId = (req as any).user?.userId;
      const { name, url, setCover } = req.body;
      const file = req.file;

      if (!userId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'User not authenticated',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      const attachment = await cardService.createAttachment(cardId, userId, {
        name,
        url,
        file,
        setCover,
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Attachment created successfully',
        attachment,
        StatusCodes.CREATED
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async deleteAttachment(req: Request): Promise<ServiceResponse> {
    try {
      const { id, attachmentId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'User not authenticated',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      await cardService.deleteAttachment(id, attachmentId, userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Attachment deleted successfully',
        null,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getAttachments(req: Request): Promise<ServiceResponse<any[]>> {
    try {
      const cardId = req.params.id;
      const { fields } = req.query;
      const attachments = await cardService.getAttachments(
        cardId,
        fields as string
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'Get attachments successfully',
        attachments,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getAttachment(req: Request): Promise<ServiceResponse> {
    try {
      const { id, attachmentId } = req.params;
      const { fields } = req.query;
      const attachment = await cardService.getAttachment(
        id,
        attachmentId,
        fields as string
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'Get attachment successfully',
        attachment,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // Checklist controllers
  static async getChecklists(req: Request): Promise<ServiceResponse<any[]>> {
    try {
      const cardId = req.params.id;
      const { checkItems, filter, field } = req.query;
      const checklists = await cardService.getChecklists(
        cardId,
        checkItems === 'true',
        filter as string,
        field as string
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'Get checklists successfully',
        checklists,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async createChecklist(req: Request): Promise<ServiceResponse> {
    try {
      const cardId = req.params.id;
      const userId = (req as any).user?.userId;
      const { name, position, checklistSourceId } = req.body;

      const checklist = await cardService.createChecklist(
        cardId,
        { name, position, checklistSourceId },
        userId
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        'Checklist created successfully',
        checklist,
        StatusCodes.CREATED
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async updateChecklist(req: Request): Promise<ServiceResponse> {
    try {
      const { id, checklistId } = req.params;
      const { name, position } = req.body;

      const updated = await cardService.updateChecklist(id, checklistId, {
        name,
        position,
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Checklist updated successfully',
        updated,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async deleteChecklist(req: Request): Promise<ServiceResponse> {
    try {
      const { id, checklistId } = req.params;
      const userId = (req as any).user?.userId;

      await cardService.deleteChecklist(id, checklistId, userId);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Checklist deleted successfully',
        null,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // CheckItem controllers
  static async getCheckItems(req: Request): Promise<ServiceResponse<any[]>> {
    try {
      const { id, checklistId } = req.params;
      const { filter, field } = req.query;

      const checkItems = await cardService.getCheckItems(
        id,
        checklistId,
        filter as string,
        field as string
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        'Get checkItems successfully',
        checkItems,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getCheckItem(req: Request): Promise<ServiceResponse> {
    try {
      const { id, checklistId, checkItemId } = req.params;

      const checkItem = await cardService.getCheckItem(
        id,
        checklistId,
        checkItemId
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        'Get checkItem successfully',
        checkItem,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async createCheckItem(req: Request): Promise<ServiceResponse> {
    try {
      const { id, checklistId } = req.params;
      const { name, position, isChecked, due, dueReminder } = req.body;

      const checkItem = await cardService.createCheckItem(id, checklistId, {
        name,
        position,
        isChecked,
        due,
        dueReminder,
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'CheckItem created successfully',
        checkItem,
        StatusCodes.CREATED
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async updateCheckItem(req: Request): Promise<ServiceResponse> {
    try {
      const { id, checklistId, checkItemId } = req.params;
      const userId = (req as any).user?.userId;
      const {
        name,
        position,
        isChecked,
        due,
        dueReminder,
        checklistId: newChecklistId,
      } = req.body;

      const updated = await cardService.updateCheckItem(
        id,
        checklistId,
        checkItemId,
        {
          name,
          position,
          isChecked,
          due,
          dueReminder,
          checklistId: newChecklistId,
        },
        userId
      );

      return new ServiceResponse(
        ResponseStatus.Success,
        'CheckItem updated successfully',
        updated,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async deleteCheckItem(req: Request): Promise<ServiceResponse> {
    try {
      const { id, checklistId, checkItemId } = req.params;

      await cardService.deleteCheckItem(id, checklistId, checkItemId);

      return new ServiceResponse(
        ResponseStatus.Success,
        'CheckItem deleted successfully',
        null,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async moveCard(req: Request): Promise<ServiceResponse> {
    try {
      const { cardId, prevColumnId, prevIndex, nextColumnId, nextIndex } =
        req.body;

      if (!cardId || !nextColumnId) {
        throw new Error('Missing required fields for moving card');
      }

      const result = await cardService.moveCard({
        cardId,
        prevColumnId,
        prevIndex,
        nextColumnId,
        nextIndex,
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Card moved successfully',
        result,
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        (error as Error).message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }
}
