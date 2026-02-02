import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from '@/config/redisClient';
import crypto from 'crypto';
const authService = new AuthService();

import {
  ServiceResponse,
  ResponseStatus,
} from '@/common/models/serviceResponse';
import { StatusCodes } from 'http-status-codes';

export class AuthController {
  static async register(req: Request): Promise<ServiceResponse<any>> {
    const data = req.body;
    if (!data.name || !data.email || !data.password) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'All fields are required',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
    if (data.password.length < 6) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'Password must be at least 6 characters',
        null,
        StatusCodes.BAD_REQUEST
      );
    }

    try {
      const result = await authService.register(data);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Register successfully',
        result,
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

  static async verifyEmail(req: Request): Promise<ServiceResponse<any>> {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'Email and OTP are required',
        null,
        StatusCodes.BAD_REQUEST
      );
    }

    try {
      const result = await authService.verifyEmail(email, otp);
      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
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

  static async login(
    req: Request,
    res: Response
  ): Promise<ServiceResponse<any>> {
    const data = req.body;
    if (!data.email || !data.password) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'All fields are required',
        null,
        StatusCodes.BAD_REQUEST
      );
    }
    try {
      const userAgent = req.headers['user-agent'];
      const ip = req.ip || req.socket.remoteAddress;

      const result = await authService.login(data, userAgent, ip);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return new ServiceResponse(
        ResponseStatus.Success,
        'Login successful',
        { accessToken: result.accessToken },
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

  static oauthRedirect(req: Request, res: Response) {
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&state=${state}`;
    res.redirect(url);
  }

  static async oauthCallback(req: Request, res: Response) {
    const code = req.query.code as string;
    try {
      const userAgent = req.headers['user-agent'];
      const ip = req.ip || req.socket.remoteAddress;

      const result = await authService.loginOAuth2(code, userAgent, ip);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: 'Login successful',
        accessToken: result.accessToken,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  static async refreshToken(req: Request): Promise<ServiceResponse<any>> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'No refresh token provided',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      const token = await authService.refreshToken(refreshToken);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Token refreshed successfully',
        { accessToken: token.accessToken },
        StatusCodes.OK
      );
    } catch (error) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.UNAUTHORIZED
      );
    }
  }

  static async forgetPassword(req: Request): Promise<ServiceResponse<any>> {
    const { email } = req.body;
    console.log('🔥 Đang yêu cầu reset pass cho:', email);
    const lastSentRequestForgotPassword = await redisClient.get(
      `lastSentRequestForgotPassword:${email}`
    );
    if (lastSentRequestForgotPassword) {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'Too many requests. Please wait a few minutes before requesting again.',
        null,
        StatusCodes.TOO_MANY_REQUESTS
      );
    }
    try {
      console.log('🚀 Bắt đầu gửi mail...');
      await authService.forgetPassword(email);
      console.log('✅ Gửi mail thành công!  ');
      await redisClient.set(
        `lastSentRequestForgotPassword:${email}`,
        Date.now().toString(),
        { EX: 60 }
      );
      return new ServiceResponse(
        ResponseStatus.Success,
        'Reset code sent to your email',
        null,
        StatusCodes.OK
      );
    } catch (error) {
      console.error('❌ Lỗi gửi mail:', error);
      return new ServiceResponse(
        ResponseStatus.Failed,
        error.message,
        null,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  static async resetPassword(req: Request): Promise<ServiceResponse<any>> {
    const { email, code, newPassword } = req.body;
    try {
      await authService.resetPassword(email, newPassword, code);
      return new ServiceResponse(
        ResponseStatus.Success,
        'Password has been reset successfully',
        null,
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

  static async getMe(req: Request): Promise<ServiceResponse<any>> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'No token provided',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

      const user = await authService.getMe(decoded.userId);
      return new ServiceResponse(
        ResponseStatus.Success,
        'User retrieved successfully',
        user,
        StatusCodes.OK
      );
    } catch {
      return new ServiceResponse(
        ResponseStatus.Failed,
        'Invalid or expired token',
        null,
        StatusCodes.UNAUTHORIZED
      );
    }
  }

  static async logout(
    req: Request,
    res: Response
  ): Promise<ServiceResponse<any>> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'No refresh token provided',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const result = await authService.logout(refreshToken);

      res.clearCookie('refreshToken');

      return new ServiceResponse(
        ResponseStatus.Success,
        result.message,
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
}
