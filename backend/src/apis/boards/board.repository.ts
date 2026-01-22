import { AppDataSource } from '@/config/data-source';
import { Board } from '@/common/entities/board.entity';

export class BoardRepository {
  private boardRepository = AppDataSource.getRepository(Board);

  async findBoardById(
    boardId: string,
    includeLists = false
  ): Promise<Board | null> {
    const query = this.boardRepository
      .createQueryBuilder('board')
      .select(['board.id', 'board.title', 'board.isClosed'])
      .where('board.id = :boardId', { boardId });

    if (includeLists) {
      query
        .leftJoin('board.lists', 'lists')
        .addSelect([
          'lists.id',
          'lists.title',
          'lists.position',
          'lists.isArchived',
        ])
        .orderBy('lists.position', 'ASC');
    }

    return await query.getOne();
  }

  async isSameWorkspace(
    boardId: string,
    anotherBoardId: string
  ): Promise<boolean> {
    const result = await this.boardRepository
      .createQueryBuilder('board')
      .select('board.workspaceId', 'workspaceId')
      .where('board.id IN (:...boardIds)', {
        boardIds: [boardId, anotherBoardId],
      })
      .getRawMany();

    if (result.length !== 2) {
      throw new Error('One or both boards not found');
    }

    return result[0].workspaceId === result[1].workspaceId;
  }
}
