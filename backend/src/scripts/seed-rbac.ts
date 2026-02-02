import 'reflect-metadata';

import bcrypt from 'bcryptjs';

import { PERMISSIONS } from '@/common/constants/permissions';
import { ROLES, ROLE_DESCRIPTIONS } from '@/common/constants/roles';
import { Permission } from '@/common/entities/permission.entity';
import { Role } from '@/common/entities/role.entity';
import { RolePermission } from '@/common/entities/role-permission.entity';
import { User } from '@/common/entities/user.entity';
import { AppDataSource } from '@/config/data-source';
import { Comment } from '@/common/entities/comment.entity';

export class AuthorizationSeeder {
  async run(): Promise<void> {
    console.log('🌱 Starting RBAC seeding for Trello-like app...');
    await AppDataSource.initialize();

    try {
      const permissionRepository = AppDataSource.getRepository(Permission);
      const roleRepository = AppDataSource.getRepository(Role);
      const rolePermissionRepository =
        AppDataSource.getRepository(RolePermission);
      const userRepository = AppDataSource.getRepository(User);
      // const userRoleRepository = AppDataSource.getRepository(UserRole);

      // Define permissions for Trello-like app
      const permissionsData = [
        // Board permissions
        {
          name: PERMISSIONS.BOARDS_CREATE,
          description: 'Create new boards',
        },
        {
          name: PERMISSIONS.BOARDS_READ,
          description: 'View boards and their content',
        },
        {
          name: PERMISSIONS.BOARDS_UPDATE,
          description: 'Edit board details and settings',
        },
        {
          name: PERMISSIONS.BOARDS_DELETE,
          description: 'Delete boards',
        },
        {
          name: PERMISSIONS.BOARDS_MANAGE,
          description: 'Full board management including member management',
        },

        // List permissions
        {
          name: PERMISSIONS.LISTS_CREATE,
          description: 'Create new lists in boards',
        },
        {
          name: PERMISSIONS.LISTS_READ,
          description: 'View lists',
        },
        {
          name: PERMISSIONS.LISTS_UPDATE,
          description: 'Edit list details and reorder lists',
        },
        {
          name: PERMISSIONS.LISTS_DELETE,
          description: 'Delete lists',
        },
        {
          name: PERMISSIONS.LISTS_ARCHIVE,
          description: 'Archive/unarchive lists',
        },

        // Card permissions
        {
          name: PERMISSIONS.CARDS_CREATE,
          description: 'Create new cards',
        },
        {
          name: PERMISSIONS.CARDS_READ,
          description: 'View cards and their details',
        },
        {
          name: PERMISSIONS.CARDS_UPDATE,
          description: 'Edit card content, due dates, labels',
        },
        {
          name: PERMISSIONS.CARDS_DELETE,
          description: 'Delete cards',
        },
        {
          name: PERMISSIONS.CARDS_ASSIGN,
          description: 'Assign/unassign members to cards',
        },
        {
          name: PERMISSIONS.CARDS_MOVE,
          description: 'Move cards between lists and boards',
        },
        {
          name: PERMISSIONS.CARDS_ARCHIVE,
          description: 'Archive/unarchive cards',
        },

        // Comment permissions
        {
          name: PERMISSIONS.COMMENTS_CREATE,
          description: 'Add comments to cards',
        },
        {
          name: PERMISSIONS.COMMENTS_READ,
          description: 'View comments',
        },
        {
          name: PERMISSIONS.COMMENTS_UPDATE,
          description: 'Edit own comments',
        },
        {
          name: PERMISSIONS.COMMENTS_DELETE,
          description: 'Delete own comments',
        },
        {
          name: PERMISSIONS.COMMENTS_MODERATE,
          description: 'Delete any comments',
        },

        // Member permissions
        {
          name: PERMISSIONS.MEMBERS_INVITE,
          description: 'Invite new members to boards',
        },
        {
          name: PERMISSIONS.MEMBERS_REMOVE,
          description: 'Remove members from boards',
        },
        {
          name: PERMISSIONS.MEMBERS_READ,
          description: 'View board members',
        },
        {
          name: PERMISSIONS.MEMBERS_MANAGE,
          description: 'Manage member roles and permissions',
        },

        // Label permissions
        {
          name: PERMISSIONS.LABELS_CREATE,
          description: 'Create new labels',
        },
        {
          name: PERMISSIONS.LABELS_READ,
          description: 'View labels',
        },
        {
          name: PERMISSIONS.LABELS_UPDATE,
          description: 'Edit label names and colors',
        },
        {
          name: PERMISSIONS.LABELS_DELETE,
          description: 'Delete labels',
        },

        // Checklist permissions
        {
          name: PERMISSIONS.CHECKLISTS_CREATE,
          description: 'Create checklists in cards',
        },
        {
          name: PERMISSIONS.CHECKLISTS_READ,
          description: 'View checklists',
        },
        {
          name: PERMISSIONS.CHECKLISTS_UPDATE,
          description: 'Edit checklist items and mark as complete',
        },
        {
          name: PERMISSIONS.CHECKLISTS_DELETE,
          description: 'Delete checklists',
        },

        // Attachment permissions
        {
          name: PERMISSIONS.ATTACHMENTS_CREATE,
          description: 'Upload attachments to cards',
        },
        {
          name: PERMISSIONS.ATTACHMENTS_READ,
          description: 'View and download attachments',
        },
        {
          name: PERMISSIONS.ATTACHMENTS_DELETE,
          description: 'Delete attachments',
        },

        // Notification permissions
        {
          name: PERMISSIONS.NOTIFICATIONS_READ,
          description: 'View notifications',
        },
        {
          name: PERMISSIONS.NOTIFICATIONS_MANAGE,
          description: 'Manage notification settings',
        },

        // Workspace/Organization permissions
        {
          name: PERMISSIONS.WORKSPACES_CREATE,
          description: 'Create new workspaces',
        },
        {
          name: PERMISSIONS.WORKSPACES_READ,
          description: 'View workspace details',
        },
        {
          name: PERMISSIONS.WORKSPACES_UPDATE,
          description: 'Edit workspace settings',
        },
        {
          name: PERMISSIONS.WORKSPACES_DELETE,
          description: 'Delete workspaces',
        },
        {
          name: PERMISSIONS.WORKSPACES_MANAGE,
          description: 'Full workspace administration',
        },

        // User management permissions
        {
          name: PERMISSIONS.USERS_READ,
          description: 'View user profiles',
        },
        {
          name: PERMISSIONS.USERS_UPDATE,
          description: 'Edit own profile',
        },
        {
          name: PERMISSIONS.USERS_MANAGE,
          description: 'Manage all users (admin only)',
        },
        {
          name: PERMISSIONS.USERS_DELETE,
          description: 'Delete user accounts (admin only)',
        },

        // Report and analytics permissions
        {
          name: PERMISSIONS.REPORTS_READ,
          description: 'View reports and analytics',
        },
        {
          name: PERMISSIONS.REPORTS_EXPORT,
          description: 'Export reports and data',
        },

        // System administration
        {
          name: PERMISSIONS.SYSTEM_ADMIN,
          description: 'Full system administration access',
        },
        {
          name: PERMISSIONS.SYSTEM_BACKUP,
          description: 'Perform system backups',
        },
        {
          name: PERMISSIONS.SYSTEM_MAINTENANCE,
          description: 'Perform system maintenance',
        },
      ];

      // Create permissions
      const createdPermissions = new Map<string, Permission>();
      for (const permData of permissionsData) {
        let permission = await permissionRepository.findOne({
          where: { name: permData.name },
        });

        if (!permission) {
          permission = permissionRepository.create({
            name: permData.name,
            description: permData.description,
          });
          await permissionRepository.save(permission);
          console.log(`✅ Created permission: ${permData.name}`);
        } else {
          console.log(`⏭️  Permission already exists: ${permData.name}`);
        }

        createdPermissions.set(permData.name, permission);
      }

      // Define roles with their permissions
      const rolesData = [
        {
          name: ROLES.ADMIN,
          description: ROLE_DESCRIPTIONS[ROLES.ADMIN],
          permissions: permissionsData.map((p) => p.name),
        },
        {
          name: ROLES.WORKSPACE_ADMIN,
          description: ROLE_DESCRIPTIONS[ROLES.WORKSPACE_ADMIN],
          permissions: permissionsData
            .filter(
              (p) =>
                p.name.includes('workspaces:') ||
                p.name.includes('boards:') ||
                p.name.includes('lists:') ||
                p.name.includes('cards:') ||
                p.name.includes('comments:') ||
                p.name.includes('members:') ||
                p.name.includes('labels:') ||
                p.name.includes('checklists:') ||
                p.name.includes('attachments:') ||
                p.name.includes('notifications:') ||
                p.name.includes('reports:read') ||
                p.name.includes('users:read') ||
                p.name.includes('users:update')
            )
            .map((p) => p.name),
        },
        {
          name: ROLES.WORKSPACE_MODERATOR,
          description: ROLE_DESCRIPTIONS[ROLES.WORKSPACE_MODERATOR],
          permissions: permissionsData
            .filter(
              (p) =>
                p.name.includes('workspaces:') ||
                p.name.includes('boards:') ||
                p.name.includes('lists:') ||
                p.name.includes('cards:') ||
                p.name.includes('comments:') ||
                p.name.includes('members:') ||
                p.name.includes('labels:') ||
                p.name.includes('checklists:') ||
                p.name.includes('attachments:') ||
                p.name.includes('notifications:') ||
                p.name.includes('reports:read') ||
                p.name.includes('users:read') ||
                p.name.includes('users:update')
            )
            .map((p) => p.name),
        },
        {
          name: ROLES.WORKSPACE_MEMBER,
          description: ROLE_DESCRIPTIONS[ROLES.WORKSPACE_MEMBER],
          permissions: permissionsData
            .filter(
              (p) =>
                p.name.includes('workspaces:') || p.name.includes('boards:')
            )
            .map((p) => p.name),
        },
        {
          name: ROLES.WORKSPACE_OBSERVER,
          description: ROLE_DESCRIPTIONS[ROLES.WORKSPACE_OBSERVER],
          permissions: permissionsData
            .filter((p) => p.name.includes('workspaces:read'))
            .map((p) => p.name),
        },
        {
          name: ROLES.BOARD_OWNER,
          description: ROLE_DESCRIPTIONS[ROLES.BOARD_OWNER],
          permissions: permissionsData
            .filter(
              (p) =>
                p.name.includes('boards:') ||
                p.name.includes('lists:') ||
                p.name.includes('cards:') ||
                p.name.includes('comments:') ||
                p.name.includes('members:') ||
                p.name.includes('labels:') ||
                p.name.includes('checklists:') ||
                p.name.includes('attachments:') ||
                p.name.includes('notifications:') ||
                p.name.includes('users:read') ||
                p.name.includes('users:update')
            )
            .map((p) => p.name),
        },
        {
          name: ROLES.BOARD_ADMIN,
          description: ROLE_DESCRIPTIONS[ROLES.BOARD_ADMIN],
          permissions: permissionsData
            .filter(
              (p) =>
                p.name === PERMISSIONS.BOARDS_READ ||
                p.name === PERMISSIONS.BOARDS_UPDATE ||
                p.name.includes('lists:') ||
                p.name.includes('cards:') ||
                p.name.includes('comments:') ||
                p.name === PERMISSIONS.MEMBERS_INVITE ||
                p.name === PERMISSIONS.MEMBERS_REMOVE ||
                p.name === PERMISSIONS.MEMBERS_READ ||
                p.name.includes('labels:') ||
                p.name.includes('checklists:') ||
                p.name.includes('attachments:') ||
                p.name.includes('notifications:') ||
                p.name.includes('users:read') ||
                p.name.includes('users:update')
            )
            .map((p) => p.name),
        },
        {
          name: ROLES.BOARD_MEMBER,
          description: ROLE_DESCRIPTIONS[ROLES.BOARD_MEMBER],
          permissions: permissionsData
            .filter(
              (p) =>
                p.name === PERMISSIONS.BOARDS_READ ||
                p.name === PERMISSIONS.LISTS_READ ||
                p.name === PERMISSIONS.LISTS_CREATE ||
                p.name === PERMISSIONS.LISTS_UPDATE ||
                p.name.includes('cards:') ||
                p.name === PERMISSIONS.COMMENTS_CREATE ||
                p.name === PERMISSIONS.COMMENTS_READ ||
                p.name === PERMISSIONS.COMMENTS_UPDATE ||
                p.name === PERMISSIONS.COMMENTS_DELETE ||
                p.name === PERMISSIONS.MEMBERS_READ ||
                p.name === PERMISSIONS.LABELS_READ ||
                p.name === PERMISSIONS.LABELS_CREATE ||
                p.name.includes('checklists:') ||
                p.name.includes('attachments:') ||
                p.name.includes('notifications:') ||
                p.name.includes('users:read') ||
                p.name.includes('users:update')
            )
            .map((p) => p.name),
        },
        {
          name: ROLES.BOARD_OBSERVER,
          description: ROLE_DESCRIPTIONS[ROLES.BOARD_OBSERVER],
          permissions: permissionsData
            .filter(
              (p) =>
                p.name === PERMISSIONS.BOARDS_READ ||
                p.name === PERMISSIONS.LISTS_READ ||
                p.name === PERMISSIONS.CARDS_READ ||
                p.name === PERMISSIONS.COMMENTS_READ ||
                p.name === PERMISSIONS.MEMBERS_READ ||
                p.name === PERMISSIONS.LABELS_READ ||
                p.name === PERMISSIONS.CHECKLISTS_READ ||
                p.name === PERMISSIONS.ATTACHMENTS_READ ||
                p.name === PERMISSIONS.NOTIFICATIONS_READ ||
                p.name === PERMISSIONS.USERS_READ ||
                p.name === PERMISSIONS.USERS_UPDATE
            )
            .map((p) => p.name),
        },
      ];

      // Create roles and role-permission associations
      const createdRoles = new Map<string, Role>();
      for (const roleData of rolesData) {
        // Create or update role
        let role = await roleRepository.findOne({
          where: { name: roleData.name },
        });
        if (!role) {
          role = roleRepository.create({
            name: roleData.name,
            description: roleData.description,
          });
          await roleRepository.save(role);
          console.log(`✅ Created role: ${roleData.name}`);
        } else {
          console.log(`⏭️  Role already exists: ${roleData.name}`);
        }

        createdRoles.set(roleData.name, role);

        // Create role-permission associations
        let permissionCount = 0;
        for (const permName of roleData.permissions) {
          const permission = createdPermissions.get(permName);
          if (!permission) continue;

          // Check if association already exists
          const exists = await rolePermissionRepository.findOne({
            where: { roleId: role.id, permissionId: permission.id },
          });

          if (!exists) {
            await rolePermissionRepository.save(
              rolePermissionRepository.create({
                roleId: role.id,
                permissionId: permission.id,
              })
            );
            permissionCount++;
          }
        }
        console.log(
          `✅ Linked ${permissionCount} permissions to role: ${roleData.name}`
        );
      }

      // Create sample users with roles
      const usersData = [
        {
          email: 'admin@trello.com',
          name: 'System Administrator',
          password: 'admin123',
          bio: 'System administrator with full access',
          isActive: true,
          roleName: ROLES.ADMIN,
        },
        {
          email: 'workspace.admin@trello.com',
          name: 'Workspace Admin',
          password: 'workspace123',
          bio: 'Workspace administrator',
          isActive: true,
          roleName: ROLES.WORKSPACE_ADMIN,
        },
        {
          email: 'board.admin@trello.com',
          name: 'Board Admin',
          password: 'board123',
          bio: 'Board administrator',
          isActive: true,
          roleName: ROLES.BOARD_ADMIN,
        },
        {
          email: 'board.owner@trello.com',
          name: 'Board Owner',
          password: 'board123',
          bio: 'Board owner and manager',
          isActive: true,
          roleName: ROLES.BOARD_OWNER,
        },
        {
          email: 'member@trello.com',
          name: 'Team Member',
          password: 'member123',
          bio: 'Active team member',
          isActive: true,
          roleName: ROLES.BOARD_MEMBER,
        },
        {
          email: 'observer@trello.com',
          name: 'Observer',
          password: 'observer123',
          bio: 'Read-only observer',
          isActive: true,
          roleName: ROLES.BOARD_OBSERVER,
        },
      ];

      // Create users and user-role associations
      for (const userData of usersData) {
        // Create or update user
        let user = await userRepository.findOne({
          where: { email: userData.email },
        });
        if (!user) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          user = userRepository.create({
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            bio: userData.bio,
            isActive: userData.isActive,
          });
          await userRepository.save(user);
          console.log(`✅ Created user: ${userData.email}`);
        } else {
          console.log(`⏭️  User already exists: ${userData.email}`);
        }

        // Associate user with role
        const role = createdRoles.get(userData.roleName);
        if (!role) continue;
      }

      console.log('🎉 RBAC seeding completed successfully!');
      console.log(
        `📊 Created ${createdPermissions.size} permissions and ${createdRoles.size} roles`
      );
      console.log('👥 Created sample users for each role');
    } finally {
      await AppDataSource.destroy();
    }
  }

  async cleanup(): Promise<void> {
    await AppDataSource.initialize();

    try {
      console.log('🧹 Cleaning up RBAC data...');

      const rolePermRepo = AppDataSource.getRepository(RolePermission);
      const commentRepo = AppDataSource.getRepository(Comment); // nếu có bảng comment
      const userRepo = AppDataSource.getRepository(User);
      const roleRepo = AppDataSource.getRepository(Role);
      const permRepo = AppDataSource.getRepository(Permission);

      // 🧨 THỨ TỰ QUAN TRỌNG: XÓA CON TRƯỚC, CHA SAU

      // 1. Xóa mapping role-permission
      await rolePermRepo.createQueryBuilder().delete().where('1=1').execute();
      console.log('🗑️  Removed all role-permission associations');

      // 2. Nếu có bảng comments FK -> users, xóa comment trước
      await commentRepo.createQueryBuilder().delete().where('1=1').execute();
      console.log('🗑️  Removed all comments');

      // 3. Xóa users (nếu script muốn dọn luôn user seed)
      await userRepo.createQueryBuilder().delete().where('1=1').execute();
      console.log('🗑️  Removed all users');

      // 4. Xóa roles
      await roleRepo.createQueryBuilder().delete().where('1=1').execute();
      console.log('🗑️  Removed all roles');

      // 5. Xóa permissions
      await permRepo.createQueryBuilder().delete().where('1=1').execute();
      console.log('🗑️  Removed all permissions');

      console.log('✅ RBAC cleanup completed');
    } finally {
      await AppDataSource.destroy();
    }
  }
}

// Script execution entrypoint
async function main() {
  const seeder = new AuthorizationSeeder();

  if (process.argv.includes('--clean')) {
    await seeder.cleanup();
  } else {
    await seeder.run();
  }
}

// Only run directly if not imported
if (require.main === module) {
  main().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}

// Export for use in other scripts
export default AuthorizationSeeder;
