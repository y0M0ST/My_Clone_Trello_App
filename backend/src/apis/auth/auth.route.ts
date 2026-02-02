// backend/src/apis/auth/auth.route.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { EmailController } from '../mail/mail.controller';
import {
  handleServiceResponse,
  validateHandle,
} from '@/common/utils/httpHandlers';
import {
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  ForgetPasswordSchema,
  VerifyEmailSchema,
} from './auth.schema';

const route = Router();
const emailController = new EmailController();

/**
 * @swagger
 * /auth/request-verify-email:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request email verification token
 *     description: Send a verification token to the provided email if it is not already registered.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: p.etitett04@gmail.com
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Invalid email format or email already registered
 *       429:
 *         description: Too many requests — please wait before requesting again
 *       500:
 *         description: Failed to send verification email
 */
route.post(
  '/request-verify-email',
  validateHandle(VerifyEmailSchema),
  emailController.requestVerifyEmail.bind(emailController)
);

// /**
//  * @swagger
//  * /auth/verify-email:
//  *   get:
//  *     tags:
//  *       - Auth
//  *     summary: Verify email using token
//  *     description: Validate the email verification token sent to the user's email.
//  *     parameters:
//  *       - in: query
//  *         name: token
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Verification token received via email
//  *         example: 123e4567-e89b-12d3-a456-426614174000
//  *     responses:
//  *       200:
//  *         description: Email verified successfully
//  *       400:
//  *         description: Token is missing or invalid format
//  *       410:
//  *         description: Token expired
//  *       500:
//  *         description: Failed to verify email
//  */
// route.get('/verify-email', emailController.verifyEmail.bind(emailController));

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify email with OTP
 *     description: Verify user's email using the OTP sent to their inbox
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid OTP or Email
 */
route.post(
  '/verify-email',
  validateHandle(VerifyEmailSchema), // ✅ Schema này phải khớp với body { email, otp }
  async (req, res) => {
    const serviceResponse = await AuthController.verifyEmail(req, res);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Create a new user account with name, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Thanh Tuyen
 *               email:
 *                 type: string
 *                 format: email
 *                 example: p.etitett04@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "12345678"
 *     responses:
 *       201:
 *         description: Register successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Register successfully"
 *               user:
 *                 id: "67420f51bcd9bb32fbe13aaf"
 *                 name: "Thanh Tuyen"
 *                 email: "p.etitett04@gmail.com"
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             example:
 *               message: "Email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal server error"
 */
route.post('/register', validateHandle(RegisterSchema), async (req, res) => {
  const serviceResponse = await AuthController.register(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user with email and password
 *     description: Login using email and password, returns access token and sets refresh token cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials or missing fields
 */
route.post('/login', validateHandle(LoginSchema), async (req, res) => {
  const serviceResponse = await AuthController.login(req, res);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Redirect to Google OAuth2 login
 *     description: Redirects the user to Google's OAuth2 consent page
 *     responses:
 *       302:
 *         description: Redirect to Google login page
 */
route.get('/google', (req, res) => {
  AuthController.oauthRedirect(req, res);
});

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Google OAuth2 callback
 *     description: Handles Google OAuth2 callback, logs in user and returns access token
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         description: Authorization code returned by Google
 *         schema:
 *           type: string
 *       - name: state
 *         in: query
 *         required: false
 *         description: State parameter for CSRF protection
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Login successful via Google OAuth2
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid code or failed login
 */
route.get('/google/callback', (req, res) => {
  AuthController.oauthCallback(req, res);
});

/**
 * @swagger
 * /auth/forget-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password reset code
 *     description: Send a one-time verification code to the user's email to reset password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset code sent to the email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset code sent to your email
 *       400:
 *         description: Invalid email format or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email format
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests. Please wait a few minutes before requesting again.
 */
route.post(
  '/forget-password',
  validateHandle(ForgetPasswordSchema), // ✅ Dùng Schema chỉ có email
  async (req, res) => {
    const serviceResponse = await AuthController.forgetPassword(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset user password
 *     description: Reset the password using the verification code sent to email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully
 *       400:
 *         description: Invalid code, expired code, or new password same as old
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid code
 */
route.post(
  '/reset-password',
  validateHandle(ResetPasswordSchema),
  async (req, res) => {
    const serviceResponse = await AuthController.resetPassword(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

route.post('/refreshToken', async (req, res) => {
  const serviceResponse = await AuthController.refreshToken(req);
  return handleServiceResponse(serviceResponse, res);
});

route.get('/me', async (req, res) => {
  const serviceResponse = await AuthController.getMe(req);
  return handleServiceResponse(serviceResponse, res);
});

route.post('/logout', async (req, res) => {
  const serviceResponse = await AuthController.logout(req, res);
  return handleServiceResponse(serviceResponse, res);
});

export default route;
