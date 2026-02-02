// src/common/utils/commentPolicy.ts
import { AppDataSource } from '@/config/data-source';
import { Board } from '@/common/entities/board.entity';
import { BoardMembers } from '@/common/entities/board-member.entity';
import { WorkspaceMembers } from '@/common/entities/workspace-member.entity'; // nếu tên entity khác thì đổi lại cho đúng

export type CommentPolicyCheckResult = {
  allowed: boolean;
  reason?: string;
};

export async function checkCommentPermissionForUser(
  boardId: string,
  userId: string
): Promise<CommentPolicyCheckResult> {
  const boardRepo = AppDataSource.getRepository(Board);
  const boardMemberRepo = AppDataSource.getRepository(BoardMembers);
  const workspaceMemberRepo = AppDataSource.getRepository(WorkspaceMembers);

  const board = await boardRepo.findOne({
    where: { id: boardId },
    relations: ['workspace'],
  });

  if (!board) {
    return { allowed: false, reason: 'Board not found' };
  }

  const policy = board.commentPolicy ?? 'members';

  // 1. Tắt hẳn comment
  if (policy === 'disabled') {
    return {
      allowed: false,
      reason: 'Commenting is disabled on this board',
    };
  }

  // 2. Ai login cũng comment được
  if (policy === 'anyone') {
    return { allowed: true };
  }

  // 3. Kiểm tra user có phải member của board không
  const boardMember = await boardMemberRepo.findOne({
    where: { boardId, userId },
  });
  const isBoardMember = !!boardMember;

  if (policy === 'members') {
    if (!isBoardMember) {
      return {
        allowed: false,
        reason: 'You must be a member of this board to comment',
      };
    }
    return { allowed: true };
  }

  // 4. workspace → board member hoặc workspace member đều được
  if (policy === 'workspace') {
    if (isBoardMember) return { allowed: true };

    const workspaceId = board.workspace?.id;
    if (!workspaceId) {
      return {
        allowed: false,
        reason: 'Board has no workspace configured',
      };
    }

    const wsMember = await workspaceMemberRepo.findOne({
      where: { workspaceId, userId },
    });
    const isWorkspaceMember = !!wsMember;

    if (!isWorkspaceMember) {
      return {
        allowed: false,
        reason:
          'You must be a member of this board or its workspace to comment',
      };
    }

    return { allowed: true };
  }

  // Fallback
  return {
    allowed: false,
    reason: 'Invalid board comment policy configuration',
  };
}
