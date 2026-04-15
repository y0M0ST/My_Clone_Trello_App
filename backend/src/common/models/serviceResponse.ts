import { z } from 'zod';

export enum ResponseStatus {
  Success,
  Failed,
}

// Class chuẩn hóa cấu trúc response từ service (class trả về của service)
export class ServiceResponse<T = null> {
  success: boolean;
  message: string;
  responseObject: T;
  statusCode: number;
 
  constructor(
    status: ResponseStatus,
    message: string,
    responseObject: T,
    statusCode: number
  ) {
    this.success = status === ResponseStatus.Success;
    this.message = message;
    this.responseObject = responseObject;
    this.statusCode = statusCode;
  }
}

// Tạo Zod schema cho OpenAPI/Swagger documentation (dùng cho swagger)
export const ServiceResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    responseObject: dataSchema.optional(),
    statusCode: z.number(),
  });
