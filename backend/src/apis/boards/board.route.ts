import { Router } from 'express';
import { BoardController } from './board.controller';
import { BoardTemplateController } from './board-template.controller';
import {
  handleServiceResponse,
  validateHandle,
  validateRequest,
} from '@/common/utils/httpHandlers';
import {
  checkBoardAccess,
  requireBoardPermissions,
  requireWorkspaceRoles,
} from '@/common/middleware/authorization';
import { boardCoverUpload } from '@/config/multer';
import { PERMISSIONS } from '@/common/constants/permissions';
import { addMemberToBoardSchema } from './board.schema';
import { ROLES } from '@/common/constants';
import authenticateJWT from '@/common/middleware/authentication';
import { ListController } from '../lists/list.controller';
import { CreateListSchema } from '../lists/list.schema';
const route = Router();

/**
 * @swagger
 * /boards:
 *   post:
 *     tags:
 *       - Boards
 *     summary: Create new board
 *     description: Create a new board inside a workspace
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - workspaceId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Sprint 1
 *               description:
 *                 type: string
 *                 example: Board cho sprint đầu tiên
 *               coverUrl:
 *                 type: string
 *                 example: https://example.com/cover.png
 *               workspaceId:
 *                 type: string
 *                 example: "a3b9e74d-1234-5678-9abc-def012345678"
 *               visibility:
 *                 type: string
 *                 enum: [private, public, workspace]
 *                 example: private
 *     responses:
 *       201:
 *         description: Board created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
route.post(
  '/',
  requireWorkspaceRoles(
    [ROLES.WORKSPACE_ADMIN, ROLES.WORKSPACE_MEMBER, ROLES.WORKSPACE_MODERATOR],
    'workspaceId',
    'body'
  ),
  async (req, res) => {
    const serviceResponse = await BoardController.create(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Get boards by workspace
 *     description: Retrieve all boards in a workspace (not closed)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         description: Workspace ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Boards retrieved successfully
 *       400:
 *         description: workspaceId missing or invalid
 *       401:
 *         description: Unauthorized
 */
route.get(
  '/',
  authenticateJWT,
  requireBoardPermissions(PERMISSIONS.BOARDS_READ),
  async (req, res) => {
    const serviceResponse = await BoardController.findAll(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/templates:
 *   get:
 *     tags:
 *       - Board Templates
 *     summary: Get board templates
 *     description: Lấy danh sách template (có thể filter theo workspaceId).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: false
 *         description: Filter templates theo workspace (kèm global - workspaceId = null)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of templates
 */
route.get('/templates', authenticateJWT, async (req, res) => {
  const serviceResponse = await BoardTemplateController.list(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /boards/{id}/template:
 *   post:
 *     tags:
 *       - Board Templates
 *     summary: Create a board template from an existing board
 *     description: Only board owner/admin (boards:manage) có thể tạo template.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sprint board template"
 *               description:
 *                 type: string
 *                 example: "Template dùng cho sprint planning"
 *               coverUrl:
 *                 type: string
 *                 example: "https://example.com/template-cover.png"
 *               workspaceId:
 *                 type: string
 *                 description: "Optional: workspace scope cho template"
 *     responses:
 *       201:
 *         description: Board template created successfully
 *       400:
 *         description: Invalid input or board not found
 *       403:
 *         description: Forbidden (insufficient permissions on board)
 */
route.post(
  '/:id/template',
  authenticateJWT,
  requireBoardPermissions(PERMISSIONS.BOARDS_MANAGE),
  async (req, res) => {
    const serviceResponse = await BoardTemplateController.createFromBoard(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/templates/{templateId}:
 *   get:
 *     tags:
 *       - Board Templates
 *     summary: Get a board template by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         description: Template ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *       404:
 *         description: Template not found
 */
route.get('/templates/:templateId', authenticateJWT, async (req, res) => {
  const serviceResponse = await BoardTemplateController.getOne(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /boards/templates/{templateId}/use:
 *   post:
 *     tags:
 *       - Board Templates
 *     summary: Create a new board from a template
 *     description: Yêu cầu quyền boards:create trong workspace target.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         description: Board Template ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workspaceId
 *             properties:
 *               workspaceId:
 *                 type: string
 *                 description: Workspace tạo board mới
 *               title:
 *                 type: string
 *                 description: Title override (nếu không truyền dùng name của template)
 *                 example: "Sprint 12 - Team A"
 *               description:
 *                 type: string
 *                 description: Description override
 *     responses:
 *       201:
 *         description: Board created from template successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Missing boards:create permission
 *       404:
 *         description: Template or workspace not found
 */
route.post('/templates/:templateId/use', authenticateJWT, async (req, res) => {
  const serviceResponse = await BoardTemplateController.apply(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /boards/{id}:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Get board by ID
 *     description: Retrieve a specific board (access based on visibility)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board retrieved successfully
 *       404:
 *         description: Board not found
 *       403:
 *         description: Forbidden (access denied based on visibility)
 */
route.get('/:id', checkBoardAccess('id'), async (req, res) => {
  const serviceResponse = await BoardController.findOne(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /boards/{id}:
 *   put:
 *     tags:
 *       - Boards
 *     summary: Update board
 *     description: Update board information (requires board member permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               coverUrl:
 *                 type: string
 *               isClosed:
 *                 type: boolean
 *               visibility:
 *                 type: string
 *                 enum: [private, public, workspace]
 *     responses:
 *       200:
 *         description: Board updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Board not found
 *       403:
 *         description: Forbidden (requires boards:update permission)
 */
route.put(
  '/:id',
  requireBoardPermissions(PERMISSIONS.BOARDS_UPDATE),
  async (req, res) => {
    const serviceResponse = await BoardController.update(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/archive:
 *   patch:
 *     tags:
 *       - Boards
 *     summary: Close board
 *     description: Soft delete board (set isClosed = true)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board closed successfully
 *       404:
 *         description: Board not found
 *       403:
 *         description: Forbidden (requires boards:delete permission)
 */
route.patch(
  '/:id/archive',
  requireBoardPermissions(PERMISSIONS.BOARDS_DELETE),
  async (req, res) => {
    const serviceResponse = await BoardController.closeBoard(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/reopen:
 *   patch:
 *     tags:
 *       - Boards
 *     summary: Reopen a closed board
 *     description: Restore a previously closed board (set isClosed = false)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board reopened successfully
 *       404:
 *         description: Board not found
 *       403:
 *         description: Forbidden (requires boards:update permission)
 */
route.patch(
  '/:id/reopen',
  requireBoardPermissions(PERMISSIONS.BOARDS_UPDATE),
  async (req, res) => {
    const serviceResponse = await BoardController.reopenBoard(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}:
 *   delete:
 *     tags:
 *       - Boards
 *     summary: Permanently delete a board
 *     description: Permanently deletes the specified board from the database
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board deleted permanently
 *       404:
 *         description: Board not found
 *       500:
 *         description: Server Error
 */
route.delete(
  '/:id',
  requireBoardPermissions(PERMISSIONS.BOARDS_DELETE),
  async (req, res) => {
    const serviceResponse = await BoardController.deleteBoardPermanently(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/invite:
 *   post:
 *     tags:
 *       - Boards
 *     summary: Invite a user to a board
 *     description: Add a member to a board and send an email notification. Only board owner or admin can invite.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the board
 *         example: "board-id-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - roleId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               roleId:
 *                 type: string
 *                 example: board_role_id
 *                 description: Role Id (BOARD_ADMIN, BOARD_OWNER, BOARD_MEMBER, BOARD_OBSERVER)
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Member added to board successfully"
 *                 member:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     boardId:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *       400:
 *         description: Bad request (missing email or invalid role)
 *       403:
 *         description: Forbidden (not owner/admin or user already a member)
 *       404:
 *         description: Board, user, or role not found
 */
route.post(
  '/:id/invite',
  validateHandle(addMemberToBoardSchema),
  requireBoardPermissions(PERMISSIONS.MEMBERS_INVITE),
  async (req, res) => {
    const serviceResponse = await BoardController.addMemberToBoard(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/generate-link:
 *   post:
 *     tags:
 *       - Boards
 *     summary: Generate a share link for a board
 *     description: Only board owner or admin can generate a share link.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the board
 *         example: "board-id-123"
 *     responses:
 *       200:
 *         description: Invite link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invite link created successfully"
 *                 link:
 *                   type: string
 *                   example: "http://localhost:3000/boards/board-id-123/invite/abcdef123456"
 *       400:
 *         description: Bad request (failed to create invite link)
 *       401:
 *         description: Unauthorized (not a board member or insufficient role)
 */
route.post(
  '/:id/generate-link',
  requireBoardPermissions(PERMISSIONS.MEMBERS_INVITE),
  async (req, res) => {
    const serviceResponse = await BoardController.createLinkShareBoard(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/invite-link:
 *   delete:
 *     tags:
 *       - Boards
 *     summary: Delete a board's share link
 *     description: Only board owner or admin can delete the share link.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the board
 *         example: "board-id-123"
 *     responses:
 *       200:
 *         description: Invite link deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invite link deleted successfully"
 *       400:
 *         description: Bad request (no link to delete or failed)
 *       401:
 *         description: Unauthorized (not a board member or insufficient role)
 */
route.delete(
  '/:id/invite-link',
  requireBoardPermissions(PERMISSIONS.MEMBERS_MANAGE),
  async (req, res) => {
    const serviceResponse = await BoardController.deleteLinkShareBoard(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/invite/{inviteToken}:
 *   post:
 *     tags:
 *       - Boards
 *     summary: Join a board via invite link
 *     description: User joins the board using the invite token. Default role is BOARD_MEMBER.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the board
 *         example: "board-id-123"
 *       - in: path
 *         name: inviteToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *         example: "abcdef123456"
 *     responses:
 *       200:
 *         description: Successfully joined the board
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You joined this board successfully"
 *                 member:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     boardId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     roleId:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       400:
 *         description: Failed to join (invalid token or already a member)
 *       401:
 *         description: Unauthorized (user not logged in)
 */
route.post('/:id/invite/:inviteToken', async (req, res) => {
  const serviceResponse = await BoardController.JoinBoardByLink(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /lists/{boardId}/lists:
 *   get:
 *     tags:
 *       - Lists
 *     summary: Get all lists in a board
 *     description: Retrieve all lists that belong to a specific board
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         description: ID of the board to fetch lists from
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: "e4f9a123-4567-8901-2345-67890abcdef"
 *                   title:
 *                     type: string
 *                     example: "My List"
 *                   position:
 *                     type: number
 *                     example: 0
 *                   isArchived:
 *                     type: boolean
 *                     example: false
 *       400:
 *         description: Invalid boardId
 *       404:
 *         description: Board not found
 *       500:
 *         description: Server error
 */
route.get('/:boardId/lists', async (req, res) => {
  const response = await ListController.getAllListsByBoard(req);
  return handleServiceResponse(response, res);
});

/**
 * @swagger
 * /boards/{boardId}/lists:
 *   post:
 *     tags:
 *       - Lists
 *     summary: Create a new list in a board
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the board
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New List"
 *     responses:
 *       201:
 *         description: List created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Board not found
 */
route.post(
  '/:boardId/lists',
  validateRequest(CreateListSchema),
  async (req, res) => {
    const response = await ListController.createList(req);
    return handleServiceResponse(response, res);
  }
);
export default route;

/**
 * @swagger
 * /boards/{id}/transfer-ownership:
 *   patch:
 *     tags:
 *       - Boards
 *     summary: Transfer board ownership
 *     description: Transfer ownership of the board to another user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *       - in: body
 *         name: newOwnerId
 *         required: true
 *         description: New user ID who will become the board owner
 *         schema:
 *           type: object
 *           properties:
 *             newOwnerId:
 *               type: string
 *               example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ownership transferred successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Board or user not found
 */
route.patch('/:id/transfer-ownership', authenticateJWT, async (req, res) => {
  const serviceResponse = await BoardController.transferOwnership(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /boards/{id}/settings:
 *   patch:
 *     tags:
 *       - Boards
 *     summary: Update board settings
 *     description: Update visibility, background, and permission policies of the board
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [private, workspace, public]
 *                 example: workspace
 *               backgroundUrl:
 *                 type: string
 *                 example: "https://images.example.com/bg-1.png"
 *               workspaceMembersCanEditAndJoin:
 *                 type: boolean
 *                 example: true
 *               memberManagePolicy:
 *                 type: string
 *                 enum: [admins_only, all_members]
 *                 example: admins_only
 *               commentPolicy:
 *                 type: string
 *                 enum: [disabled, members, workspace, anyone]
 *                 example: members
 *     responses:
 *       200:
 *         description: Board settings updated successfully
 *       403:
 *         description: User is not a board admin or missing boards:update permission
 *       400:
 *         description: Invalid settings payload
 *       500:
 *         description: Server Error
 */
route.patch(
  '/:id/settings',
  authenticateJWT,
  requireBoardPermissions(PERMISSIONS.BOARDS_UPDATE),
  async (req, res) => {
    const serviceResponse = await BoardController.updateSettings(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/settings/cover:
 *   patch:
 *     tags:
 *       - Boards
 *     summary: Update board cover image
 *     description: Change the cover image for the board (upload image file)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, png, webp)
 *     responses:
 *       200:
 *         description: Board cover updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Board not found
 *       500:
 *         description: Internal server error
 */
route.patch(
  '/:id/settings/cover',
  authenticateJWT,
  requireBoardPermissions(PERMISSIONS.BOARDS_UPDATE),
  boardCoverUpload.single('cover'),
  async (req, res) => {
    const serviceResponse = await BoardController.updateCover(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/members:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Get board members
 *     description: Retrieve all members of the board (id, name, email, roleName)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board members retrieved successfully
 *       404:
 *         description: Board not found
 *       500:
 *         description: Internal server error
 */
route.get('/:id/members', authenticateJWT, async (req, res) => {
  const serviceResponse = await BoardController.getMembers(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /boards/{id}/members/{userId}:
 *   delete:
 *     tags:
 *       - Boards
 *     summary: Remove a member from a board
 *     description: Only allowed users (tuỳ memberManagePolicy) được xoá thành viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         description: User ID to remove from board
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden (no permission to remove)
 *       404:
 *         description: Board or member not found
 */
route.delete('/:id/members/:userId', authenticateJWT, async (req, res) => {
  const serviceResponse = await BoardController.removeMemberFromBoard(req);
  return handleServiceResponse(serviceResponse, res);
});

/**
 * @swagger
 * /boards/{id}/cards/search:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Search and filter cards in a board
 *     description: Search cards within a board by keyword, label, assignee, status, due date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Board ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: keyword
 *         required: false
 *         schema:
 *           type: string
 *         description: Search keyword in card title/description
 *       - in: query
 *         name: labelIds
 *         required: false
 *         schema:
 *           type: string
 *         description: Comma-separated label ids (id1,id2,id3)
 *       - in: query
 *         name: memberId
 *         required: false
 *         schema:
 *           type: string
 *         description: Assignee user id
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: dueFrom
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dueTo
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of cards
 *       403:
 *         description: Forbidden
 */
route.get(
  '/:id/cards/search',
  authenticateJWT,
  checkBoardAccess(),
  requireBoardPermissions(PERMISSIONS.CARDS_READ),
  async (req, res) => {
    const serviceResponse = await BoardController.searchCards(req);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * @swagger
 * /boards/{id}/activity:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Get board activity log
 *     description: Return paginated activity timeline of a board.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Board ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Activity list
 *       403:
 *         description: Forbidden
 */
route.get(
  '/:boardId/activity',
  authenticateJWT,
  checkBoardAccess(),
  async (req, res) => {
    const serviceResponse = await BoardController.getActivity(req);
    return handleServiceResponse(serviceResponse, res);
  }
);
