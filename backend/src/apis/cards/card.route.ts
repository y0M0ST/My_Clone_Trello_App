import {
  handleServiceResponse,
  validateRequest,
} from '@/common/utils/httpHandlers';
import { Router } from 'express';
import {
  CardIdSchema,
  CreateCardSchema,
  GetCardSchema,
  CardLabelSchema,
  CardMemberSchema,
  UpdateCardSchema,
  AddCommentSchema,
  UpdateCommentSchema,
  DeleteCommentSchema,
  GetActionSchema,
  CreateAttachmentSchema,
  DeleteAttachmentSchema,
  GetAttchmentsSchema,
  GetAnttachmentSchema,
  GetChecklistsSchema,
  CreateChecklistSchema,
  UpdateChecklistSchema,
  DeleteChecklistSchema,
  GetCheckItemsSchema,
  GetCheckItemSchema,
  CreateCheckItemSchema,
  UpdateCheckItemSchema,
  DeleteCheckItemSchema,
} from './card.schema';
import { CardController } from './card.controller';
import { attachmentUpload } from '@/config/multer';

const route = Router();

/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     tags:
 *       - Card
 *     summary: Get a card by ID
 *     description: Retrieve detailed information about a specific card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return (e.g., "id,title,description,labels,members")
 *       - in: query
 *         name: actions
 *         schema:
 *           type: string
 *         description: Include card actions/comments
 *       - in: query
 *         name: attachments
 *         schema:
 *           type: boolean
 *         description: Include attachments
 *       - in: query
 *         name: attachment_fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of attachment fields
 *       - in: query
 *         name: members
 *         schema:
 *           type: string
 *         description: Include card members
 *       - in: query
 *         name: member_fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of member fields
 *       - in: query
 *         name: checklist
 *         schema:
 *           type: boolean
 *         description: Include checklists
 *       - in: query
 *         name: checkItemFields
 *         schema:
 *           type: string
 *         description: Comma-separated list of checkItem fields
 *       - in: query
 *         name: list
 *         schema:
 *           type: boolean
 *         description: Include list information
 *       - in: query
 *         name: board
 *         schema:
 *           type: boolean
 *         description: Include board information
 *       - in: query
 *         name: board_fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of board fields
 *     responses:
 *       200:
 *         description: Successfully retrieved card
 *       400:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
// Get a card
route.get('/:id', validateRequest(GetCardSchema), async (req, res) => {
  const response = await CardController.getCard(req);
  return handleServiceResponse(response, res);
});

/**
 * @swagger
 * /cards:
 *   post:
 *     tags:
 *       - Card
 *     summary: Create a new card
 *     description: Create a new card in a list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listId
 *               - title
 *             properties:
 *               listId:
 *                 type: string
 *                 format: uuid
 *                 description: The list ID to add the card to
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: "New Task"
 *               description:
 *                 type: string
 *                 example: "Task description"
 *               position:
 *                 type: number
 *                 example: 1
 *               coverUrl:
 *                 type: string
 *                 format: uri
 *               start:
 *                 type: string
 *                 format: date-time
 *               due:
 *                 type: string
 *                 format: date-time
 *               isCompleted:
 *                 type: boolean
 *                 default: false
 *               cardSourceId:
 *                 type: string
 *                 format: uuid
 *                 description: Source card ID for copying
 *               keepFromSource:
 *                 type: string
 *                 description: Comma-separated fields to copy (members,labels,comments,attachments,checklists)
 *     responses:
 *       201:
 *         description: Card created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
// Create a card
route.post('/', validateRequest(CreateCardSchema), async (req, res) => {
  const response = await CardController.createCard(req);
  return handleServiceResponse(response, res);
});

/**
 * @swagger
 * /cards/{id}:
 *   put:
 *     tags:
 *       - Card
 *     summary: Update a card
 *     description: Update card properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               position:
 *                 type: number
 *               isArchived:
 *                 type: boolean
 *               listId:
 *                 type: string
 *                 format: uuid
 *               boardId:
 *                 type: string
 *                 format: uuid
 *               coverUrl:
 *                 type: string
 *                 format: uri
 *               start:
 *                 type: string
 *                 format: date-time
 *               due:
 *                 type: string
 *                 format: date-time
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Card updated successfully
 *       400:
 *         description: Card not found or invalid input
 *       401:
 *         description: Unauthorized
 */
// Update a card
route.put('/:id', validateRequest(UpdateCardSchema), async (req, res) => {
  const response = await CardController.updateCard(req);
  return handleServiceResponse(response, res);
});

/**
 * @swagger
 * /cards/{id}:
 *   delete:
 *     tags:
 *       - Card
 *     summary: Delete a card
 *     description: Permanently delete a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Card deleted successfully
 *       400:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
// Delete a card
route.delete('/:id', validateRequest(CardIdSchema), async (req, res) => {
  const response = await CardController.deleteCard(req);
  return handleServiceResponse(response, res);
});

/**
 * @swagger
 * /cards/{id}/labels/{labelId}:
 *   post:
 *     tags:
 *       - Card
 *     summary: Add label to card
 *     description: Add a label to a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Label ID
 *     responses:
 *       200:
 *         description: Label added successfully
 *       400:
 *         description: Card or label not found
 *       401:
 *         description: Unauthorized
 */
// Add label to card
route.post(
  '/:id/labels/:labelId',
  validateRequest(CardLabelSchema),
  async (req, res) => {
    const response = await CardController.addLabelToCard(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/labels/{labelId}:
 *   delete:
 *     tags:
 *       - Card
 *     summary: Remove label from card
 *     description: Remove a label from a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Label ID
 *     responses:
 *       200:
 *         description: Label removed successfully
 *       400:
 *         description: Card or label not found
 *       401:
 *         description: Unauthorized
 */
// Remove label from card
route.delete(
  '/:id/labels/:labelId',
  validateRequest(CardLabelSchema),
  async (req, res) => {
    const response = await CardController.removeLabelFromCard(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/members/{memberId}:
 *   post:
 *     tags:
 *       - Card
 *     summary: Add member to card
 *     description: Add a member to a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Member ID (User ID)
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: Card or member not found
 *       401:
 *         description: Unauthorized
 */
// Add member to card
route.post(
  '/:id/members/:memberId',
  validateRequest(CardMemberSchema),
  async (req, res) => {
    const response = await CardController.addMemberToCard(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/members/{memberId}:
 *   delete:
 *     tags:
 *       - Card
 *     summary: Remove member from card
 *     description: Remove a member from a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Member ID (User ID)
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       400:
 *         description: Card or member not found
 *       401:
 *         description: Unauthorized
 */
// Remove member from card
route.delete(
  '/:id/members/:memberId',
  validateRequest(CardMemberSchema),
  async (req, res) => {
    const response = await CardController.removeMemberFromCard(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/actions:
 *   get:
 *     tags:
 *       - Card
 *     summary: Get card actions/comments
 *     description: Retrieve all actions and comments on a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Filter actions by type (e.g., commentCard)
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Successfully retrieved actions
 *       400:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
// Get actions/comments
route.get(
  '/:id/actions',
  validateRequest(GetActionSchema),
  async (req, res) => {
    const response = await CardController.getActions(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/actions/comments:
 *   post:
 *     tags:
 *       - Card
 *     summary: Add comment to card
 *     description: Add a new comment to a card. Sends real-time notifications to card members via SSE.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Comment text
 *                 example: "This is a comment"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 type:
 *                   type: string
 *                   example: commentCard
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 memberCreator:
 *                   type: object
 *       400:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
// Add comment
route.post(
  '/:id/actions/comments',
  validateRequest(AddCommentSchema),
  async (req, res) => {
    const response = await CardController.addComment(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/actions/{actionId}/comments:
 *   put:
 *     tags:
 *       - Card
 *     summary: Update a comment
 *     description: Update an existing comment on a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Action/Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Updated comment text
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
// Update comment
route.put(
  '/:id/actions/:actionId/comments',
  validateRequest(UpdateCommentSchema),
  async (req, res) => {
    const response = await CardController.updateComment(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/actions/{actionId}/comments:
 *   delete:
 *     tags:
 *       - Card
 *     summary: Delete a comment
 *     description: Delete a comment from a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Action/Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       400:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
// Delete comment
route.delete(
  '/:id/actions/:actionId/comments',
  validateRequest(DeleteCommentSchema),
  async (req, res) => {
    const response = await CardController.deleteComment(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/attachments:
 *   post:
 *     tags:
 *       - Card
 *     summary: Create attachment
 *     description: Add an attachment to a card. Sends real-time notifications to card members via SSE.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Attachment name
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL of the attachment (if not uploading file)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               setCover:
 *                 type: boolean
 *                 description: Set this attachment as the card cover
 *     responses:
 *       201:
 *         description: Attachment created successfully
 *       400:
 *         description: Card not found or invalid input
 *       401:
 *         description: Unauthorized
 */
// Create attachment
route.post(
  '/:id/attachments',
  attachmentUpload.single('file'),
  validateRequest(CreateAttachmentSchema),
  async (req, res) => {
    const response = await CardController.createAttachment(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/attachments/{attachmentId}:
 *   delete:
 *     tags:
 *       - Card
 *     summary: Delete attachment
 *     description: Delete an attachment from a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attachment ID
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       400:
 *         description: Attachment not found
 *       401:
 *         description: Unauthorized
 */
// Delete attachment
route.delete(
  '/:id/attachments/:attachmentId',
  validateRequest(DeleteAttachmentSchema),
  async (req, res) => {
    const response = await CardController.deleteAttachment(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/attachments:
 *   get:
 *     tags:
 *       - Card
 *     summary: Get attachments
 *     description: Get all attachments of a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return
 *     responses:
 *       200:
 *         description: Successfully retrieved attachments
 *       400:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
// Get attachments
route.get(
  '/:id/attachments',
  validateRequest(GetAttchmentsSchema),
  async (req, res) => {
    const response = await CardController.getAttachments(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/attachments/{attachmentId}:
 *   get:
 *     tags:
 *       - Card
 *     summary: Get single attachment
 *     description: Get a specific attachment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attachment ID
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return
 *     responses:
 *       200:
 *         description: Successfully retrieved attachment
 *       400:
 *         description: Attachment not found
 *       401:
 *         description: Unauthorized
 */
// Get single attachment
route.get(
  '/:id/attachments/:attachmentId',
  validateRequest(GetAnttachmentSchema),
  async (req, res) => {
    const response = await CardController.getAttachment(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists:
 *   get:
 *     tags:
 *       - Card
 *     summary: Get checklists
 *     description: Get all checklists of a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return
 *       - in: query
 *         name: checkItems
 *         schema:
 *           type: boolean
 *         description: Include check items
 *       - in: query
 *         name: checkItem_fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of checkItem fields
 *     responses:
 *       200:
 *         description: Successfully retrieved checklists
 *       400:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
// Get checklists
route.get(
  '/:id/checklists',
  validateRequest(GetChecklistsSchema),
  async (req, res) => {
    const response = await CardController.getChecklists(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists:
 *   post:
 *     tags:
 *       - Card
 *     summary: Create checklist
 *     description: Create a new checklist on a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Checklist name
 *                 example: "Todo List"
 *               position:
 *                 type: number
 *                 description: Position of the checklist
 *               checklistSourceId:
 *                 type: string
 *                 format: uuid
 *                 description: Source checklist ID for copying
 *     responses:
 *       201:
 *         description: Checklist created successfully
 *       400:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
// Create checklist
route.post(
  '/:id/checklists',
  validateRequest(CreateChecklistSchema),
  async (req, res) => {
    const response = await CardController.createChecklist(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists/{checklistId}:
 *   put:
 *     tags:
 *       - Card
 *     summary: Update checklist
 *     description: Update a checklist on a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Checklist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               position:
 *                 type: number
 *     responses:
 *       200:
 *         description: Checklist updated successfully
 *       400:
 *         description: Checklist not found
 *       401:
 *         description: Unauthorized
 */
// Update checklist
route.put(
  '/:id/checklists/:checklistId',
  validateRequest(UpdateChecklistSchema),
  async (req, res) => {
    const response = await CardController.updateChecklist(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists/{checklistId}:
 *   delete:
 *     tags:
 *       - Card
 *     summary: Delete checklist
 *     description: Delete a checklist from a card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Checklist ID
 *     responses:
 *       200:
 *         description: Checklist deleted successfully
 *       400:
 *         description: Checklist not found
 *       401:
 *         description: Unauthorized
 */
// Delete checklist
route.delete(
  '/:id/checklists/:checklistId',
  validateRequest(DeleteChecklistSchema),
  async (req, res) => {
    const response = await CardController.deleteChecklist(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists/{checklistId}/checkItems:
 *   get:
 *     tags:
 *       - Card
 *     summary: Get checkItems
 *     description: Get all check items of a checklist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Checklist ID
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return
 *     responses:
 *       200:
 *         description: Successfully retrieved check items
 *       400:
 *         description: Checklist not found
 *       401:
 *         description: Unauthorized
 */
// Get checkItems
route.get(
  '/:id/checklists/:checklistId/checkItems',
  validateRequest(GetCheckItemsSchema),
  async (req, res) => {
    const response = await CardController.getCheckItems(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists/{checklistId}/checkItems/{checkItemId}:
 *   get:
 *     tags:
 *       - Card
 *     summary: Get single checkItem
 *     description: Get a specific check item by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Checklist ID
 *       - in: path
 *         name: checkItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CheckItem ID
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return
 *     responses:
 *       200:
 *         description: Successfully retrieved check item
 *       400:
 *         description: Check item not found
 *       401:
 *         description: Unauthorized
 */
// Get single checkItem
route.get(
  '/:id/checklists/:checklistId/checkItems/:checkItemId',
  validateRequest(GetCheckItemSchema),
  async (req, res) => {
    const response = await CardController.getCheckItem(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists/{checklistId}/checkItems:
 *   post:
 *     tags:
 *       - Card
 *     summary: Create checkItem
 *     description: Create a new check item in a checklist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Checklist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: CheckItem name
 *                 example: "Task 1"
 *               position:
 *                 type: number
 *               isChecked:
 *                 type: boolean
 *                 default: false
 *               due:
 *                 type: string
 *                 format: date-time
 *               dueReminder:
 *                 type: string
 *                 format: date-time
 *               assignedUserId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: CheckItem created successfully
 *       400:
 *         description: Checklist not found
 *       401:
 *         description: Unauthorized
 */
// Create checkItem
route.post(
  '/:id/checklists/:checklistId/checkItems',
  validateRequest(CreateCheckItemSchema),
  async (req, res) => {
    const response = await CardController.createCheckItem(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists/{checklistId}/checkItems/{checkItemId}:
 *   put:
 *     tags:
 *       - Card
 *     summary: Update checkItem
 *     description: Update a check item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Checklist ID
 *       - in: path
 *         name: checkItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CheckItem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               position:
 *                 type: number
 *               isChecked:
 *                 type: boolean
 *               due:
 *                 type: string
 *                 format: date-time
 *               dueReminder:
 *                 type: string
 *                 format: date-time
 *               checklistId:
 *                 type: string
 *                 format: uuid
 *                 description: Move to another checklist
 *     responses:
 *       200:
 *         description: CheckItem updated successfully
 *       400:
 *         description: CheckItem not found
 *       401:
 *         description: Unauthorized
 */
// Update checkItem
route.put(
  '/:id/checklists/:checklistId/checkItems/:checkItemId',
  validateRequest(UpdateCheckItemSchema),
  async (req, res) => {
    const response = await CardController.updateCheckItem(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/{id}/checklists/{checklistId}/checkItems/{checkItemId}:
 *   delete:
 *     tags:
 *       - Card
 *     summary: Delete checkItem
 *     description: Delete a check item from a checklist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Card ID
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Checklist ID
 *       - in: path
 *         name: checkItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CheckItem ID
 *     responses:
 *       200:
 *         description: CheckItem deleted successfully
 *       400:
 *         description: CheckItem not found
 *       401:
 *         description: Unauthorized
 */
// Delete checkItem
route.delete(
  '/:id/checklists/:checklistId/checkItems/:checkItemId',
  validateRequest(DeleteCheckItemSchema),
  async (req, res) => {
    const response = await CardController.deleteCheckItem(req);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /cards/move:
 *   patch:
 *     tags:
 *       - Card
 *     summary: Move card (Drag & Drop)
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
 *               - nextColumnId
 *               - nextIndex
 *             properties:
 *               cardId:
 *                 type: string
 *                 format: uuid
 *               prevColumnId:
 *                 type: string
 *                 format: uuid
 *               prevIndex:
 *                 type: number
 *               nextColumnId:
 *                 type: string
 *                 format: uuid
 *               nextIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Card moved successfully
 */
route.patch('/move', async (req, res) => {
  const response = await CardController.moveCard(req);
  return handleServiceResponse(response, res);
});

export default route;
