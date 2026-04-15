import { Brackets } from 'typeorm';
import { User } from '@/common/entities/user.entity';
import { Board } from '../../common/entities/board.entity';
import { Workspace } from '../../common/entities/workspace.entity';
import { AppDataSource } from '../../config/data-source';
import { CreateBoardDto, UpdateBoardDto } from './board.dto';
import { Role } from '@/common/entities/role.entity';
import { BoardMembers } from '@/common/entities/board-member.entity';
import { ROLES } from '@/common/constants/roles';
import { EmailService, formatMailSendError } from '../mail/mail.service';
import { rbacProvider } from '@/common/utils/rbac';
import crypto from 'crypto';
import { AddBoardMemberInput } from './board.schema';
import { Card } from '@/common/entities/card.entity';
import { Label } from '@/common/entities/label.entity';
import { List } from '@/common/entities/list.entity';
import { emitBoardChanged } from '@/realtime/boardSocket';

export class BoardService {
  private boardRepository = AppDataSource.getRepository(Board);
  private workspaceRepository = AppDataSource.getRepository(Workspace);
  private boardMemberRepository = AppDataSource.getRepository(BoardMembers);
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);
  private emailService = new EmailService();
  private cardRepository = AppDataSource.getRepository(Card);
  private labelRepository = AppDataSource.getRepository(Label);
  private listRepository = AppDataSource.getRepository(List);

  async createBoard(data: CreateBoardDto, creatorId?: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: data.workspaceId, isArchived: false },
    });

    if (!workspace) throw new Error('Workspace not found or archived');

    const board = this.boardRepository.create({
      title: data.title,
      description: data.description || null,
      coverUrl: data.coverUrl || null,
      visibility: data.visibility || 'private',
      isClosed: false,
      workspace,
    });

    const savedBoard = await this.boardRepository.save(board);

    // Seed default labels
    const DEFAULT_LABELS = [
      { name: 'Xanh lá', color: '#61bd4f' },
      { name: 'Vàng', color: '#f2d600' },
      { name: 'Cam', color: '#ff9f1a' },
      { name: 'Đỏ', color: '#eb5a46' },
      { name: 'Tím', color: '#c377e0' },
      { name: 'Xanh dương', color: '#0079bf' },
    ];

    const labels = DEFAULT_LABELS.map(l => this.labelRepository.create({
      ...l,
      boardId: savedBoard.id
    }));
    await this.labelRepository.save(labels);

    if (creatorId) {
      const ownerRole = await this.roleRepository.findOne({
        where: { name: ROLES.BOARD_OWNER },
      });

      if (ownerRole) {
        const boardMember = this.boardMemberRepository.create({
          userId: creatorId,
          boardId: savedBoard.id,
          roleId: ownerRole.id,
        });

        await this.boardMemberRepository.save(boardMember);

        await rbacProvider.clearCache(creatorId, savedBoard.id);
      } else {
        throw new Error('Owner role not found');
      }
    }

    return savedBoard;
  }

  async getBoards(workspaceId: string, userId?: string) {
    const qb = this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.workspace', 'workspace')
      .leftJoin('board.boardMembers', 'member', 'member.userId = :userId', { userId })
      .where('workspace.id = :workspaceId', { workspaceId })
      .andWhere('workspace.isArchived = :isArchived', { isArchived: false })
      .andWhere('board.isClosed = :isClosed', { isClosed: false });

    // Filter by visibility/membership if userId provided
    if (userId) {
      qb.andWhere(new Brackets((subQb) => {
        subQb.where('board.visibility = :public', { public: 'public' })
          .orWhere('board.visibility = :workspace', { workspace: 'workspace' })
          .orWhere('member.id IS NOT NULL');
      }));
    }

    qb.select([
      'board.id',
      'board.title',
      'board.description',
      'board.coverUrl',
      'board.visibility',
      'board.isClosed',
      'board.createdAt',
      'board.updatedAt',
      'workspace.id',
      'workspace.title',
    ]);

    return await qb.getMany();
  }

  async getBoardById(id: string) {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: [
        'workspace',
        'boardMembers',
        'boardMembers.user',
        'boardMembers.role',
        'labels',
        'lists',
        'lists.cards',
        'lists.cards.labels',
        'lists.cards.members',
        'lists.cards.attachments',
      ],
      select: {
        id: true,
        title: true,
        description: true,
        coverUrl: true,
        visibility: true,
        isClosed: true,
        inviteToken: true,
        commentPolicy: true,
        memberManagePolicy: true,
        createdAt: true,
        updatedAt: true,
        workspace: {
          id: true,
          title: true,
        },
        boardMembers: {
          id: true,
          roleId: true,
          status: true,
          user: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
          role: {
            id: true,
            name: true,
          },
        },
        labels: {
          id: true,
          name: true,
          color: true,
        },
        lists: {
          id: true,
          title: true,
          position: true,
          isArchived: true,
          cards: {
            id: true,
            title: true,
            position: true,
            coverUrl: true,
            description: true,
            isArchived: true,
            attachments: {
              id: true,
              name: true,
              url: true,
              mimeType: true,
              createdAt: true,
            },
          },
        },
      },
      order: {
        lists: {
          position: 'ASC',
        },
      },
    });

    if (!board) throw new Error('Board not found');

    // Filter out archived lists
    board.lists = board.lists.filter(list => !list.isArchived);

    const { inviteToken, ...boardWithoutSecret } = board;

    const transformedBoard = {
      ...boardWithoutSecret,
      hasInviteLink: Boolean(inviteToken),
      members: board.boardMembers.map((bm) => ({
        id: bm.user.id,
        name: bm.user.name,
        email: bm.user.email,
        avatarUrl: bm.user.avatarUrl,
        roleId: bm.roleId,
        roleName: bm.role.name,
        memberStatus: bm.status,
      })),
      lists: board.lists.map((list) => ({
        ...list,
        cards: list.cards
          ? list.cards
            .filter((c) => !c.isArchived)
            .sort((a: any, b: any) => a.position - b.position)
          : [],
      })),
    };
    return transformedBoard;
  }

  async updateBoard(id: string, data: UpdateBoardDto) {
    const board = await this.boardRepository.findOne({
      where: { id },
    });
    if (!board) throw new Error('Board not found');
    Object.assign(board, data);

    return await this.boardRepository.save(board);
  }

  async addMemberToBoard(
    boardId: string,
    data: AddBoardMemberInput,
    currentUserId: string
  ) {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (!user) throw new Error('User not found');
    const [board, currentMember, existingMember, role] = await Promise.all([
      this.boardRepository.findOne({ where: { id: boardId } }),
      this.boardMemberRepository.findOne({
        where: { boardId, userId: currentUserId },
        relations: ['role', 'user'],
      }),
      this.boardMemberRepository.findOne({
        where: { boardId, userId: user?.id },
      }),
      this.roleRepository.findOne({ where: { id: data.roleId } }),
    ]);

    if (!board) throw new Error('Board not found');
    if (!currentMember) throw new Error('You are not a member of this board');

    const currentRoleName = currentMember.role.name;

    if (!this.canCurrentUserManageMembers(board, currentRoleName)) {
      if (board.memberManagePolicy === 'admins_only') {
        throw new Error(
          'Only board owner or admin can manage members when memberManagePolicy=admins_only'
        );
      }
      throw new Error(
        'Only board owner, admin or member can manage members when memberManagePolicy=all_members'
      );
    }

    if (existingMember)
      throw new Error('User is already a member of this board');
    if (!role) throw new Error('Role not found');

    const boardRoles = [
      ROLES.BOARD_OWNER,
      ROLES.BOARD_ADMIN,
      ROLES.BOARD_MEMBER,
      ROLES.BOARD_OBSERVER,
    ];
    if (!boardRoles.includes(role.name as any)) {
      throw new Error('Invalid role for board member');
    }

    const newMember = this.boardMemberRepository.create({
      boardId,
      userId: user.id,
      roleId: role.id,
      status: 'pending', // Set status to pending
    });

    await this.boardMemberRepository.save(newMember);

    const savedMember = await this.boardMemberRepository.findOne({
      where: { id: newMember.id },
      relations: ['user', 'role', 'board'],
    });
    if (savedMember?.user) {
      delete savedMember.user.password;
    }

    const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(
      /\/$/,
      ''
    );
    const acceptLink = `${base}/invite/accept?boardId=${board.id}`;
    const declineLink = `${base}/invite/decline?boardId=${board.id}`;

    try {
      await this.emailService.sendBoardInvitationEmail({
        to: user.email,
        boardTitle: board.title,
        inviterName: currentMember.user.name,
        roleName: role.name,
        link: acceptLink,
        declineLink,
      });
    } catch (err) {
      await this.boardMemberRepository.remove(newMember);
      await rbacProvider.clearCache(user.id, boardId);
      console.error('[invite] sendBoardInvitationEmail failed:', err);
      const hint = formatMailSendError(err);
      throw new Error(
        `Không gửi được email mời. Thành viên chưa được thêm.${hint ? ` Chi tiết: ${hint}` : ''}`
      );
    }

    await rbacProvider.clearCache(user.id, boardId);
    emitBoardChanged(board.id, 'member_invited');

    return {
      message: 'Member added to board successfully',
      member: savedMember,
    };
  }

  async respondToInvitation(boardId: string, userId: string, status: 'active' | 'declined') {
    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
      relations: ['board'],
    });

    if (!member) throw new Error('Invitation not found');
    if (member.status !== 'pending') throw new Error('Invitation is not pending');

    if (status === 'declined') {
      await this.boardMemberRepository.remove(member);
      return { message: 'Invitation declined' };
    }

    member.status = 'active';
    await this.boardMemberRepository.save(member);
    await rbacProvider.clearCache(userId, boardId);

    return { message: 'Invitation accepted', member };
  }

  async createLinkShareBoard(boardId: string, currentUserId: string) {
    const [board, currentMember] = await Promise.all([
      this.boardRepository.findOne({ where: { id: boardId } }),
      this.boardMemberRepository.findOne({
        where: { boardId, userId: currentUserId },
        relations: ['role', 'user'],
      }),
    ]);
    if (!board) throw new Error('Board not found');
    if (!currentMember) throw new Error('You are not a member of this board');
    if (currentMember.role.name == ROLES.BOARD_OBSERVER)
      throw new Error(`You don't have permission to create link`);
    const inviteToken = crypto.randomBytes(16).toString('hex');
    await this.boardRepository.update(
      { id: boardId },
      {
        inviteToken: inviteToken,
      }
    );
    const appBase =
      process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.BACKEND_URL || '';
    const base = appBase.replace(/\/$/, '');
    const linkInvite = `${base}/boards/${boardId}?invite=${inviteToken}`;
    return {
      message: 'Invite link created successfully',
      link: linkInvite,
    };
  }

  async deleteLinkShareBoard(boardId: string, currentUserId: string) {
    const [board, currentMember] = await Promise.all([
      this.boardRepository.findOne({ where: { id: boardId } }),
      this.boardMemberRepository.findOne({
        where: { boardId, userId: currentUserId },
        relations: ['role', 'user'],
      }),
    ]);
    if (!board) throw new Error('Board not found');
    if (!currentMember) throw new Error('You are not a member of this board');
    if (currentMember.role.name == ROLES.BOARD_OBSERVER)
      throw new Error(`You don't have permission to delete link`);
    if (!board.inviteToken)
      throw new Error('Board does not have an invite link');
    await this.boardRepository.update({ id: boardId }, { inviteToken: null });
    return {
      message: 'Invite link deleted successfully',
    };
  }

  async JoinBoardByLink(
    boardId: string,
    currentUserId: string,
    inviteToken: string
  ) {
    const [board, currentMember] = await Promise.all([
      this.boardRepository.findOne({ where: { id: boardId } }),
      this.boardMemberRepository.findOne({
        where: { boardId, userId: currentUserId },
        relations: ['role', 'user'],
      }),
    ]);
    if (!board) throw new Error('Board not found');
    if (currentMember)
      throw new Error('You are already a member of this board');
    if (!board.inviteToken) {
      throw new Error('This board does not support invite by link');
    }
    if (board.inviteToken !== inviteToken)
      throw new Error('Invalid or expired invation link');
    const memberRole = await this.roleRepository.findOne({
      where: { name: ROLES.BOARD_MEMBER },
    });
    if (!memberRole) {
      throw new Error('Default board member role not found');
    }
    const newMember = this.boardMemberRepository.create({
      boardId,
      userId: currentUserId,
      roleId: memberRole.id,
    });
    await this.boardMemberRepository.save(newMember);

    await rbacProvider.clearCache(currentUserId, boardId);

    const savedMember = await this.boardMemberRepository.findOne({
      where: { id: newMember.id },
      relations: ['user', 'role', 'board'],
    });
    if (savedMember?.user) {
      delete savedMember.user.password;
    }

    return {
      message: 'You joined this board successfully',
      member: savedMember,
    };
  }

  private canCurrentUserManageMembers(board: Board, roleName: string): boolean {
    if (board.memberManagePolicy === 'admins_only') {
      return roleName === ROLES.BOARD_OWNER || roleName === ROLES.BOARD_ADMIN;
    }

    if (board.memberManagePolicy === 'all_members') {
      return (
        roleName === ROLES.BOARD_OWNER ||
        roleName === ROLES.BOARD_ADMIN ||
        roleName === ROLES.BOARD_MEMBER
      );
    }
    return roleName === ROLES.BOARD_OWNER || roleName === ROLES.BOARD_ADMIN;
  }

  async getBoardOwner(boardId: string) {
    const ownerRole = await this.roleRepository.findOne({
      where: { name: ROLES.BOARD_OWNER },
    });
    if (!ownerRole) throw new Error('Owner role not found');

    const boardMember = await this.boardMemberRepository.findOne({
      where: { boardId, roleId: ownerRole.id },
    });
    if (!boardMember) throw new Error('Board owner not found');
    return boardMember;
  }

  async transferOwnership(boardId: string, newOwnerId: string) {
    const [ownerRole, adminRole, memberRole] = await Promise.all([
      this.roleRepository.findOne({
        where: { name: ROLES.BOARD_OWNER },
      }),
      this.roleRepository.findOne({
        where: { name: ROLES.BOARD_ADMIN },
      }),
      this.roleRepository.findOne({
        where: { name: ROLES.BOARD_MEMBER },
      }),
    ]);

    if (!ownerRole) throw new Error('Owner role not found');
    const currentOwner = await this.boardMemberRepository.findOne({
      where: { boardId, roleId: ownerRole.id },
    });
    if (!currentOwner) throw new Error('Board owner not found');
    if (currentOwner.userId === newOwnerId) {
      return this.boardRepository.findOne({
        where: { id: boardId },
        relations: ['boardMembers'],
      });
    }

    const demotionRoleId = adminRole?.id ?? memberRole?.id;
    if (!demotionRoleId) {
      throw new Error('No role available to demote current owner');
    }
    const existingNewOwner = await this.boardMemberRepository.findOne({
      where: { boardId, userId: newOwnerId },
    });
    if (existingNewOwner) {
      existingNewOwner.roleId = ownerRole.id;
      await this.boardMemberRepository.save(existingNewOwner);

      currentOwner.roleId = demotionRoleId;
      await this.boardMemberRepository.save(currentOwner);
    } else {
      const previousOwnerId = currentOwner.userId;
      currentOwner.userId = newOwnerId;
      await this.boardMemberRepository.save(currentOwner);

      const demotedMember = this.boardMemberRepository.create({
        boardId,
        userId: previousOwnerId,
        roleId: demotionRoleId,
      });
      await this.boardMemberRepository.save(demotedMember);
    }
    return await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ['boardMembers'],
    });
  }

  async checkBoardAdmin(boardId: string, userId: string) {
    const boardMember = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
      relations: ['role'],
    });

    if (!boardMember) return false;
    const adminRoles = [ROLES.BOARD_OWNER, ROLES.BOARD_ADMIN];
    return adminRoles.includes(boardMember.role.name as any);
  }

  async updateBoardSettings(
    boardId: string,
    settings: {
      visibility?: 'private' | 'workspace' | 'public';
      coverUrl?: string;
      memberManagePolicy?: 'admins_only' | 'all_members';
      commentPolicy?: 'disabled' | 'members' | 'workspace' | 'anyone';
      workspaceMembersCanEditAndJoin?: boolean;
    }
  ) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) throw new Error('Board not found');

    const changedFields: Record<string, { old: any; new: any }> = {};

    if (
      settings.visibility !== undefined &&
      settings.visibility !== board.visibility
    ) {
      changedFields.visibility = {
        old: board.visibility,
        new: settings.visibility,
      };
      board.visibility = settings.visibility;
    }

    if (
      settings.coverUrl !== undefined &&
      settings.coverUrl !== board.coverUrl
    ) {
      changedFields.coverUrl = { old: board.coverUrl, new: settings.coverUrl };
      board.coverUrl = settings.coverUrl;
    }

    if (
      settings.memberManagePolicy !== undefined &&
      settings.memberManagePolicy !== board.memberManagePolicy
    ) {
      changedFields.memberManagePolicy = {
        old: board.memberManagePolicy,
        new: settings.memberManagePolicy,
      };
      board.memberManagePolicy = settings.memberManagePolicy;
    }

    if (
      settings.commentPolicy !== undefined &&
      settings.commentPolicy !== board.commentPolicy
    ) {
      changedFields.commentPolicy = {
        old: board.commentPolicy,
        new: settings.commentPolicy,
      };
      board.commentPolicy = settings.commentPolicy;
    }

    if (
      settings.workspaceMembersCanEditAndJoin !== undefined &&
      settings.workspaceMembersCanEditAndJoin !==
      board.workspaceMembersCanEditAndJoin
    ) {
      changedFields.workspaceMembersCanEditAndJoin = {
        old: board.workspaceMembersCanEditAndJoin,
        new: settings.workspaceMembersCanEditAndJoin,
      };
      board.workspaceMembersCanEditAndJoin =
        settings.workspaceMembersCanEditAndJoin;
    }

    if (Object.keys(changedFields).length === 0) {
      return { board, changedFields };
    }

    const saved = await this.boardRepository.save(board);
    return { board: saved, changedFields };
  }

  /**
   * Tổng hợp mục lưu trữ của user: bảng đã đóng, danh sách đã archive, thẻ đã archive
   * (workspace chưa archive; thành viên board active).
   */
  async getMyArchivedOverview(userId: string) {
    const closedBoardEntities = await this.boardRepository
      .createQueryBuilder('board')
      .innerJoin('board.boardMembers', 'bm')
      .innerJoinAndSelect('board.workspace', 'ws')
      .where('bm.userId = :userId', { userId })
      .andWhere('bm.status = :st', { st: 'active' })
      .andWhere('board.isClosed = :closed', { closed: true })
      .andWhere('ws.isArchived = :wsa', { wsa: false })
      .orderBy('board.updatedAt', 'DESC')
      .getMany();

    const closedBoards = closedBoardEntities.map((b) => ({
      id: b.id,
      title: b.title,
      workspaceId: b.workspace?.id ?? '',
      workspaceTitle: b.workspace?.title ?? '',
    }));

    const archivedListEntities = await this.listRepository
      .createQueryBuilder('list')
      .innerJoinAndSelect('list.board', 'board')
      .innerJoinAndSelect('board.workspace', 'ws')
      .innerJoin('board.boardMembers', 'bm')
      .where('bm.userId = :userId', { userId })
      .andWhere('bm.status = :st', { st: 'active' })
      .andWhere('list.isArchived = :la', { la: true })
      .andWhere('ws.isArchived = :wsa', { wsa: false })
      .orderBy('list.updatedAt', 'DESC')
      .take(100)
      .getMany();

    const archivedLists = archivedListEntities.map((list) => ({
      id: list.id,
      title: list.title,
      boardId: list.boardId,
      boardTitle: list.board?.title ?? '',
      boardIsClosed: list.board?.isClosed ?? false,
      workspaceTitle: list.board?.workspace?.title ?? '',
    }));

    const archivedCardEntities = await this.cardRepository
      .createQueryBuilder('card')
      .innerJoinAndSelect('card.list', 'list')
      .innerJoinAndSelect('list.board', 'board')
      .innerJoinAndSelect('board.workspace', 'ws')
      .innerJoin('board.boardMembers', 'bm')
      .where('bm.userId = :userId', { userId })
      .andWhere('bm.status = :st', { st: 'active' })
      .andWhere('card.isArchived = :ca', { ca: true })
      .andWhere('ws.isArchived = :wsa', { wsa: false })
      .orderBy('card.updatedAt', 'DESC')
      .take(100)
      .getMany();

    const archivedCards = archivedCardEntities.map((card) => ({
      id: card.id,
      title: card.title,
      boardId: card.boardId,
      listId: card.listId,
      listTitle: card.list?.title ?? '',
      boardTitle: card.list?.board?.title ?? '',
      boardIsClosed: card.list?.board?.isClosed ?? false,
      workspaceTitle: card.list?.board?.workspace?.title ?? '',
    }));

    return { closedBoards, archivedLists, archivedCards };
  }

  async closeBoard(id: string) {
    const board = await this.boardRepository.findOne({
      where: { id },
    });
    if (!board) throw new Error('Board not found');
    board.isClosed = true;
    return await this.boardRepository.save(board);
  }

  async reopenBoard(id: string) {
    const board = await this.boardRepository.findOne({
      where: { id },
    });
    if (!board) throw new Error('Board not found');
    board.isClosed = false;
    return await this.boardRepository.save(board);
  }

  async deleteBoardPermanently(id: string) {
    const board = await this.boardRepository.findOne({
      where: { id },
    });
    if (!board) throw new Error('Board not found');
    // Labels historically had no ON DELETE CASCADE on FK — remove explicitly so delete always succeeds.
    await this.labelRepository.delete({ boardId: id });
    await this.boardRepository.remove(board);
    return { message: 'Board deleted permanently' };
  }

  async updateBoardCover(boardId: string, coverUrl: string) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) throw new Error('Board not found');
    board.coverUrl = coverUrl;
    return await this.boardRepository.save(board);
  }

  async getBoardMembers(boardId: string) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) throw new Error('Board not found');

    const boardMembers = await this.boardMemberRepository.find({
      where: { boardId },
      relations: ['user', 'role'],
    });

    return boardMembers.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      roleName: member.role.name,
    }));
  }

  async removeMemberFromBoard(
    boardId: string,
    userIdToRemove: string,
    currentUserId: string
  ) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) throw new Error('Board not found');

    const currentMember = await this.boardMemberRepository.findOne({
      where: { boardId, userId: currentUserId },
      relations: ['role'],
    });

    if (!currentMember) throw new Error('You are not a member of this board');

    const currentRoleName = currentMember.role.name;

    if (!this.canCurrentUserManageMembers(board, currentRoleName)) {
      if (board.memberManagePolicy === 'admins_only') {
        throw new Error(
          'Only board owner or admin can manage members when memberManagePolicy=admins_only'
        );
      }

      throw new Error(
        'Only board owner, admin or member can manage members when memberManagePolicy=all_members'
      );
    }

    const targetMember = await this.boardMemberRepository.findOne({
      where: { boardId, userId: userIdToRemove },
      relations: ['role'],
    });

    if (!targetMember) throw new Error('Member not found in this board');

    if (
      targetMember.role.name === ROLES.BOARD_OWNER &&
      targetMember.userId !== currentUserId
    ) {
      throw new Error('Cannot remove board owner');
    }

    await this.boardMemberRepository.delete({ id: targetMember.id });

    await rbacProvider.clearCache(userIdToRemove, boardId);

    return {
      message: 'Member removed successfully',
    };
  }

  async getCards(boardId: string, isArchived?: boolean) {
    const qb = this.cardRepository
      .createQueryBuilder('card')
      .innerJoinAndSelect('card.list', 'list')
      .innerJoin('list.board', 'board')
      .where('board.id = :boardId', { boardId });

    if (isArchived !== undefined) {
      qb.andWhere('card.isArchived = :isArchived', { isArchived });
    }

    qb.leftJoinAndSelect('card.labels', 'labels')
      .leftJoinAndSelect('card.members', 'members')
      .orderBy('card.position', 'ASC');

    return await qb.getMany();
  }

  async searchCardsInBoard(
    boardId: string,
    filters: {
      keyword?: string;
      labelIds?: string[];
      memberId?: string;
      status?: string;
      dueFrom?: string;
      dueTo?: string;
    }
  ) {
    const qb = this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.list', 'list')
      .innerJoin('list.board', 'board')
      .where('board.id = :boardId', { boardId })
      .andWhere('card.isArchived = false');

    if (filters.keyword) {
      const kw = `%${filters.keyword.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(card.title) LIKE :kw OR LOWER(card.description) LIKE :kw)',
        { kw }
      );
    }

    if (filters.status) {
      qb.andWhere('card.status = :status', { status: filters.status });
    }

    if (filters.dueFrom) {
      qb.andWhere('card.dueDate >= :dueFrom', { dueFrom: filters.dueFrom });
    }

    if (filters.dueTo) {
      qb.andWhere('card.dueDate <= :dueTo', { dueTo: filters.dueTo });
    }

    if (filters.labelIds && filters.labelIds.length > 0) {
      qb.innerJoin('card.labels', 'label').andWhere(
        'label.id IN (:...labelIds)',
        { labelIds: filters.labelIds }
      );
    } else {
      qb.leftJoinAndSelect('card.labels', 'label');
    }

    if (filters.memberId) {
      qb.innerJoin('card.members', 'member').andWhere('member.id = :memberId', {
        memberId: filters.memberId,
      });
    } else {
      qb.leftJoinAndSelect('card.members', 'member');
    }

    qb.leftJoinAndSelect('card.list', 'listSelect');

    const cards = await qb
      .select([
        'card.id',
        'card.title',
        'card.description',
        'card.status',
        'card.dueDate',
        'listSelect.id',
        'listSelect.title',
        'label.id',
        'label.name',
        'label.color',
        'member.id',
        'member.name',
        'member.email',
      ])
      .getMany();

    return cards;
  }
}
