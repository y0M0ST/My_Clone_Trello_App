import { AppDataSource } from '../../config/data-source';
import { In } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import {
  createWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
  UpdateMemberRoleDto,
  InviteMemberDto,
} from './workspace.dto';
import { Workspace } from '../../common/entities/workspace.entity';
import { WorkspaceMembers } from '../../common/entities/workspace-member.entity';
import { Role } from '../../common/entities/role.entity';
import { ROLES } from '../../common/constants';
import { validateEmail } from '@/common/utils/validateEmail';
import { redisClient } from '@/config/redisClient';
import { rbacProvider } from '@/common/utils/rbac';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { BoardMembers } from '../../common/entities/board-member.entity';
import { Board } from '../../common/entities/board.entity';

export class WorkspaceService {
  private workspaceRepository = AppDataSource.getRepository(Workspace);
  private userRepository = AppDataSource.getRepository(User);
  private workspaceMemberRepository =
    AppDataSource.getRepository(WorkspaceMembers);
  private roleRepository = AppDataSource.getRepository(Role);
  private boardMemberRepository = AppDataSource.getRepository(BoardMembers);
  private boardRepository = AppDataSource.getRepository(Board);
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async createWorkspace(userId: string, data: createWorkspaceDto) {
    const [user, adminRole] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.roleRepository.findOne({
        where: { name: ROLES.WORKSPACE_ADMIN },
      }),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    if (!adminRole) {
      throw new Error('Workspace admin role not found');
    }

    const newWorkspace = this.workspaceRepository.create({
      title: data.title,
      description: data.description,
      visibility: data.visibility || 'private',
      isArchived: false,
    });

    const savedWorkspace = await this.workspaceRepository.save(newWorkspace);

    const workspaceMember = this.workspaceMemberRepository.create({
      userId: user.id,
      workspaceId: savedWorkspace.id,
      roleId: adminRole.id,
    });
    await this.workspaceMemberRepository.save(workspaceMember);

    await rbacProvider.clearCache(userId, savedWorkspace.id);

    return savedWorkspace;
  }

  async getAllWorkspaces() {
    return await this.workspaceRepository.find({
      where: { isArchived: false },
    });
  }

  async getWorkspaceById(id: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id, isArchived: false },
    });

    if (!workspace) throw new Error('Workspace not found');
    return workspace;
  }

  async updateWorkspace(id: string, data: UpdateWorkspaceDto) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id, isArchived: false },
    });
    if (!workspace) throw new Error('Workspace not found');

    Object.assign(workspace, data);
    return await this.workspaceRepository.save(workspace);
  }

  async deleteWorkspace(id: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
    });
    if (!workspace) throw new Error('Workspace not found');

    workspace.isArchived = true;
    await this.workspaceRepository.save(workspace);
    return { message: 'Workspace archived successfully' };
  }

  async getWorkspacesByUserId(userId: string) {
    // 1. Get IDs from direct membership
    const memberWorkspaceIds = await this.workspaceMemberRepository
      .find({ where: { userId }, select: ['workspaceId'] })
      .then((r) => r.map((x) => x.workspaceId));

    // 2. Get IDs from board membership (indirect access)
    const boardWorkspaceIds = await this.boardMemberRepository
      .createQueryBuilder('bm')
      .leftJoin('bm.board', 'board')
      .where('bm.userId = :userId', { userId })
      .select('board.workspaceId', 'workspaceId')
      .distinct(true)
      .getRawMany()
      .then((r) => r.map((x) => x.workspaceId));

    // 3. Union IDs
    const allIds = [...new Set([...memberWorkspaceIds, ...boardWorkspaceIds])];

    if (allIds.length === 0) return [];

    // 4. Fetch Workspaces with details
    const workspaces = await this.workspaceRepository
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.workspaceMembers', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('members.role', 'memberRole')
      .where('w.id IN (:...ids)', { ids: allIds })
      .andWhere('w.isArchived = :isArchived', { isArchived: false })
      .select([
        'w.id', 'w.title', 'w.description', 'w.visibility', 'w.isArchived', 'w.createdAt', 'w.updatedAt',
        'members.id', 'members.createdAt', 'members.roleId', 'members.userId',
        'memberUser.id', 'memberUser.name', 'memberUser.email', 'memberUser.avatarUrl',
        'memberRole.id', 'memberRole.name'
      ])
      .getMany();

    // 5. Fetch user's role in these workspaces (if any)
    // 5. Fetch user's role in these workspaces (if any)
    const myMemberships = await this.workspaceMemberRepository.find({
      where: {
        userId,
        workspaceId: In(allIds)
      },
      relations: ['role']
    });
    // Fix: use proper FindOptions logic or just filter from fetched workspaces if loaded? 
    // Actually, 'members' relation in 'workspaces' contains ALL members. 
    // We can find 'myRole' from there.

    // Fetch boards
    const boards = await this.boardRepository
      .createQueryBuilder('board')
      .leftJoin('board.workspace', 'workspace')
      .where('board.workspaceId IN (:...ids)', { ids: allIds })
      .andWhere('board.isClosed = :isClosed', { isClosed: false })
      .select(['board.id', 'board.title', 'board.description', 'board.coverUrl', 'board.visibility', 'board.createdAt', 'workspace.id'])
      .getMany();

    const boardsMap = new Map<string, any[]>();
    boards.forEach((b) => {
      if (b.workspace) {
        const wsId = b.workspace.id;
        const current = boardsMap.get(wsId) || [];
        current.push(b);
        boardsMap.set(wsId, current);
      }
    });

    return workspaces.map(workspace => {
      // Find my membership in this workspace
      const myMember = workspace.workspaceMembers?.find(m => m.user?.id === userId);
      const myRole = myMember?.role || null; // Null if no direct membership (Guest)

      return {
        id: workspace.id,
        title: workspace.title,
        description: workspace.description,
        visibility: workspace.visibility,
        isArchived: workspace.isArchived,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        myRole: myRole,
        boards: boardsMap.get(workspace.id) || [],
        members: workspace.workspaceMembers?.map(member => ({
          id: member.id,
          userId: member.user?.id,
          username: member.user?.name,
          email: member.user?.email,
          avatarUrl: member.user?.avatarUrl,
          role: member.role,
          joinedAt: member.createdAt,
        })) || []
      };
    });
  }

  // Get archived workspaces by user ID
  async getArchivedWorkspacesByUserId(userId: string) {
    const workspaces = await this.workspaceMemberRepository
      .createQueryBuilder('wm')
      .leftJoinAndSelect('wm.workspace', 'workspace')
      .leftJoinAndSelect('wm.role', 'myRole')
      .leftJoin('workspace.workspaceMembers', 'members')
      .leftJoin('members.user', 'memberUser')
      .leftJoin('members.role', 'memberRole')
      .where('wm.userId = :userId', { userId })
      .andWhere('workspace.isArchived = :isArchived', { isArchived: true })
      .select([
        'wm.id',
        'workspace.id',
        'workspace.title',
        'workspace.description',
        'workspace.visibility',
        'workspace.isArchived',
        'workspace.createdAt',
        'workspace.updatedAt',
        'myRole.id',
        'myRole.name',
        'members.id',
        'members.createdAt',
        'memberUser.id',
        'memberUser.name',
        'memberUser.email',
        'memberUser.avatarUrl',
        'memberRole.id',
        'memberRole.name',
      ])
      .getMany();

    // Fetch boards riêng (bao gồm cả closed boards cho archived workspace)
    const workspaceIds = workspaces.map((wm) => wm.workspace.id);
    const boards =
      workspaceIds.length > 0
        ? await this.workspaceRepository
          .createQueryBuilder('w')
          .leftJoinAndSelect('w.boards', 'board')
          .where('w.id IN (:...workspaceIds)', { workspaceIds })
          .select([
            'w.id',
            'board.id',
            'board.title',
            'board.description',
            'board.coverUrl',
            'board.visibility',
            'board.isClosed',
            'board.createdAt',
          ])
          .getMany()
        : [];

    const boardsMap = new Map<string, any[]>();
    boards.forEach((w) => {
      boardsMap.set(w.id, w.boards || []);
    });

    return workspaces.map((wm) => ({
      id: wm.workspace.id,
      title: wm.workspace.title,
      description: wm.workspace.description,
      visibility: wm.workspace.visibility,
      isArchived: wm.workspace.isArchived,
      createdAt: wm.workspace.createdAt,
      updatedAt: wm.workspace.updatedAt,
      myRole: wm.role,
      boards: boardsMap.get(wm.workspace.id) || [],
      members:
        wm.workspace.workspaceMembers?.map((member) => ({
          id: member.id,
          userId: member.user?.id,
          username: member.user?.name,
          email: member.user?.email,
          avatarUrl: member.user?.avatarUrl,
          role: member.role,
          joinedAt: member.createdAt,
        })) || [],
    }));
  }

  // Archive workspace
  async archiveWorkspace(id: string, userId: string) {
    // Tìm workspace và member song song
    const [workspace, member] = await Promise.all([
      this.workspaceRepository.findOne({
        where: { id },
      }),
      this.workspaceMemberRepository.findOne({
        where: { workspaceId: id, userId },
        relations: ['role'],
      }),
    ]);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!member) {
      throw new Error('You are not a member of this workspace');
    }

    // Check if user has admin or moderator role
    if (
      member.role.name !== ROLES.WORKSPACE_ADMIN &&
      member.role.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error(
        'Only workspace admin or moderator can archive workspace'
      );
    }

    workspace.isArchived = true;
    await this.workspaceRepository.save(workspace);

    return { message: 'Workspace archived successfully' };
  }

  // Reopen workspace
  async reopenWorkspace(id: string, userId: string) {
    // Tìm workspace và member song song
    const [workspace, member] = await Promise.all([
      this.workspaceRepository.findOne({
        where: { id },
      }),
      this.workspaceMemberRepository.findOne({
        where: { workspaceId: id, userId },
        relations: ['role'],
      }),
    ]);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!member) {
      throw new Error('You are not a member of this workspace');
    }

    // Check if user has admin or moderator role
    if (
      member.role.name !== ROLES.WORKSPACE_ADMIN &&
      member.role.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error('Only workspace admin or moderator can reopen workspace');
    }

    workspace.isArchived = false;
    await this.workspaceRepository.save(workspace);

    return { message: 'Workspace reopened successfully' };
  }

  // Add member to workspace
  async addMember(
    workspaceId: string,
    data: AddMemberDto,
    currentUserId: string
  ) {
    // Check workspace, current user, new user, existing member và role song song
    const [workspace, currentMember, user, existingMember, role] =
      await Promise.all([
        this.workspaceRepository.findOne({
          where: { id: workspaceId, isArchived: false },
        }),
        this.workspaceMemberRepository.findOne({
          where: { workspaceId, userId: currentUserId },
          relations: ['role'],
        }),
        this.userRepository.findOne({
          where: { id: data.userId },
        }),
        this.workspaceMemberRepository.findOne({
          where: { workspaceId, userId: data.userId },
        }),
        this.roleRepository.findOne({
          where: { id: data.roleId },
        }),
      ]);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!currentMember) {
      throw new Error('You are not a member of this workspace');
    }

    if (
      currentMember.role.name !== ROLES.WORKSPACE_ADMIN &&
      currentMember.role.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error('Only workspace admin or moderator can add members');
    }

    if (!user) {
      throw new Error('User not found');
    }

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }

    if (!role) {
      throw new Error('Role not found');
    }

    // Create new member
    const newMember = this.workspaceMemberRepository.create({
      workspaceId,
      userId: data.userId,
      roleId: data.roleId,
    });

    await this.workspaceMemberRepository.save(newMember);

    // Invalidate RBAC cache for the new member
    await rbacProvider.clearCache(data.userId, workspaceId);

    // OPTIMIZATION: Select chỉ fields cần thiết, loại bỏ password
    const savedMember = await this.workspaceMemberRepository
      .createQueryBuilder('wm')
      .leftJoinAndSelect('wm.user', 'user')
      .leftJoinAndSelect('wm.role', 'role')
      .leftJoinAndSelect('wm.workspace', 'workspace')
      .where('wm.id = :id', { id: newMember.id })
      .select([
        'wm.id',
        'wm.createdAt',
        'user.id',
        'user.name',
        'user.email',
        'user.avatarUrl',
        'role.id',
        'role.name',
        'workspace.id',
        'workspace.title',
      ])
      .getOne();

    return {
      message: 'Member added successfully',
      member: savedMember,
    };
  }

  // Update member role
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    data: UpdateMemberRoleDto,
    currentUserId: string
  ) {
    // Check workspace, current member, member to update và new role song song
    const [workspace, currentMember, member, newRole] = await Promise.all([
      this.workspaceRepository.findOne({
        where: { id: workspaceId },
      }),
      this.workspaceMemberRepository.findOne({
        where: { workspaceId, userId: currentUserId },
        relations: ['role'],
      }),
      this.workspaceMemberRepository.findOne({
        where: { id: memberId, workspaceId },
        relations: ['user', 'role'],
      }),
      this.roleRepository.findOne({
        where: { name: data.roleName },
      }),
    ]);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!currentMember) {
      throw new Error('You are not a member of this workspace');
    }

    if (
      currentMember.role.name !== ROLES.WORKSPACE_ADMIN &&
      currentMember.role.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error(
        'Only workspace admin or moderator can update member roles'
      );
    }

    if (!member) {
      throw new Error('Member not found in this workspace');
    }

    if (!newRole) {
      throw new Error('Role not found');
    }

    // Phải là role trong workspace level
    if (
      newRole.name !== ROLES.WORKSPACE_ADMIN &&
      newRole.name !== ROLES.WORKSPACE_MEMBER &&
      newRole.name !== ROLES.WORKSPACE_OBSERVER &&
      newRole.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error('Invalid role for workspace member');
    }

    // Admin được hiểu là chủ sở hữu workspace, không thể thay đổi vai trò của họ
    if (member.role.name === ROLES.WORKSPACE_ADMIN) {
      throw new Error('Cannot change role of workspace admin');
    }

    if (member.roleId === newRole.id) {
      throw new Error('Member already has this role');
    }

    // member.roleId = newId;
    // await repo.save(member);

    // Note: Chỗ này không dùng save được vì roleId là khóa ngoại, nên khi save  thì chỉ đổi id còn member.role vẫn là object cũ, cần phải reload
    await this.workspaceMemberRepository
      .createQueryBuilder()
      .update()
      .set({ roleId: newRole.id })
      .where('id = :memberId', { memberId })
      .execute();

    // Invalidate RBAC cache for the updated member
    await rbacProvider.clearCache(member.userId, workspaceId);

    // Select chỉ fields cần thiết cho updated member
    const updatedMember = await this.workspaceMemberRepository
      .createQueryBuilder('wm')
      .leftJoinAndSelect('wm.user', 'user')
      .leftJoinAndSelect('wm.role', 'role')
      .leftJoinAndSelect('wm.workspace', 'workspace')
      .where('wm.id = :memberId', { memberId })
      .select([
        'wm.id',
        'wm.roleId',
        'wm.createdAt',
        'wm.updatedAt',
        'user.id',
        'user.name',
        'user.email',
        'user.avatarUrl',
        'role.id',
        'role.name',
        'workspace.id',
        'workspace.title',
      ])
      .getOne();

    return {
      message: 'Member role updated successfully',
      member: updatedMember,
    };
  }

  // Get workspace members
  async getWorkspaceMembers(workspaceId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId, isArchived: false },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const members = await this.workspaceMemberRepository.find({
      where: { workspaceId },
      relations: ['user', 'role'],
    });

    return members;
  }

  // Remove member from workspace
  async removeMember(
    workspaceId: string,
    memberId: string,
    currentUserId: string
  ) {
    // Check workspace, current member và member to remove song song
    const [workspace, currentMember, member] = await Promise.all([
      this.workspaceRepository.findOne({
        where: { id: workspaceId, isArchived: false },
      }),
      this.workspaceMemberRepository.findOne({
        where: { workspaceId, userId: currentUserId },
        relations: ['role'],
      }),
      this.workspaceMemberRepository.findOne({
        where: { id: memberId, workspaceId },
      }),
    ]);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!currentMember) {
      throw new Error('You are not a member of this workspace');
    }

    if (
      currentMember.role.name !== ROLES.WORKSPACE_ADMIN &&
      currentMember.role.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error('Only workspace admin or moderator can remove members');
    }

    if (!member) {
      throw new Error('Member not found in this workspace');
    }

    // Cannot remove yourself if you're the last admin
    if (member.userId === currentUserId) {
      const adminCount = await this.workspaceMemberRepository.count({
        where: { workspaceId },
        relations: ['role'],
      });

      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin from workspace');
      }
    }

    // Store userId before removing (member object will be modified)
    const removedUserId = member.userId;

    await this.workspaceMemberRepository.remove(member);

    // Invalidate RBAC cache for the removed member
    await rbacProvider.clearCache(removedUserId, workspaceId);

    return { message: 'Member removed successfully' };
  }

  // Invite member by email
  async inviteMemberByEmail(
    workspaceId: string,
    data: InviteMemberDto,
    currentUserId: string
  ) {
    // Validate email format
    if (!validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Check workspace và current member song song
    const [workspace, currentMember] = await Promise.all([
      this.workspaceRepository.findOne({
        where: { id: workspaceId, isArchived: false },
      }),
      this.workspaceMemberRepository.findOne({
        where: { workspaceId, userId: currentUserId },
        relations: ['role'],
      }),
    ]);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!currentMember) {
      throw new Error('You are not a member of this workspace');
    }

    if (
      currentMember.role.name !== ROLES.WORKSPACE_ADMIN &&
      currentMember.role.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error('Only workspace admin or moderator can invite members');
    }

    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    // Check if role exists
    const role = await this.roleRepository.findOne({
      where: { name: data.roleName },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Validate role là workspace role
    if (
      role.name !== ROLES.WORKSPACE_ADMIN &&
      role.name !== ROLES.WORKSPACE_MEMBER &&
      role.name !== ROLES.WORKSPACE_OBSERVER &&
      role.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error('Invalid role for workspace member');
    }

    // Nếu user đã tồn tại
    if (user) {
      // Check if already a member
      const existingMember = await this.workspaceMemberRepository.findOne({
        where: { workspaceId, userId: user.id },
      });

      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }

      // Add directly as member
      const newMember = this.workspaceMemberRepository.create({
        workspaceId,
        userId: user.id,
        roleId: role.id,
      });

      await this.workspaceMemberRepository.save(newMember);

      // Send notification email
      await this.transporter.sendMail({
        from: `"Task Manager" <${process.env.SMTP_USER}>`,
        to: data.email,
        subject: `You've been added to ${workspace.title}`,
        html: `
          <h3>Welcome to ${workspace.title}!</h3>
          <p>You have been added to the workspace with role: <strong>${role.name.replace('workspace_', '')}</strong></p>
          <p>You can now access the workspace and start collaborating.</p>
          <p><a href="${process.env.FRONTEND_URL}/workspaces/${workspaceId}">Go to Workspace</a></p>
        `,
      });

      return {
        message: 'User added to workspace successfully',
        member: await this.workspaceMemberRepository.findOne({
          where: { id: newMember.id },
          relations: ['user', 'role', 'workspace'],
        }),
      };
    }

    // Nếu user chưa tồn tại, gửi invitation token
    const invitationToken = uuidv4();
    const ttl = 7 * 24 * 60 * 60; // 7 days

    // Store invitation data in Redis
    const invitationData = {
      workspaceId,
      email: data.email,
      roleId: role.id,
      roleName: role.name,
      invitedBy: currentUserId,
    };

    await redisClient.set(
      `workspace-invite:${invitationToken}`,
      JSON.stringify(invitationData),
      { EX: ttl }
    );

    // Send invitation email
    const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;

    await this.transporter.sendMail({
      from: `"Task Manager" <${process.env.SMTP_USER}>`,
      to: data.email,
      subject: `You've been invited to ${workspace.title}`,
      html: `
        <h3>You've been invited to join ${workspace.title}!</h3>
        <p>You have been invited to join the workspace with role: <strong>${role.name.replace('workspace_', '')}</strong></p>
        <p>Please register or login to accept this invitation.</p>
        <p><a href="${invitationLink}">Accept Invitation</a></p>
        <p>This invitation will expire in 7 days.</p>
      `,
    });

    return {
      message: 'Invitation sent successfully',
      invitation: {
        email: data.email,
        workspaceId,
        roleName: role.name,
      },
    };
  }

  // Update workspace visibility
  async updateVisibility(
    workspaceId: string,
    visibility: 'private' | 'public',
    currentUserId: string
  ) {
    // Check workspace and current member
    const [workspace, currentMember] = await Promise.all([
      this.workspaceRepository.findOne({
        where: { id: workspaceId, isArchived: false },
      }),
      this.workspaceMemberRepository.findOne({
        where: { workspaceId, userId: currentUserId },
        relations: ['role'],
      }),
    ]);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!currentMember) {
      throw new Error('You are not a member of this workspace');
    }

    // Only Owner (Admin) or Admin can change visibility
    if (
      currentMember.role.name !== ROLES.WORKSPACE_ADMIN &&
      currentMember.role.name !== ROLES.WORKSPACE_MODERATOR
    ) {
      throw new Error('Only workspace owner or admin can change visibility');
    }

    // Update visibility
    workspace.visibility = visibility;
    await this.workspaceRepository.save(workspace);

    return {
      message: 'Workspace visibility updated successfully',
      workspace: {
        id: workspace.id,
        title: workspace.title,
        visibility: workspace.visibility,
      },
    };
  }
}
