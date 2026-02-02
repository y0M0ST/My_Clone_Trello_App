import { Request, Response } from 'express';
import { UserService } from './user.service';
import {
  ServiceResponse,
  ResponseStatus,
} from '@/common/models/serviceResponse';
import { StatusCodes } from 'http-status-codes';
import { UpdateProfileDto } from './user.dto';
import cloudinary from '@/config/cloudinary';

const userService = new UserService();

export class UserController {
  static async getAllUsers(): Promise<ServiceResponse<any>> {
    try {
      const users = await userService.getAllUsers();
      return new ServiceResponse(
        ResponseStatus.Success,
        'Users retrieved successfully',
        users,
        StatusCodes.OK
      );
    } catch {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'Error fetching users',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async getDetailUser(req: Request): Promise<ServiceResponse<any>> {
    try {
      const userId = req.params.id;
      const user = await userService.getDetailUser(userId);

      if (!user) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'User not found',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return new ServiceResponse(
        ResponseStatus.Success,
        'User retrieved successfully',
        user,
        StatusCodes.OK
      );
    } catch {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'Error fetching user detail',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async updateProfile(req: Request): Promise<ServiceResponse<any>> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Unauthorized',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      const dto: UpdateProfileDto = req.body;
      const updatedUser = await userService.updateProfile(userId, dto);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Profile updated successfully',
        updatedUser,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error updating profile',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async uploadAvatarToCloudinary(
    req: Request
  ): Promise<ServiceResponse<any>> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Unauthorized',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      if (!req.file) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Avatar file is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'avatars',
            resource_type: 'image',
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('No result from Cloudinary'));
            resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

      const avatarUrl = uploadResult.secure_url;

      const updatedUser = await userService.updateAvatar(userId, avatarUrl);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Avatar updated successfully',
        updatedUser,
        StatusCodes.OK
      );
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error uploading avatar to Cloudinary',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async updateAvatar(req: Request): Promise<ServiceResponse<any>> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Unauthorized',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      const avatarUrl = (req as any).avatarUrl || req.body.avatarUrl;

      if (!avatarUrl) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Avatar URL is required',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const updatedUser = await userService.updateAvatar(userId, avatarUrl);

      return new ServiceResponse(
        ResponseStatus.Success,
        'Avatar updated successfully',
        updatedUser,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error updating avatar',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async changePassword(req: Request): Promise<ServiceResponse<any>> {
    try {
      const userId = req.user?.userId; // Lấy ID từ token
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Unauthorized',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      await userService.changePassword(userId, {
        currentPassword,
        newPassword,
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Đổi mật khẩu thành công',
        null,
        StatusCodes.OK
      );
    } catch (error: any) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message || 'Error changing password',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }
}
