import { Router } from 'express';
import { UserController } from './users.controller';
import { handleServiceResponse } from '@/common/utils/httpHandlers';
import authenticateJWT from '@/common/middleware/authentication';
import { avatarUpload } from '@/config/multer';
// import { ServiceResponse, ResponseStatus } from '@/common/models/serviceResponse';
// import { StatusCodes } from 'http-status-codes';

const route = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Get all users
 *     responses:
 *       200:
 *         description: Get data user successfully
 *       500:
 *         description: Server Error
 */
route.get('/', async (_req, res) => {
  const serviceResponse = await UserController.getAllUsers();
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique identifier of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get detail information user successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server Error
 */
route.get('/:id', async (req, res) => {
  const serviceResponse = await UserController.getDetailUser(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /users/me/profile:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
route.patch('/me/profile', authenticateJWT, async (req, res) => {
  const serviceResponse = await UserController.updateProfile(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /users/me/avatar:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Upload or change avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: File invalid or missing
 *       401:
 *         description: Unauthorized
 */
route.patch(
  '/me/avatar',
  authenticateJWT,
  avatarUpload.single('avatar'),
  async (req, res) => {
    const serviceResponse = await UserController.uploadAvatarToCloudinary(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /users/change-password:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
route.patch('/change-password', authenticateJWT, async (req, res) => {
  const serviceResponse = await UserController.changePassword(req);
  return handleServiceResponse(serviceResponse, res);
});

export default route;
