import { StatusCodes } from 'http-status-codes';

export interface ServiceResponse<T> {
  message: string;
  responseObject: T;
  statusCode: StatusCodes;
  success: boolean;
}
