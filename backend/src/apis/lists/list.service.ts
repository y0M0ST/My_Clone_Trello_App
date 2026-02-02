import { AppDataSource } from '@/config/data-source';
import { ListRepository } from './list.repository';
import { BoardMembers } from '@/common/entities/board-member.entity';
import { List } from '@/common/entities/list.entity';
import { BoardRepository } from '../boards/board.repository';

export class ListService {
  private listRepository = new ListRepository();
  private boardRepository = new BoardRepository();
  private boardMemberRepository = AppDataSource.getRepository(BoardMembers);
  async getAllListsByBoard(boardId: string): Promise<List[]> {
    return await this.listRepository.getAllListsByBoard(boardId);
  }

  async createList(boardId: string, title: string, currentUserId: string) {
    const board = await this.boardRepository.findBoardById(boardId);
    if (!board) throw new Error('Board not found');
    if (board.isClosed) throw new Error('Board is closed');

    const currentMember = await this.boardMemberRepository
      .createQueryBuilder('bm')
      .leftJoin('bm.role', 'role')
      .where('bm.boardId = :boardId', { boardId })
      .andWhere('bm.userId = :userId', { userId: currentUserId })
      .select(['bm.id', 'role.name'])
      .getOne();

    if (!currentMember) throw new Error('You are not a member');

    if (
      !['board_owner', 'board_admin', 'board_member'].includes(
        currentMember.role.name
      )
    ) {
      throw new Error('Only board owner or admin or member can add list');
    }

    if (title.trim().length > 255) throw new Error('Title max length is 255');
    const maxPos = Number(
      await this.listRepository.getMaxPositionInBoard(boardId)
    );
    const position = maxPos + 1;

    const newList = await this.listRepository.createList({
      title: title.trim(),
      boardId,
      position,
    });
    return newList;
  }

  async editListTitle(listId: string, title: string) {
    const list = await this.listRepository.findListById(listId, false);
    if (!list) {
      throw new Error('List not found');
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error('Title can not be empty');
    }
    if (list.title === trimmedTitle) {
      throw new Error('New title is the same as current little');
    }
    const result = await this.listRepository.updateList(listId, {
      title: title,
    } as any);

    if (!result) {
      throw new Error('List not found');
    }
    return result;
  }

  async archiveList(listId: string) {
    const result = await this.listRepository.updateList(listId, {
      isArchived: true,
    } as any);

    if (!result) {
      throw new Error('List not found');
    }

    return result;
  }

  async unarchiveList(listId: string) {
    const result = await this.listRepository.updateList(listId, {
      isArchived: false,
    } as any);

    if (!result) {
      throw new Error('List not found');
    }

    return result;
  }

  async archiveAllCardsInList(listId: string) {
    const list = await this.listRepository.findListById(listId, false);
    if (!list) {
      throw new Error('List not found');
    }

    const cardIds = await this.listRepository.getCardIdsFromList(listId);

    if (cardIds.length === 0) {
      return { archivedCount: 0 };
    }

    await this.listRepository.bulkArchiveCards(cardIds);

    return { archivedCount: cardIds.length };
  }

  async moveListToBoard(listId: string, boardId: string, position: number) {
    const [list, board] = await Promise.all([
      this.listRepository.findListById(listId),
      this.boardRepository.findBoardById(boardId, true),
    ]);
    if (!list || list.isArchived) {
      throw new Error('List not found or is archived');
    }

    if (!board || board.isClosed) {
      throw new Error('Target board not found or is archived');
    }

    if (position < 1 || position > board.lists.length + 1) {
      throw new Error('Invalid position');
    }

    return await this.listRepository.moveListToBoard(listId, boardId, position);
  }

  async moveAllCardsToAnotherList(
    sourceListId: string,
    targetListId: string,
    targetBoardId?: string
  ) {
    const [sourceList, targetList, targetBoard, cardPosition] =
      await Promise.all([
        this.listRepository.findListById(sourceListId, false),
        this.listRepository.findListById(targetListId, false),
        targetBoardId
          ? this.boardRepository.findBoardById(targetBoardId)
          : null,
        this.listRepository.getMaxPositionInList(targetListId),
      ]);

    if (!sourceList || sourceList.isArchived)
      throw new Error('Source list not found or is archived');

    if (!targetList || targetList.isArchived)
      throw new Error('Target list not found or is archived');

    if (targetBoardId && !targetBoard)
      throw new Error('Target board not found');

    if (sourceListId === targetListId)
      throw new Error('Source and target lists are the same');

    // Lấy chỉ IDs thay vì full entities
    const cardIds = await this.listRepository.getCardIdsFromList(sourceListId);

    if (cardIds.length === 0) {
      return { movedCount: 0 };
    }

    // Bulk update trong 1 query
    await this.listRepository.updateCardsListAndBoard(
      cardIds,
      targetListId,
      targetBoardId,
      Math.floor(cardPosition + 1)
    );

    return { movedCount: cardIds.length };
  }

  async copyListToBoard(
    sourceListId: string,
    targetBoardId: string,
    title?: string,
    position?: number
  ) {
    // Parallel queries để tối ưu
    const [sourceList, targetBoard, sourceCards, maxPosition] =
      await Promise.all([
        this.listRepository.findListById(sourceListId, false),
        this.boardRepository.findBoardById(targetBoardId),
        this.listRepository.getCardsByList(sourceListId, false),
        this.listRepository.getMaxPositionInBoard(targetBoardId),
      ]);

    if (!sourceList) throw new Error('Source list not found');
    if (!targetBoard) throw new Error('Target board not found');
    if (position > maxPosition + 1) throw new Error('Invalid position');

    const newPosition = position ?? Math.floor(maxPosition + 1);
    const newTitle = title || `${sourceList.title} (Copy)`;

    // Sử dụng transaction với bulk insert
    const result = await this.listRepository.copyListWithCards(
      sourceList,
      targetBoard,
      newTitle,
      newPosition,
      sourceCards
    );

    return {
      list: result.list,
      copiedCardsCount: result.copiedCount,
    };
  }

  async reorderList(
    currentListId: string,
    prevListId: string | null,
    nextListId: string | null
  ) {
    if (nextListId === currentListId) {
      throw new Error('NextListId cannot be the same as CurrentListId');
    }
    if (prevListId === currentListId) {
      throw new Error('PrevListId cannot be the same as CurrentListId');
    }
    if (prevListId && nextListId && prevListId === nextListId) {
      throw new Error('PrevListId cannot be the same as NextListId');
    }

    // Fetch only existing lists
    const queries: Promise<List | null>[] = [
      this.listRepository.findListById(currentListId, false)
    ];
    if (prevListId) queries.push(this.listRepository.findListById(prevListId, false));
    if (nextListId) queries.push(this.listRepository.findListById(nextListId, false));

    const results = await Promise.all(queries);
    const currentList = results[0];
    const prevList = prevListId ? results[1] : null; // careful with index if logic changes
    const nextList = nextListId ? (prevListId ? results[2] : results[1]) : null;

    if (!currentList) {
      throw new Error('Current list not found');
    }
    if (prevList && prevList.boardId !== currentList.boardId) {
      throw new Error('Invalid prev list');
    }
    if (nextList && nextList.boardId !== currentList.boardId) {
      throw new Error('Invalid next list');
    }

    let position: number;

    if (prevList && nextList) {
      position = (prevList.position + nextList.position) / 2;
    } else if (prevList && !nextList) {
      // Move to end (no next list)
      position = prevList.position + 10000;
    } else if (!prevList && nextList) {
      // Move to start (no prev list)
      position = nextList.position / 2;
    } else {
      // Only list? or fallback
      position = 10000;
    }

    const result = await this.listRepository.updateList(currentListId, {
      position: position,
    } as any);

    if (!result) {
      throw new Error('List not found');
    }
    return result;
  }

  async getAllCardsInList(listId: string) {
    // Kiểm tra list tồn tại
    const list = await this.listRepository.findListById(listId, false);
    if (!list) {
      throw new Error('List not found');
    }
    // Lấy tất cả cards trong list
    const cards = await this.listRepository.getCardsByList(listId, false);
    return cards;
  }
}
