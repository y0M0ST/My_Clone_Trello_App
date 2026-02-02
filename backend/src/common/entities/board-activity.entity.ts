// src/common/entities/board-activity.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { DateTimeEntity } from './base/dateTimeEntity';
import { Board } from './board.entity';
import { User } from './user.entity';

export type BoardActivityTargetType =
  | 'BOARD'
  | 'LIST'
  | 'CARD'
  | 'MEMBER'
  | 'SETTINGS';

export type BoardActivityActionType =
  | 'BOARD_CREATED'
  | 'BOARD_SETTINGS_UPDATED'
  | 'BOARD_ARCHIVED'
  | 'BOARD_REOPENED'
  | 'LIST_CREATED'
  | 'LIST_RENAMED'
  | 'LIST_ARCHIVED'
  | 'LIST_MOVED'
  | 'CARD_CREATED'
  | 'CARD_UPDATED'
  | 'CARD_MOVED'
  | 'CARD_ARCHIVED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED';

@Entity('board_activities')
@Index('idx_board_activity_board', ['board'])
export class BoardActivity extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  boardId: string;

  @ManyToOne(() => Board, (board) => board.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorId' })
  actor?: User | null;

  @Column({ type: 'varchar', length: 50 })
  actionType: BoardActivityActionType;

  @Column({ type: 'varchar', length: 50 })
  targetType: BoardActivityTargetType;

  @Column({ type: 'uuid', nullable: true })
  targetId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
