import { Request } from 'express';
import {
  ServiceResponse,
  ResponseStatus,
} from '@/common/models/serviceResponse';
import { StatusCodes } from 'http-status-codes';
import { BoardTemplateService } from './board-template.service';

const templateService = new BoardTemplateService();

export class BoardTemplateController {
  static async createFromBoard(req: Request): Promise<ServiceResponse<any>> {
    try {
      const { id } = req.params;
      const { name, description, coverUrl, workspaceId } = req.body || {};

      const template = await templateService.createFromBoard(id, {
        name,
        description,
        coverUrl,
        workspaceId: workspaceId ?? null,
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Board template created successfully',
        template,
        StatusCodes.CREATED
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error creating board template',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async list(req: Request): Promise<ServiceResponse<any>> {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      const templates = await templateService.list(workspaceId);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Templates retrieved successfully',
        templates,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error fetching templates',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async getOne(req: Request): Promise<ServiceResponse<any>> {
    try {
      const { templateId } = req.params;
      const template = await templateService.getOne(templateId);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Template retrieved successfully',
        template,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Template not found',
        null,
        StatusCodes.NOT_FOUND
      );
    }
  }

  static async apply(req: Request): Promise<ServiceResponse<any>> {
    try {
      const { templateId } = req.params;
      const { workspaceId, title, description } = req.body;

      if (!workspaceId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'workspaceId is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const result = await templateService.apply(templateId, {
        workspaceId,
        title,
        description,
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Board created from template successfully',
        result,
        StatusCodes.CREATED
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error applying template',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }
}
