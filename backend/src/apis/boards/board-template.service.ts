import { AppDataSource } from '@/config/data-source';
import { BoardTemplate } from '@/common/entities/board-template.entity';
import { Board } from '@/common/entities/board.entity';
import { Workspace } from '@/common/entities/workspace.entity';
import { List } from '@/common/entities/list.entity';

export class BoardTemplateService {
  private templateRepo = AppDataSource.getRepository(BoardTemplate);
  private boardRepo = AppDataSource.getRepository(Board);
  private workspaceRepo = AppDataSource.getRepository(Workspace);
  private listRepo = AppDataSource.getRepository(List);

  async createFromBoard(
    boardId: string,
    payload: {
      name?: string;
      description?: string;
      coverUrl?: string;
      workspaceId?: string | null;
    }
  ) {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new Error('Board not found');

    const template = this.templateRepo.create({
      name: payload.name || board.title,
      description: payload.description ?? board.description ?? null,
      coverUrl: payload.coverUrl ?? board.coverUrl ?? null,
      workspaceId: payload.workspaceId ?? null,
      sourceBoardId: board.id,
    });

    await this.templateRepo.save(template);
    return template;
  }

  async list(workspaceId?: string) {
    if (workspaceId) {
      return this.templateRepo.find({
        where: [{ workspaceId }, { workspaceId: null }],
        order: { createdAt: 'DESC' },
      });
    }

    return this.templateRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getOne(templateId: string) {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
      relations: ['sourceBoard', 'workspace'],
    });

    if (!template) throw new Error('Template not found');
    return template;
  }

  async apply(
    templateId: string,
    options: {
      workspaceId: string;
      title?: string;
      description?: string;
    }
  ) {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
      relations: ['sourceBoard', 'sourceBoard.lists'],
    });

    if (!template) throw new Error('Template not found');

    const workspace = await this.workspaceRepo.findOne({
      where: { id: options.workspaceId, isArchived: false },
    });

    if (!workspace) throw new Error('Workspace not found or archived');

    const newBoard = this.boardRepo.create({
      title: options.title || template.name,
      description: options.description ?? template.description ?? null,
      coverUrl: template.coverUrl ?? null,
      workspace,
      visibility: template.sourceBoard?.visibility ?? 'private',
      workspaceMembersCanEditAndJoin:
        template.sourceBoard?.workspaceMembersCanEditAndJoin ?? false,
      memberManagePolicy:
        template.sourceBoard?.memberManagePolicy ?? 'admins_only',
      commentPolicy: template.sourceBoard?.commentPolicy ?? 'members',
      isClosed: false,
    });

    const savedBoard = await this.boardRepo.save(newBoard);

    let listsToCreate: List[] = [];

    const sourceLists = template.sourceBoard?.lists || [];

    if (sourceLists.length > 0) {
      const sorted = [...sourceLists].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );

      listsToCreate = sorted.map((source, index) =>
        this.listRepo.create({
          title: source.title,
          position: index,
          isArchived: false,
          board: savedBoard,
        })
      );
    } else {
      const defaultTitles = ['To Do', 'Doing', 'Done'];

      listsToCreate = defaultTitles.map((title, index) =>
        this.listRepo.create({
          title,
          position: index,
          isArchived: false,
          board: savedBoard,
        })
      );
    }

    const savedLists = await this.listRepo.save(listsToCreate);

    return {
      board: savedBoard,
      lists: savedLists,
    };
  }
}
