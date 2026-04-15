import { AppDataSource } from '@/config/data-source';
import { WorkspaceMembers } from '@/common/entities/workspace-member.entity';
import { BoardMembers } from '@/common/entities/board-member.entity';
import { Board } from '@/common/entities/board.entity';
import { Workspace } from '@/common/entities/workspace.entity';
import { List } from '@/common/entities/list.entity';
import { Card } from '@/common/entities/card.entity';
import { ROLES, Role } from '@/common/constants/roles';
import { Permission, PERMISSIONS } from '@/common/constants/permissions';
import { rbacCache } from './rbacCache';

export type ResourceType = 'workspace' | 'board' | 'list' | 'card';
export type BoardVisibility = 'private' | 'workspace' | 'public';
export type WorkspaceVisibility = 'private' | 'public';

export interface UserContext {
  userId: string;
  workspaceRole?: Role;
  boardRole?: Role;
  isWorkspaceMember: boolean;
  isBoardMember: boolean;
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  userContext?: UserContext;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.ADMIN]: 100,
  [ROLES.WORKSPACE_ADMIN]: 90,
  [ROLES.WORKSPACE_MODERATOR]: 80,
  [ROLES.BOARD_OWNER]: 75,
  [ROLES.BOARD_ADMIN]: 70,
  [ROLES.WORKSPACE_MEMBER]: 60,
  [ROLES.BOARD_MEMBER]: 50,
  [ROLES.WORKSPACE_OBSERVER]: 40,
  [ROLES.BOARD_OBSERVER]: 30,
  [ROLES.USER]: 20,
  [ROLES.GUEST]: 10,
};

// Cached board info interface
interface CachedBoardInfo {
  id: string;
  visibility: BoardVisibility;
  isClosed: boolean;
  workspaceId: string;
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // System Admin - Full access
  [ROLES.ADMIN]: Object.values(PERMISSIONS),

  // Workspace Admin - Quản lý workspace
  [ROLES.WORKSPACE_ADMIN]: [
    PERMISSIONS.WORKSPACES_READ,
    PERMISSIONS.WORKSPACES_UPDATE,
    PERMISSIONS.WORKSPACES_DELETE,
    PERMISSIONS.WORKSPACES_MANAGE,
    PERMISSIONS.BOARDS_CREATE,
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.BOARDS_UPDATE,
    PERMISSIONS.BOARDS_DELETE,
    PERMISSIONS.BOARDS_MANAGE,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.MEMBERS_REMOVE,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_MANAGE,
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.LISTS_DELETE,
    PERMISSIONS.LISTS_ARCHIVE,
    PERMISSIONS.CARDS_CREATE,
    PERMISSIONS.CARDS_READ,
    PERMISSIONS.CARDS_UPDATE,
    PERMISSIONS.CARDS_DELETE,
    PERMISSIONS.CARDS_ASSIGN,
    PERMISSIONS.CARDS_MOVE,
    PERMISSIONS.CARDS_ARCHIVE,
    PERMISSIONS.COMMENTS_CREATE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_UPDATE,
    PERMISSIONS.COMMENTS_DELETE,
    PERMISSIONS.COMMENTS_MODERATE,
    PERMISSIONS.LABELS_CREATE,
    PERMISSIONS.LABELS_READ,
    PERMISSIONS.LABELS_UPDATE,
    PERMISSIONS.LABELS_DELETE,
    PERMISSIONS.CHECKLISTS_CREATE,
    PERMISSIONS.CHECKLISTS_READ,
    PERMISSIONS.CHECKLISTS_UPDATE,
    PERMISSIONS.CHECKLISTS_DELETE,
    PERMISSIONS.ATTACHMENTS_CREATE,
    PERMISSIONS.ATTACHMENTS_READ,
    PERMISSIONS.ATTACHMENTS_DELETE,
  ],

  // Workspace Moderator - Moderate content
  [ROLES.WORKSPACE_MODERATOR]: [
    PERMISSIONS.WORKSPACES_READ,
    PERMISSIONS.BOARDS_CREATE,
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.BOARDS_UPDATE,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.LISTS_DELETE,
    PERMISSIONS.LISTS_ARCHIVE,
    PERMISSIONS.CARDS_CREATE,
    PERMISSIONS.CARDS_READ,
    PERMISSIONS.CARDS_UPDATE,
    PERMISSIONS.CARDS_DELETE,
    PERMISSIONS.CARDS_ASSIGN,
    PERMISSIONS.CARDS_MOVE,
    PERMISSIONS.CARDS_ARCHIVE,
    PERMISSIONS.COMMENTS_CREATE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_UPDATE,
    PERMISSIONS.COMMENTS_DELETE,
    PERMISSIONS.COMMENTS_MODERATE,
    PERMISSIONS.LABELS_CREATE,
    PERMISSIONS.LABELS_READ,
    PERMISSIONS.LABELS_UPDATE,
    PERMISSIONS.LABELS_DELETE,
    PERMISSIONS.CHECKLISTS_CREATE,
    PERMISSIONS.CHECKLISTS_READ,
    PERMISSIONS.CHECKLISTS_UPDATE,
    PERMISSIONS.CHECKLISTS_DELETE,
    PERMISSIONS.ATTACHMENTS_CREATE,
    PERMISSIONS.ATTACHMENTS_READ,
    PERMISSIONS.ATTACHMENTS_DELETE,
  ],

  // Workspace Member - Standard member
  [ROLES.WORKSPACE_MEMBER]: [
    PERMISSIONS.WORKSPACES_READ,
    PERMISSIONS.BOARDS_CREATE,
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.CARDS_CREATE,
    PERMISSIONS.CARDS_READ,
    PERMISSIONS.CARDS_UPDATE,
    PERMISSIONS.CARDS_ASSIGN,
    PERMISSIONS.CARDS_MOVE,
    PERMISSIONS.COMMENTS_CREATE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_UPDATE,
    PERMISSIONS.LABELS_READ,
    PERMISSIONS.CHECKLISTS_CREATE,
    PERMISSIONS.CHECKLISTS_READ,
    PERMISSIONS.CHECKLISTS_UPDATE,
    PERMISSIONS.ATTACHMENTS_CREATE,
    PERMISSIONS.ATTACHMENTS_READ,
  ],

  // Workspace Observer - View only
  [ROLES.WORKSPACE_OBSERVER]: [
    PERMISSIONS.WORKSPACES_READ,
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.CARDS_READ,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.LABELS_READ,
    PERMISSIONS.CHECKLISTS_READ,
    PERMISSIONS.ATTACHMENTS_READ,
  ],

  // Board Owner - Full board control
  [ROLES.BOARD_OWNER]: [
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.BOARDS_UPDATE,
    PERMISSIONS.BOARDS_DELETE,
    PERMISSIONS.BOARDS_MANAGE,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.MEMBERS_REMOVE,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_MANAGE,
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.LISTS_DELETE,
    PERMISSIONS.LISTS_ARCHIVE,
    PERMISSIONS.CARDS_CREATE,
    PERMISSIONS.CARDS_READ,
    PERMISSIONS.CARDS_UPDATE,
    PERMISSIONS.CARDS_DELETE,
    PERMISSIONS.CARDS_ASSIGN,
    PERMISSIONS.CARDS_MOVE,
    PERMISSIONS.CARDS_ARCHIVE,
    PERMISSIONS.COMMENTS_CREATE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_UPDATE,
    PERMISSIONS.COMMENTS_DELETE,
    PERMISSIONS.COMMENTS_MODERATE,
    PERMISSIONS.LABELS_CREATE,
    PERMISSIONS.LABELS_READ,
    PERMISSIONS.LABELS_UPDATE,
    PERMISSIONS.LABELS_DELETE,
    PERMISSIONS.CHECKLISTS_CREATE,
    PERMISSIONS.CHECKLISTS_READ,
    PERMISSIONS.CHECKLISTS_UPDATE,
    PERMISSIONS.CHECKLISTS_DELETE,
    PERMISSIONS.ATTACHMENTS_CREATE,
    PERMISSIONS.ATTACHMENTS_READ,
    PERMISSIONS.ATTACHMENTS_DELETE,
  ],

  // Board Admin - Manage board
  [ROLES.BOARD_ADMIN]: [
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.BOARDS_UPDATE,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.MEMBERS_MANAGE,
    PERMISSIONS.MEMBERS_REMOVE,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.LISTS_DELETE,
    PERMISSIONS.LISTS_ARCHIVE,
    PERMISSIONS.CARDS_CREATE,
    PERMISSIONS.CARDS_READ,
    PERMISSIONS.CARDS_UPDATE,
    PERMISSIONS.CARDS_DELETE,
    PERMISSIONS.CARDS_ASSIGN,
    PERMISSIONS.CARDS_MOVE,
    PERMISSIONS.CARDS_ARCHIVE,
    PERMISSIONS.COMMENTS_CREATE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_UPDATE,
    PERMISSIONS.COMMENTS_DELETE,
    PERMISSIONS.LABELS_CREATE,
    PERMISSIONS.LABELS_READ,
    PERMISSIONS.LABELS_UPDATE,
    PERMISSIONS.LABELS_DELETE,
    PERMISSIONS.CHECKLISTS_CREATE,
    PERMISSIONS.CHECKLISTS_READ,
    PERMISSIONS.CHECKLISTS_UPDATE,
    PERMISSIONS.CHECKLISTS_DELETE,
    PERMISSIONS.ATTACHMENTS_CREATE,
    PERMISSIONS.ATTACHMENTS_READ,
    PERMISSIONS.ATTACHMENTS_DELETE,
  ],

  // Board Member - Standard member
  [ROLES.BOARD_MEMBER]: [
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.CARDS_CREATE,
    PERMISSIONS.CARDS_READ,
    PERMISSIONS.CARDS_UPDATE,
    PERMISSIONS.CARDS_ASSIGN,
    PERMISSIONS.CARDS_MOVE,
    PERMISSIONS.COMMENTS_CREATE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_UPDATE,
    PERMISSIONS.LABELS_READ,
    PERMISSIONS.CHECKLISTS_CREATE,
    PERMISSIONS.CHECKLISTS_READ,
    PERMISSIONS.CHECKLISTS_UPDATE,
    PERMISSIONS.ATTACHMENTS_CREATE,
    PERMISSIONS.ATTACHMENTS_READ,
  ],

  // Board Observer - View only
  [ROLES.BOARD_OBSERVER]: [
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.CARDS_READ,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.LABELS_READ,
    PERMISSIONS.CHECKLISTS_READ,
    PERMISSIONS.ATTACHMENTS_READ,
  ],

  // Regular User
  [ROLES.USER]: [
    PERMISSIONS.WORKSPACES_CREATE,
    PERMISSIONS.WORKSPACES_READ,
    PERMISSIONS.BOARDS_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
  ],

  // Guest - Very limited
  [ROLES.GUEST]: [PERMISSIONS.BOARDS_READ, PERMISSIONS.CARDS_READ],
};

export class RBACProvider {
  private workspaceMemberRepo = AppDataSource.getRepository(WorkspaceMembers);
  private boardMemberRepo = AppDataSource.getRepository(BoardMembers);
  private boardRepo = AppDataSource.getRepository(Board);
  private workspaceRepo = AppDataSource.getRepository(Workspace);
  private listRepo = AppDataSource.getRepository(List);
  private cardRepo = AppDataSource.getRepository(Card);

  private getHigherRole(role1: Role | null, role2: Role | null): Role | null {
    if (!role1) return role2;
    if (!role2) return role1;
    return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2] ? role1 : role2;
  }

  private async getBoardInfo(boardId: string): Promise<CachedBoardInfo | null> {
    const cached = await rbacCache.getBoardInfo<CachedBoardInfo>(boardId);
    if (cached) return cached;

    const board = await this.boardRepo
      .createQueryBuilder('board')
      .leftJoin('board.workspace', 'workspace')
      .where('board.id = :boardId', { boardId })
      .select([
        'board.id',
        'board.visibility',
        'board.isClosed',
        'workspace.id',
      ])
      .getOne();

    if (!board) return null;

    const boardInfo: CachedBoardInfo = {
      id: board.id,
      visibility: board.visibility as BoardVisibility,
      isClosed: board.isClosed,
      workspaceId: board.workspace.id,
    };

    await rbacCache.setBoardInfo(boardId, boardInfo);
    return boardInfo;
  }

  async getWorkspaceMembership(
    userId: string,
    workspaceId: string
  ): Promise<{ role: Role; member: WorkspaceMembers } | null> {
    const cached = await rbacCache.getWorkspaceMembership<{
      role: Role;
      member: WorkspaceMembers;
    }>(userId, workspaceId);
    if (cached) return cached;

    const member = await this.workspaceMemberRepo
      .createQueryBuilder('wm')
      .leftJoin('wm.role', 'role')
      .where('wm.userId = :userId', { userId })
      .andWhere('wm.workspaceId = :workspaceId', { workspaceId })
      .select(['wm.id', 'wm.userId', 'wm.workspaceId', 'role.name'])
      .getOne();

    if (!member) return null;

    const result = { role: member.role.name as Role, member };

    await rbacCache.setWorkspaceMembership(userId, workspaceId, result);
    return result;
  }

  async getBoardMembership(
    userId: string,
    boardId: string
  ): Promise<{ role: Role; member: BoardMembers } | null> {
    const cached = await rbacCache.getBoardMembership<{
      role: Role;
      member: BoardMembers;
    }>(userId, boardId);
    if (cached) return cached;

    const member = await this.boardMemberRepo
      .createQueryBuilder('bm')
      .leftJoin('bm.role', 'role')
      .where('bm.userId = :userId', { userId })
      .andWhere('bm.boardId = :boardId', { boardId })
      .andWhere('bm.status = :active', { active: 'active' })
      .select(['bm.id', 'bm.userId', 'bm.boardId', 'role.name'])
      .getOne();

    if (!member) return null;

    const result = { role: member.role.name as Role, member };

    await rbacCache.setBoardMembership(userId, boardId, result);
    return result;
  }

  async getBoardIdFromList(listId: string): Promise<string | null> {
    const cached = await rbacCache.getListBoardId(listId);
    if (cached) return cached;

    const list = await this.listRepo
      .createQueryBuilder('list')
      .leftJoin('list.board', 'board')
      .where('list.id = :listId', { listId })
      .select(['list.id', 'board.id'])
      .getOne();

    if (!list?.board?.id) return null;

    await rbacCache.setListBoardId(listId, list.board.id);
    return list.board.id;
  }

  async getBoardIdFromCard(cardId: string): Promise<string | null> {
    const cached = await rbacCache.getCardBoardId(cardId);
    if (cached) return cached;

    const card = await this.cardRepo
      .createQueryBuilder('card')
      .leftJoin('card.board', 'board')
      .where('card.id = :cardId', { cardId })
      .select(['card.id', 'board.id'])
      .getOne();

    if (!card?.board?.id) return null;

    await rbacCache.setCardBoardId(cardId, card.board.id);
    return card.board.id;
  }

  async canViewWorkspace(
    userId: string | null,
    workspaceId: string
  ): Promise<AccessResult> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      select: ['id', 'visibility', 'isArchived'],
    });

    if (!workspace) {
      return { allowed: false, reason: 'Workspace not found' };
    }

    if (workspace.isArchived) {
      return { allowed: false, reason: 'Workspace is archived' };
    }

    if (workspace.visibility === 'public') {
      if (userId) {
        const membership = await this.getWorkspaceMembership(
          userId,
          workspaceId
        );
        return {
          allowed: true,
          userContext: membership
            ? {
                userId,
                workspaceRole: membership.role,
                isWorkspaceMember: true,
                isBoardMember: false,
              }
            : undefined,
        };
      }
      return { allowed: true };
    }

    if (!userId) {
      return { allowed: false, reason: 'Authentication required' };
    }

    const membership = await this.getWorkspaceMembership(userId, workspaceId);
    if (!membership) {
      return { allowed: false, reason: 'Not a workspace member' };
    }

    return {
      allowed: true,
      userContext: {
        userId,
        workspaceRole: membership.role,
        isWorkspaceMember: true,
        isBoardMember: false,
      },
    };
  }

  async canViewBoard(
    userId: string | null,
    boardId: string
  ): Promise<AccessResult> {
    const board = await this.getBoardInfo(boardId);

    if (!board) {
      return { allowed: false, reason: 'Board not found' };
    }

    let boardMembership: { role: Role; member: BoardMembers } | null = null;
    let workspaceMembership: { role: Role; member: WorkspaceMembers } | null =
      null;

    if (userId) {
      [boardMembership, workspaceMembership] = await Promise.all([
        this.getBoardMembership(userId, boardId),
        this.getWorkspaceMembership(userId, board.workspaceId),
      ]);
    }

    const adminRoles: Role[] = [
      ROLES.WORKSPACE_ADMIN,
      ROLES.WORKSPACE_MODERATOR,
    ];
    const isWorkspaceAdmin =
      !!workspaceMembership &&
      adminRoles.includes(workspaceMembership.role);

    if (board.isClosed) {
      if (!userId) {
        return { allowed: false, reason: 'Board is closed' };
      }

      if (!boardMembership && !isWorkspaceAdmin) {
        return { allowed: false, reason: 'Board is closed' };
      }
    }

    if (!userId) {
      return { allowed: false, reason: 'Authentication required' };
    }

    if (boardMembership) {
      return {
        allowed: true,
        userContext: {
          userId,
          workspaceRole: workspaceMembership?.role,
          boardRole: boardMembership.role,
          isWorkspaceMember: !!workspaceMembership,
          isBoardMember: true,
        },
      };
    }

    if (isWorkspaceAdmin && workspaceMembership) {
      return {
        allowed: true,
        userContext: {
          userId,
          workspaceRole: workspaceMembership.role,
          isWorkspaceMember: true,
          isBoardMember: false,
        },
      };
    }

    return { allowed: false, reason: 'Not authorized to view this board' };
  }

  async hasWorkspacePermission(
    userId: string,
    workspaceId: string,
    permission: Permission
  ): Promise<boolean> {
    const membership = await this.getWorkspaceMembership(userId, workspaceId);
    if (!membership) return false;

    const rolePermissions = ROLE_PERMISSIONS[membership.role] || [];
    console.log(
      'Checking permission:',
      permission,
      ". User's permissions:\n",
      rolePermissions
    );
    return rolePermissions.includes(permission);
  }

  async hasBoardPermission(
    userId: string,
    boardId: string,
    permission: Permission
  ): Promise<boolean> {
    // Use cached board info
    const board = await this.getBoardInfo(boardId);
    if (!board) return false;

    // Fetch both memberships in parallel
    const [boardMembership, workspaceMembership] = await Promise.all([
      this.getBoardMembership(userId, boardId),
      this.getWorkspaceMembership(userId, board.workspaceId),
    ]);

    const boardPermissions = boardMembership
      ? ROLE_PERMISSIONS[boardMembership.role] || []
      : [];

    const workspacePermissions = workspaceMembership
      ? ROLE_PERMISSIONS[workspaceMembership.role] || []
      : [];
    console.log(
      'Checking permission:',
      permission,
      ". User's board permissions:\n",
      boardPermissions,
      "\nUser's workspace permissions:\n",
      workspacePermissions
    );
    return (
      boardPermissions.includes(permission) ||
      workspacePermissions.includes(permission)
    );
  }

  async getEffectiveBoardRole(
    userId: string,
    boardId: string
  ): Promise<Role | null> {
    // Use cached board info
    const board = await this.getBoardInfo(boardId);
    if (!board) return null;

    const [boardMembership, workspaceMembership] = await Promise.all([
      this.getBoardMembership(userId, boardId),
      this.getWorkspaceMembership(userId, board.workspaceId),
    ]);

    const workspaceRole = workspaceMembership?.role || null;
    const boardRole = boardMembership?.role || null;

    if (workspaceMembership) {
      const adminRoles: Role[] = [
        ROLES.WORKSPACE_ADMIN,
        ROLES.WORKSPACE_MODERATOR,
      ];
      if (adminRoles.includes(workspaceMembership.role)) {
        return this.getHigherRole(workspaceRole, boardRole);
      }
    }

    if (boardMembership) {
      return this.getHigherRole(boardRole, workspaceRole);
    }

    if (board.visibility === 'workspace' && workspaceMembership) {
      return workspaceRole;
    }

    return null;
  }

  static roleHasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  static getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  static compareRoles(role1: Role, role2: Role): number {
    return ROLE_HIERARCHY[role1] - ROLE_HIERARCHY[role2];
  }

  async clearCache(userId?: string, resourceId?: string): Promise<void> {
    if (userId && resourceId) {
      await Promise.all([
        rbacCache.clearWorkspaceMembershipCache(userId, resourceId),
        rbacCache.clearBoardMembershipCache(userId, resourceId),
      ]);
    } else if (userId) {
      await rbacCache.clearUserCache(userId);
    } else {
      await rbacCache.clearAll();
    }
  }

  async clearBoardCache(boardId: string): Promise<void> {
    await rbacCache.clearBoardCache(boardId);
  }

  async clearWorkspaceCache(workspaceId: string): Promise<void> {
    await rbacCache.clearWorkspaceCache(workspaceId);
  }
}

export const rbacProvider = new RBACProvider();

export { ROLE_PERMISSIONS, ROLE_HIERARCHY };
