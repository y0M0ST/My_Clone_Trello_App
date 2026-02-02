import { AppDataSource } from '@/config/data-source';
import {
  BoardActivity,
  BoardActivityActionType,
  BoardActivityTargetType,
} from '@/common/entities/board-activity.entity';
import { User } from '@/common/entities/user.entity';
import { DeepPartial } from 'typeorm';

export class BoardActivityService {
  private repo = AppDataSource.getRepository(BoardActivity);

  async logActivity(params: {
    boardId: string;
    actorId?: string;
    actionType: BoardActivityActionType;
    targetType: BoardActivityTargetType;
    targetId?: string;
    metadata?: any;
  }) {
    const activity = this.repo.create({
      boardId: params.boardId,
      actorId: params.actorId ?? null,
      actor: params.actorId ? ({ id: params.actorId } as User) : undefined,
      actionType: params.actionType,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      metadata: params.metadata ?? undefined,
    } as DeepPartial<BoardActivity>);

    return this.repo.save(activity);
  }

  async getBoardActivity(boardId: string, page = 1, limit = 20) {
    const [items, total] = await this.repo.findAndCount({
      where: { boardId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['actor'],
      select: {
        id: true,
        boardId: true,
        actionType: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        actor: {
          id: true,
          name: true,
          email: true,
        },
      },
    });

    return {
      items,
      total,
      page,
      pageSize: limit,
    };
  }
}

export const boardActivityService = new BoardActivityService();
