//src/common/entities/board.entity.ts
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { BoardMembers } from './board-member.entity';
import { List } from './list.entity';
import { Workspace } from './workspace.entity';
import { Label } from './label.entity';
import { BoardActivity } from './board-activity.entity';

@Entity('boards')
// ✅ PERFORMANCE INDEXES
@Index('idx_board_workspace_id', ['workspace'])
@Index('idx_board_closed', ['isClosed'])
@Index('idx_board_workspace_closed', ['workspace', 'isClosed'])
@Index('idx_board_visibility', ['visibility'])
export class Board extends DateTimeEntity {
  // id
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  // title
  @Column({ type: 'varchar', length: 255 })
  public title: string;

  // description
  @Column({ type: 'text', nullable: true })
  public description: string;

  // coverUrl
  @Column({ type: 'varchar', length: 255, nullable: true })
  public coverUrl: string;

  // isClosed
  @Column({ type: 'bool', nullable: false, default: false })
  public isClosed: boolean;

  // visibility nằm trong ['private', 'public', 'workspace']
  @Column({
    type: 'enum',
    enum: ['private', 'public', 'workspace'],
    nullable: false,
    default: 'private',
  })
  public visibility: string;

  @Column({ type: 'bool', default: false })
  public workspaceMembersCanEditAndJoin: boolean;

  @Column({
    type: 'enum',
    enum: ['admins_only', 'all_members'],
    default: 'admins_only',
  })
  public memberManagePolicy: 'admins_only' | 'all_members';

  @Column({
    type: 'enum',
    enum: ['disabled', 'members', 'workspace', 'anyone'],
    default: 'members',
  })
  public commentPolicy: 'disabled' | 'members' | 'workspace' | 'anyone';

  // workspace
  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  public workspace: Workspace;

  // lists
  @OneToMany(() => List, (list) => list.board)
  lists: List[];

  // boardMembers
  @OneToMany(() => BoardMembers, (boardMember) => boardMember.board)
  public boardMembers: BoardMembers[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  public inviteToken: string;

  // labels
  @OneToMany(() => Label, (label) => label.board)
  public labels: Label[];
  @OneToMany(() => BoardActivity, (activity) => activity.board)
  public activities: BoardActivity[];
}
