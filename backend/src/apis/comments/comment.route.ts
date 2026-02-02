import { Router } from 'express';
import { CommentController } from './comment.controller';
import { handleServiceResponse } from '@/common/utils/httpHandlers';
import authenticateJWT from '@/common/middleware/authentication';

const route = Router();

/**
 * @swagger
 * /comments:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Create comment on a card
 *     description: Create a new comment on a given card, obeying board.commentPolicy
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardId
 *               - content
 *             properties:
 *               cardId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 *       403:
 *         description: Forbidden by commentPolicy
 */
route.post('/', authenticateJWT, async (req, res) => {
  const serviceResponse = await CommentController.create(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /comments/card/{cardId}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get comments of a card
 *     description: List all comments for a specific card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
route.get('/card/:cardId', authenticateJWT, async (req, res) => {
  const serviceResponse = await CommentController.listByCard(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     tags:
 *       - Comments
 *     summary: Update a comment
 *     description: Update an existing comment (owner or moderator), enforcing commentPolicy
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated
 *       403:
 *         description: Forbidden
 */
route.put('/:id', authenticateJWT, async (req, res) => {
  const serviceResponse = await CommentController.update(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     tags:
 *       - Comments
 *     summary: Delete a comment
 *     description: Delete an existing comment (owner or moderator), enforcing commentPolicy
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Forbidden
 */
route.delete('/:id', authenticateJWT, async (req, res) => {
  const serviceResponse = await CommentController.delete(req);
  return handleServiceResponse(serviceResponse, res);
});

export default route;
