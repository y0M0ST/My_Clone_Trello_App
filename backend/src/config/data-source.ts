import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Board } from '@/common/entities/board.entity';
import { BoardMembers } from '@/common/entities/board-member.entity';
import { Card } from '@/common/entities/card.entity';
import { List } from '@/common/entities/list.entity';
import { Notification } from '@/common/entities/notification.entity';
import { Permission } from '@/common/entities/permission.entity';
import { RefreshToken } from '@/common/entities/refresh-token.entity';
import { Role } from '@/common/entities/role.entity';
import { RolePermission } from '@/common/entities/role-permission.entity';
import { User } from '@/common/entities/user.entity';
import { Workspace } from '@/common/entities/workspace.entity';
import { WorkspaceMembers } from '@/common/entities/workspace-member.entity';
import { BoardTemplate } from '@/common/entities/board-template.entity';
import { CardCover } from '@/common/entities/card-cover.entity';
import { Label } from '@/common/entities/label.entity';
import { Attachment } from '@/common/entities/attachment.entity';
import { Checklist } from '@/common/entities/checklist.entity';
import { CheckItem } from '@/common/entities/checkItem.entity';
import { Action } from '@/common/entities/action.entity';
import { BoardActivity } from '@/common/entities/board-activity.entity';
import { Comment } from '@/common/entities/comment.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'test_db',
  synchronize: true,
  logging: false,
  entities: [
    User,
    Workspace,
    WorkspaceMembers,
    Board,
    List,
    Card,
    Notification,
    RefreshToken,
    Role,
    RolePermission,
    Permission,
    BoardMembers,
    BoardTemplate,
    CardCover,
    Label,
    Attachment,
    Checklist,
    CheckItem,
    Action,
    BoardActivity,
    Comment,
  ],
  migrations: ['src/migration/**/*.ts'],
  subscribers: [],
  ssl:
    process.env.DB_HOST?.includes('render.com') ||
    process.env.DB_HOST?.includes('neon.tech')
      ? {
          rejectUnauthorized: false,
        }
      : false,
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 6000,
  },
  cache: {
    type: 'database',
    duration: 30000,
    tableName: 'query_result_cache',
  },
  maxQueryExecutionTime: 3000,
  poolSize: 10,
});
