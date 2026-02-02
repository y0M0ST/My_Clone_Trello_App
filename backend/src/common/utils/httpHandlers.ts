import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z, ZodError, ZodObject, ZodRawShape } from 'zod';

import {
  ResponseStatus,
  ServiceResponse,
} from '@/common/models/serviceResponse';

export const handleServiceResponse = (
  serviceResponse: ServiceResponse<any>,
  response: Response
) => {
  return response.status(serviceResponse.statusCode).send(serviceResponse);
};

export const validateRequest =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(
        'Validating request with schema:',
        schema.parse({
          body: req.body,
          query: req.query,
          params: req.params,
        })
      );
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errorMessage = `Invalid input: ${err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`;
        const statusCode = StatusCodes.BAD_REQUEST;
        res
          .status(statusCode)
          .send(
            new ServiceResponse<null>(
              ResponseStatus.Failed,
              errorMessage,
              null,
              statusCode
            )
          );
      } else {
        const errorMessage = 'Validation failed';
        const statusCode = StatusCodes.BAD_REQUEST;
        res
          .status(statusCode)
          .send(
            new ServiceResponse<null>(
              ResponseStatus.Failed,
              errorMessage,
              null,
              statusCode
            )
          );
      }
    }
  };

export const validateHandle =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction) => {
    console.log('🔥 [DEBUG MIDDLEWARE] Đang check body:', req.body);

    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorDetail = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');

      console.error('❌ [DEBUG MIDDLEWARE] Validate Thất Bại:', errorDetail);

      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          new ServiceResponse<null>(
            ResponseStatus.Failed,
            `Invalid body: ${errorDetail}`,
            null,
            StatusCodes.BAD_REQUEST
          )
        );
    }

    console.log('✅ [DEBUG MIDDLEWARE] Validate OK -> Chuyển tiếp Controller');

    req.body = result.data;
    next();
  };
