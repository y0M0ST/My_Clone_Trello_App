import { Request, Response } from 'express';
import { EmailService } from './mail.service';
import { validateEmail } from '@/common/utils/validateEmail';
import { AppDataSource } from '@/config/data-source';
import { User } from '@/common/entities/user.entity';
import { redisClient } from '@/config/redisClient';

const emailService = new EmailService();
export class EmailController {
  private userRepository = AppDataSource.getRepository(User);
  async requestVerifyEmail(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    if (!validateEmail(email))
      return res.status(400).json({ message: 'Invalid email format' });

    const lastSent = await redisClient.get(`lastSent:${email}`);
    if (lastSent) {
      return res
        .status(429)
        .json({ message: 'Wait a bit before requesting again.' });
    }

    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await emailService.sendVerificationEmail(email, otp);

      await redisClient.set(`lastSent:${email}`, Date.now().toString(), {
        EX: 60,
      });

      return res
        .status(200)
        .json({ message: 'Verification email sent (Test OTP: ' + otp + ')' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to send email', error });
    }
  }

  // async verifyEmail(req: Request, res: Response) {
  //   const { token } = req.query;
  //   if (!token || typeof token !== 'string')
  //     return res.status(400).json({ message: 'Token is required' });
  //   try {
  //     const email = await emailService.verifyEmailToken(token);
  //     return res.status(200).json({ message: 'Email verified', email });
  //   } catch (error) {
  //     return res.status(500).json({ message: 'Failed to verify email', error });
  //   }
  // }
}
