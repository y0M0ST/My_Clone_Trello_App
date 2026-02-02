import { AppDataSource } from '@/config/data-source';
import { Comment } from '@/common/entities/comment.entity';
import { Card } from '@/common/entities/card.entity';
import { User } from '@/common/entities/user.entity';
import { BoardMembers } from '@/common/entities/board-member.entity';
import { RolePermission } from '@/common/entities/role-permission.entity';
import { Permission } from '@/common/entities/permission.entity';
import { checkCommentPermissionForUser } from '@/common/utils/commentPolicy';
import { PERMISSIONS } from '@/common/constants/permissions';
import { In } from 'typeorm';

export class CommentService {
  private commentRepo = AppDataSource.getRepository(Comment);
  private cardRepo = AppDataSource.getRepository(Card);
  private userRepo = AppDataSource.getRepository(User);

  private boardMemberRepo = AppDataSource.getRepository(BoardMembers);
  private rolePermissionRepo = AppDataSource.getRepository(RolePermission);
  private permissionRepo = AppDataSource.getRepository(Permission);

  private async getBoardIdFromCard(cardId: string): Promise<string> {
    const card = await this.cardRepo.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board', 'list.board.workspace'],
    });

    if (!card) throw new Error('Card not found');
    return card.list.board.id;
  }

  private async isCommentModerator(boardId: string, userId: string) {
    // Lấy membership của user trong board
    const memberships = await this.boardMemberRepo.find({
      where: { boardId, userId },
    });

    if (!memberships.length) return false;

    const roleIds = memberships.map((m) => m.roleId);

    // Lấy tất cả permissions của các role đó
    const rolePerms = await this.rolePermissionRepo.find({
      where: { roleId: In(roleIds) },
      relations: ['permission'],
    });

    const permNames = rolePerms
      .map((rp) => rp.permission?.name)
      .filter(Boolean);

    return permNames.includes(PERMISSIONS.COMMENTS_MODERATE);
  }

  async createComment(cardId: string, userId: string, content: string) {
    const card = await this.cardRepo.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board', 'list.board.workspace'],
    });
    if (!card) throw new Error('Card not found');

    const boardId = card.list.board.id;

    const { allowed, reason } = await checkCommentPermissionForUser(
      boardId,
      userId
    );
    if (!allowed) {
      const err: any = new Error(reason || 'Forbidden');
      err.statusCode = 403;
      throw err;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const comment = this.commentRepo.create({
      content,
      card,
      user,
    } as any);

    return this.commentRepo.save(comment);
  }

  async getCommentsByCard(cardId: string) {
    const comments = await this.commentRepo.find({
      where: { card: { id: cardId } as any },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return comments.map((c) => ({
      id: c.id,
      content: (c as any).content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: c.user
        ? {
            id: c.user.id,
            name: c.user.name,
            email: c.user.email,
          }
        : null,
    }));
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: [
        'user',
        'card',
        'card.list',
        'card.list.board',
        'card.list.board.workspace',
      ],
    });

    if (!comment) throw new Error('Comment not found');

    const boardId = comment.card.list.board.id;

    const { allowed, reason } = await checkCommentPermissionForUser(
      boardId,
      userId
    );
    if (!allowed) {
      const err: any = new Error(reason || 'Forbidden');
      err.statusCode = 403;
      throw err;
    }

    const isModerator = await this.isCommentModerator(boardId, userId);
    const isOwner = (comment as any).userId
      ? (comment as any).userId === userId
      : comment.user?.id === userId;

    if (!isOwner && !isModerator) {
      const err: any = new Error('You are not allowed to edit this comment');
      err.statusCode = 403;
      throw err;
    }

    (comment as any).content = content ?? (comment as any).content;

    return this.commentRepo.save(comment);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: [
        'user',
        'card',
        'card.list',
        'card.list.board',
        'card.list.board.workspace',
      ],
    });

    if (!comment) throw new Error('Comment not found');

    const boardId = comment.card.list.board.id;

    const { allowed, reason } = await checkCommentPermissionForUser(
      boardId,
      userId
    );
    if (!allowed) {
      const err: any = new Error(reason || 'Forbidden');
      err.statusCode = 403;
      throw err;
    }

    const isModerator = await this.isCommentModerator(boardId, userId);
    const isOwner = (comment as any).userId
      ? (comment as any).userId === userId
      : comment.user?.id === userId;

    if (!isOwner && !isModerator) {
      const err: any = new Error('You are not allowed to delete this comment');
      err.statusCode = 403;
      throw err;
    }

    await this.commentRepo.remove(comment);
  }
}
