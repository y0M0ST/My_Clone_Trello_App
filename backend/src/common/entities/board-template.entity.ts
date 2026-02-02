//src/common/entities/board-template.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { Workspace } from './workspace.entity';
import { Board } from './board.entity';

@Entity('board_templates')
export class BoardTemplate extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'text', nullable: true })
  public description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public coverUrl: string;

  // optional: template thuộc workspace nào (hoặc global nếu null)
  @Column({ type: 'uuid', nullable: true })
  public workspaceId?: string;

  @ManyToOne(() => Workspace, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  public workspace?: Workspace;

  // board gốc dùng làm template (lấy lists/cards từ đây)
  @Column({ type: 'uuid', name: 'sourceBoardId' })
  public sourceBoardId: string;

  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceBoardId' })
  public sourceBoard: Board;
}
