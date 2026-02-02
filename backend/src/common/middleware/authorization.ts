import { NextFunction, Request, Response } from 'express';
import { rbacProvider, ResourceType, AccessResult } from '@/common/utils/rbac';
import { Permission, PERMISSIONS } from '@/common/constants/permissions';
import { Role, ROLES } from '@/common/constants/roles';

interface AuthorizationOptions {
  resourceType: ResourceType;
  resourceIdSource: 'params' | 'body' | 'query';
  resourceIdField: string;
  permission?: Permission;
  allowPublic?: boolean;
  errorMessage?: string;
}
const getBoardIdFromRequest = (req: Request): string | undefined => {
  return (
    (req.params as any).boardId || // /boards/:boardId/...
    (req.params as any).id || // /boards/:id/... (các route cũ)
    (req.query.boardId as string | undefined) ||
    (req.body.boardId as string | undefined)
  );
};

function getResourceId(
  req: Request,
  options: AuthorizationOptions
): string | null {
  const { resourceIdSource, resourceIdField } = options;

  switch (resourceIdSource) {
    case 'params':
      return req.params[resourceIdField] || null;
    case 'body':
      return req.body[resourceIdField] || null;
    case 'query':
      return (req.query[resourceIdField] as string) || null;
    default:
      return null;
  }
}

export function authorize(options: AuthorizationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || null;
      const resourceId = getResourceId(req, options);

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `${options.resourceIdField} is required`,
        });
      }

      let accessResult: AccessResult;

      // Check visibility dựa trên resource type
      switch (options.resourceType) {
        case 'workspace':
          accessResult = await rbacProvider.canViewWorkspace(
            userId,
            resourceId
          );
          break;

        case 'board':
        case 'list':
        case 'card':
          // List và Card đều thuộc về Board, nên check board
          accessResult = await rbacProvider.canViewBoard(userId, resourceId);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type',
          });
      }

      console.log('Authorization access result:', accessResult);
      if (!accessResult.allowed) {
        if (
          options.allowPublic &&
          accessResult.reason === 'Authentication required'
        ) {
          // Public access allowed, tiếp tục
        } else {
          return res.status(403).json({
            success: false,
            message:
              options.errorMessage || accessResult.reason || 'Access denied',
          });
        }
      }

      if (options.permission && userId) {
        let hasPermission = false;

        if (options.resourceType === 'workspace') {
          hasPermission = await rbacProvider.hasWorkspacePermission(
            userId,
            resourceId,
            options.permission
          );
        } else {
          hasPermission = await rbacProvider.hasBoardPermission(
            userId,
            resourceId,
            options.permission
          );
        }

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: options.errorMessage || 'Insufficient permissions',
          });
        }
      }

      if (accessResult.userContext) {
        req.userContext = accessResult.userContext;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
      });
    }
  };
}

export function checkWorkspaceAccess(
  idField: string = 'workspaceId',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  return authorize({
    resourceType: 'workspace',
    resourceIdSource: idSource,
    resourceIdField: idField,
  });
}

export function checkBoardAccess(
  idField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params',
  allowPublic: boolean = false
) {
  return authorize({
    resourceType: 'board',
    resourceIdSource: idSource,
    resourceIdField: idField,
    allowPublic,
  });
}

export function requireWorkspacePermission(
  permission: Permission,
  idField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  return authorize({
    resourceType: 'workspace',
    resourceIdSource: idSource,
    resourceIdField: idField,
    permission,
  });
}

export function requireBoardPermission(
  permission: Permission,
  idField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  return authorize({
    resourceType: 'board',
    resourceIdSource: idSource,
    resourceIdField: idField,
    permission,
  });
}

export function requireWorkspaceRoles(
  allowedRoles: Role[],
  idField: string = 'workspaceId',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      let workspaceId: string | null = null;
      switch (idSource) {
        case 'params':
          workspaceId = req.params[idField];
          break;
        case 'body':
          workspaceId = req.body[idField];
          break;
        case 'query':
          workspaceId = req.query[idField] as string;
          break;
      }

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: `${idField} is required`,
        });
      }

      const membership = await rbacProvider.getWorkspaceMembership(
        userId,
        workspaceId
      );
      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Not a workspace member',
        });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role privileges',
        });
      }

      req.userContext = {
        userId,
        workspaceRole: membership.role,
        isWorkspaceMember: true,
        isBoardMember: false,
      };

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role check failed',
      });
    }
  };
}

export function requireBoardRole(
  allowedRoles: Role[],
  idField: string = 'boardId',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      let boardId: string | null = null;
      switch (idSource) {
        case 'params':
          boardId = req.params[idField];
          break;
        case 'body':
          boardId = req.body[idField];
          break;
        case 'query':
          boardId = req.query[idField] as string;
          break;
      }

      if (!boardId) {
        return res.status(400).json({
          success: false,
          message: `${idField} is required`,
        });
      }

      // Lấy effective role (cao nhất giữa board và workspace)
      const effectiveRole = await rbacProvider.getEffectiveBoardRole(
        userId,
        boardId
      );

      if (!effectiveRole) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this board',
        });
      }

      if (!allowedRoles.includes(effectiveRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role privileges',
        });
      }

      const boardMembership = await rbacProvider.getBoardMembership(
        userId,
        boardId
      );

      req.userContext = {
        userId,
        boardRole: boardMembership?.role || effectiveRole,
        isWorkspaceMember: effectiveRole !== boardMembership?.role,
        isBoardMember: !!boardMembership,
      };

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role check failed',
      });
    }
  };
}

export const boardMember = requireBoardRole([
  ROLES.BOARD_OWNER,
  ROLES.BOARD_ADMIN,
  ROLES.BOARD_MEMBER,
  ROLES.WORKSPACE_ADMIN,
  ROLES.WORKSPACE_MODERATOR,
  ROLES.WORKSPACE_MEMBER,
]);

export const boardAdmin = requireBoardRole([
  ROLES.BOARD_OWNER,
  ROLES.BOARD_ADMIN,
  ROLES.WORKSPACE_ADMIN,
  ROLES.WORKSPACE_MODERATOR,
]);

export const boardOwner = requireBoardRole([
  ROLES.BOARD_OWNER,
  ROLES.WORKSPACE_ADMIN,
]);

export const workspaceAdmin = requireWorkspaceRoles(
  [ROLES.WORKSPACE_ADMIN, ROLES.ADMIN],
  'id'
);

export const workspaceMember = requireWorkspaceRoles(
  [
    ROLES.WORKSPACE_ADMIN,
    ROLES.WORKSPACE_MODERATOR,
    ROLES.WORKSPACE_MEMBER,
    ROLES.WORKSPACE_OBSERVER,
  ],
  'id'
);

export function requireWorkspacePermissions(
  permissions: Permission[],
  idField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      let workspaceId: string | null = null;
      switch (idSource) {
        case 'params':
          workspaceId = req.params[idField];
          break;
        case 'body':
          workspaceId = req.body[idField];
          break;
        case 'query':
          workspaceId = req.query[idField] as string;
          break;
      }

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: `${idField} is required`,
        });
      }

      const membership = await rbacProvider.getWorkspaceMembership(
        userId,
        workspaceId
      );
      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Not a workspace member',
        });
      }

      for (const permission of permissions) {
        const hasPermission = await rbacProvider.hasWorkspacePermission(
          userId,
          workspaceId,
          permission
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
          });
        }
      }

      req.userContext = {
        userId,
        workspaceRole: membership.role,
        isWorkspaceMember: true,
        isBoardMember: false,
      };

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
}

export function requireBoardPermissions(
  permissions: Permission | Permission[],
  idField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  // Normalize to array
  const permissionArray = Array.isArray(permissions)
    ? permissions
    : [permissions];

  const getBoardIdFromRequest = (req: Request): string | undefined => {
    return (
      (req.params as any).boardId || // /boards/:boardId/...
      (req.params as any).id || // /boards/:id/... (các route cũ)
      (req.query.boardId as string | undefined) ||
      (req.body.boardId as string | undefined)
    );
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      let boardId: string | null = null;
      switch (idSource) {
        case 'params':
          boardId = req.params[idField];
          break;
        case 'body':
          boardId = req.body[idField];
          break;
        case 'query':
          boardId = req.query[idField] as string;
          break;
      }

      if (!boardId) {
        return res.status(400).json({
          success: false,
          message: `${idField} is required`,
        });
      }

      for (const permission of permissionArray) {
        const hasPermission = await rbacProvider.hasBoardPermission(
          userId,
          boardId,
          permission
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
          });
        }
      }

      const effectiveRole = await rbacProvider.getEffectiveBoardRole(
        userId,
        boardId
      );
      const boardMembership = await rbacProvider.getBoardMembership(
        userId,
        boardId
      );

      req.userContext = {
        userId,
        boardRole: boardMembership?.role || effectiveRole || undefined,
        isWorkspaceMember: effectiveRole !== boardMembership?.role,
        isBoardMember: !!boardMembership,
      };

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
}

export function requireListPermissions(
  permissions: Permission | Permission[],
  listIdField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  const permissionArray = Array.isArray(permissions)
    ? permissions
    : [permissions];

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Lấy listId
      let listId: string | null = null;
      switch (idSource) {
        case 'params':
          listId = req.params[listIdField];
          break;
        case 'body':
          listId = req.body[listIdField];
          break;
        case 'query':
          listId = req.query[listIdField] as string;
          break;
      }

      if (!listId) {
        return res.status(400).json({
          success: false,
          message: `${listIdField} is required`,
        });
      }

      // Resolve boardId từ listId
      const boardId = await rbacProvider.getBoardIdFromList(listId);
      if (!boardId) {
        return res.status(404).json({
          success: false,
          message: 'List not found',
        });
      }

      for (const permission of permissionArray) {
        const hasPermission = await rbacProvider.hasBoardPermission(
          userId,
          boardId,
          permission
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
          });
        }
      }

      const effectiveRole = await rbacProvider.getEffectiveBoardRole(
        userId,
        boardId
      );
      const boardMembership = await rbacProvider.getBoardMembership(
        userId,
        boardId
      );

      req.userContext = {
        userId,
        boardRole: boardMembership?.role || effectiveRole || undefined,
        isWorkspaceMember: effectiveRole !== boardMembership?.role,
        isBoardMember: !!boardMembership,
      };

      req.resolvedBoardId = boardId;

      next();
    } catch (error) {
      console.error('List permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
}

export function requireCardPermissions(
  permissions: Permission | Permission[],
  cardIdField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  const permissionArray = Array.isArray(permissions)
    ? permissions
    : [permissions];

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      let cardId: string | null = null;
      switch (idSource) {
        case 'params':
          cardId = req.params[cardIdField];
          break;
        case 'body':
          cardId = req.body[cardIdField];
          break;
        case 'query':
          cardId = req.query[cardIdField] as string;
          break;
      }

      if (!cardId) {
        return res.status(400).json({
          success: false,
          message: `${cardIdField} is required`,
        });
      }

      const boardId = await rbacProvider.getBoardIdFromCard(cardId);
      if (!boardId) {
        return res.status(404).json({
          success: false,
          message: 'Card not found',
        });
      }

      for (const permission of permissionArray) {
        const hasPermission = await rbacProvider.hasBoardPermission(
          userId,
          boardId,
          permission
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
          });
        }
      }

      const effectiveRole = await rbacProvider.getEffectiveBoardRole(
        userId,
        boardId
      );
      const boardMembership = await rbacProvider.getBoardMembership(
        userId,
        boardId
      );

      req.userContext = {
        userId,
        boardRole: boardMembership?.role || effectiveRole || undefined,
        isWorkspaceMember: effectiveRole !== boardMembership?.role,
        isBoardMember: !!boardMembership,
      };

      req.resolvedBoardId = boardId;

      next();
    } catch (error) {
      console.error('Card permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
}

/**
 * Require specific roles to access a list (resolves boardId from listId)
 */
export function requireListRole(
  allowedRoles: Role[],
  listIdField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      let listId: string | null = null;
      switch (idSource) {
        case 'params':
          listId = req.params[listIdField];
          break;
        case 'body':
          listId = req.body[listIdField];
          break;
        case 'query':
          listId = req.query[listIdField] as string;
          break;
      }

      if (!listId) {
        return res.status(400).json({
          success: false,
          message: `${listIdField} is required`,
        });
      }

      // Resolve boardId from listId
      const boardId = await rbacProvider.getBoardIdFromList(listId);
      if (!boardId) {
        return res.status(404).json({
          success: false,
          message: 'List not found',
        });
      }

      // Get effective role for this board
      const effectiveRole = await rbacProvider.getEffectiveBoardRole(
        userId,
        boardId
      );

      if (!effectiveRole) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this list',
        });
      }

      if (!allowedRoles.includes(effectiveRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role privileges',
        });
      }

      const boardMembership = await rbacProvider.getBoardMembership(
        userId,
        boardId
      );

      req.userContext = {
        userId,
        boardRole: boardMembership?.role || effectiveRole,
        isWorkspaceMember: effectiveRole !== boardMembership?.role,
        isBoardMember: !!boardMembership,
      };

      req.resolvedBoardId = boardId;

      next();
    } catch (error) {
      console.error('List role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role check failed',
      });
    }
  };
}

/**
 * Require specific roles to access a card (resolves boardId from cardId)
 */
export function requireCardRole(
  allowedRoles: Role[],
  cardIdField: string = 'id',
  idSource: 'params' | 'body' | 'query' = 'params'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      let cardId: string | null = null;
      switch (idSource) {
        case 'params':
          cardId = req.params[cardIdField];
          break;
        case 'body':
          cardId = req.body[cardIdField];
          break;
        case 'query':
          cardId = req.query[cardIdField] as string;
          break;
      }

      if (!cardId) {
        return res.status(400).json({
          success: false,
          message: `${cardIdField} is required`,
        });
      }

      // Resolve boardId from cardId
      const boardId = await rbacProvider.getBoardIdFromCard(cardId);
      if (!boardId) {
        return res.status(404).json({
          success: false,
          message: 'Card not found',
        });
      }

      // Get effective role for this board
      const effectiveRole = await rbacProvider.getEffectiveBoardRole(
        userId,
        boardId
      );

      if (!effectiveRole) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this card',
        });
      }

      if (!allowedRoles.includes(effectiveRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role privileges',
        });
      }

      const boardMembership = await rbacProvider.getBoardMembership(
        userId,
        boardId
      );

      req.userContext = {
        userId,
        boardRole: boardMembership?.role || effectiveRole,
        isWorkspaceMember: effectiveRole !== boardMembership?.role,
        isBoardMember: !!boardMembership,
      };

      req.resolvedBoardId = boardId;

      next();
    } catch (error) {
      console.error('Card role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role check failed',
      });
    }
  };
}

export { AuthorizationOptions, PERMISSIONS, ROLES };
