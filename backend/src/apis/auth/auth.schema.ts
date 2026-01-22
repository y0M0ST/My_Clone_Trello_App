import { z } from 'zod';

const passwordRegex = new RegExp(
  /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/
);

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character'
    ),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const VerifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(1, 'OTP is required'),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(1, 'Code is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character'
    ),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;