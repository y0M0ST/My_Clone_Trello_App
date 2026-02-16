import { Router } from 'express';
import { ListController } from './list.controller';
import {
  handleServiceResponse,
  validateRequest,
} from '@/common/utils/httpHandlers';
import {
  ListIdSchema,
  MoveListToBoardSchema,
  MoveAllCardsSchema,
  CopyListSchema,
  EditListName,
  UpdateListSchema,
  ReorderList,
} from './list.schema';
import { requireBoardMember } from '@/common/middleware/requireBoardMember.middleware';
import {
  PERMISSIONS,
  requireListPermissions,
} from '@/common/middleware/authorization';

const route = Router();
route.use('/:id', requireBoardMember());

/**
 *
 * @swagger
 * /lists/{id}/archive:
 *   patch:
 *     tags:
 *       - Lists
 *     summary: Archive a list
 *     description: Archive a list by setting it as archived
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: List ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List archived successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: List not found
 */
route.patch(
  '/:id/archive',
  validateRequest(ListIdSchema),
  requireListPermissions(PERMISSIONS.LISTS_ARCHIVE),
  async (req, res) => {
    const listId = req.params.id as string;
    const response = await ListController.archiveList(listId);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /lists/{id}/reopen:
 *   patch:
 *     tags:
 *       - Lists
 *     summary: reopen a list
 *     description: Restore an archived list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: List ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List reopend successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: List not found
 */
route.patch(
  '/:id/reopen',
  validateRequest(ListIdSchema),
  requireListPermissions(PERMISSIONS.LISTS_UPDATE),
  async (req, res) => {
    const listId = req.params.id as string;
    const response = await ListController.unarchiveList(listId);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /lists/{id}/archive-cards:
 *   patch:
 *     tags:
 *       - Lists
 *     summary: Archive all cards in a list
 *     description: Archive all cards belonging to a specific list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: List ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: All cards archived successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: List not found
 */
route.patch(
  '/:id/archive-all-cards',
  validateRequest(ListIdSchema),
  requireListPermissions(PERMISSIONS.CARDS_ARCHIVE),
  async (req, res) => {
    const listId = req.params.id as string;
    const response = await ListController.archiveAllCardsInList(listId);
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /lists/{id}/move:
 *   put:
 *     tags:
 *       - Lists
 *     summary: Move a list to a different board
 *     description: Transfer a list from one board to another
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: List ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - boardId
 *             properties:
 *               boardId:
 *                 type: string
 *                 format: uuid
 *                 example: "a3b9e74d-1234-5678-9abc-def012345678"
 *     responses:
 *       200:
 *         description: List moved successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: List or board not found
 */
route.patch(
  '/:id/move',
  validateRequest(MoveListToBoardSchema),
  requireListPermissions(PERMISSIONS.LISTS_UPDATE),
  async (req, res) => {
    const listId = req.params.id as string;
    const { boardId, position } = req.body;
    const response = await ListController.moveListToBoard(
      listId,
      boardId as string,
      position as number
    );
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /lists/{id}/move-all-cards:
 *   patch:
 *     tags:
 *       - Lists
 *     summary: Move all cards from one list to another
 *     description: Transfer all cards from source list to target list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Source List ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetListId
 *             properties:
 *               targetListId:
 *                 type: string
 *                 format: uuid
 *                 example: "b4c8e85d-2345-6789-0bcd-efa123456789"
 *               targetBoardId:
 *                 type: string
 *                 format: uuid
 *                 example: "c5d9f96e-3456-7890-1cde-fab234567890"
 *                 description: Optional - if moving to a different board
 *     responses:
 *       200:
 *         description: Cards moved successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: List not found
 */
route.patch(
  '/:id/move-all-cards',
  validateRequest(MoveAllCardsSchema),
  requireListPermissions(PERMISSIONS.CARDS_MOVE),
  async (req, res) => {
    const listId = req.params.id as string;
    const { targetListId, targetBoardId } = req.body;
    const response = await ListController.moveAllCardsToAnotherList(
      listId,
      targetListId as string,
      targetBoardId as string
    );
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /lists/{id}/copy:
 *   post:
 *     tags:
 *       - Lists
 *     summary: Copy a list to another board
 *     description: Create a duplicate of a list with all its cards in a target board
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Source List ID to copy
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetBoardId
 *             properties:
 *               targetBoardId:
 *                 type: string
 *                 format: uuid
 *                 example: "a3b9e74d-1234-5678-9abc-def012345678"
 *                 description: Board where the list will be copied to
 *               title:
 *                 type: string
 *                 example: "My New List"
 *                 description: Optional - custom title for copied list (defaults to "Original Title (Copy)")
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 example: 0
 *                 description: Optional - position in target board (defaults to last position)
 *     responses:
 *       201:
 *         description: List copied successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Source list or target board not found
 */
route.post(
  '/:id/copy',
  validateRequest(CopyListSchema),
  requireListPermissions(PERMISSIONS.LISTS_CREATE),
  async (req, res) => {
    const listId = req.params.id as string;
    const { targetBoardId, title, position } = req.body;
    const response = await ListController.copyListToBoard(
      listId,
      targetBoardId as string,
      title as string,
      position as number
    );
    return handleServiceResponse(response, res);
  }
);

/**
 * @swagger
 * /lists/{id}:
 *   patch:
 *     tags:
 *       - Lists
 *     summary: Update list
 *     description: Update specific fields of a list (title, isArchived)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: List ID
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
 *                 example: "New List Title"
 *               isArchived:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: List updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Permission denied
 *       404:
 *         description: List not found
 */
route.patch('/:id', validateRequest(UpdateListSchema), async (req, res) => {
  const response = await ListController.updateList(req);
  return handleServiceResponse(response, res);
});

/**
 * @swagger
 * /lists/{id}/reorder:
 *   patch:
 *     tags:
 *       - Lists
 *     summary: Reorder a list
 *     description: Change the position of a list by placing it between previous and next lists
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Current List ID
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
 *               prevListId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: "11111111-1111-1111-1111-111111111111"
 *                 description: ID of the previous list (null if moved to first position)
 *               nextListId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: "22222222-2222-2222-2222-222222222222"
 *                 description: ID of the next list (null if moved to last position)
 *     responses:
 *       200:
 *         description: List reordered successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Permission denied
 *       404:
 *         description: List not found
 */
route.patch('/:id/reorder', validateRequest(ReorderList), async (req, res) => {
  const currentListId = req.params.id as string;
  const { prevListId, nextListId } = req.body;
  const response = await ListController.reorderList(
    currentListId,
    prevListId as string,
    nextListId as string
  );
  return handleServiceResponse(response, res);
});

/**
 * @swagger
 * /lists/{id}/cards:
 *   get:
 *     tags:
 *       - Lists
 *     summary: Get all cards in a list
 *     description: Retrieve all cards that belong to a specific list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: List ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Successfully retrieved all cards in the list
 *       400:
 *         description: Invalid input
 *       404:
 *         description: List not found
 */
route.get('/:id/cards', validateRequest(ListIdSchema), async (req, res) => {
  const listId = req.params.id as string;
  const response = await ListController.getAllCardsInList(listId);
  return handleServiceResponse(response, res);
});



/**
 * @swagger
 * /lists/{id}:
 *   delete:
 *     tags:
 *       - Lists
 *     summary: Delete a list
 *     description: Permanently delete a list and all its cards
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: List ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List deleted successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Permission denied
 *       404:
 *         description: List not found
 */
route.delete(
  '/:id',
  validateRequest(ListIdSchema),
  requireListPermissions(PERMISSIONS.LISTS_DELETE),
  async (req, res) => {
    const listId = req.params.id as string;
    const response = await ListController.deleteList(listId);
    return handleServiceResponse(response, res);
  }
);

export default route;
