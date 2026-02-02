import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DateTimeEntity } from './base/dateTimeEntity';
import { List } from './list.entity';
import { Board } from './board.entity';
import { User } from './user.entity';
import { CardCover } from './card-cover.entity';
import { Label } from './label.entity';
import { Attachment } from './attachment.entity';
import { Checklist } from './checklist.entity';
import { Action } from './action.entity';
import { Comment } from './comment.entity';

@Entity('cards')
@Index('idx_card_list_id', ['list'])
@Index('idx_card_board_id', ['board'])
@Index('idx_card_archived', ['isArchived'])
@Index('idx_card_list_archived', ['list', 'isArchived'])
@Index('idx_card_board_archived', ['board', 'isArchived'])
@Index('idx_card_position', ['list', 'position'])
@Index('idx_card_board_list', ['board', 'list'])
export class Card extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'float', default: 0 })
  position: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverUrl: string;

  @Column({ name: 'start', type: 'timestamp', nullable: true })
  start: Date;

  @Column({ name: 'due', type: 'timestamp', nullable: true })
  due: Date;

  // due reminder
  @Column({ type: 'timestamp', nullable: true })
  dueReminder: Date;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'uuid' })
  listId: string;
  @ManyToOne(() => List, (list) => list.cards)
  @JoinColumn({ name: 'listId' })
  list: List;

  @Column({ type: 'uuid' })
  boardId: string;
  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @ManyToMany(() => User, (user) => user.cards)
  @JoinTable({
    name: 'card_members',
    joinColumn: { name: 'cardId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  public members: User[];

  @Column({ type: 'uuid', nullable: true })
  public coverId: string;
  @ManyToOne(() => CardCover, (cardCover) => cardCover.cards, {
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: 'coverId' })
  public cover: CardCover;

  @ManyToMany(() => Label, (label) => label.cards)
  @JoinTable({
    name: 'card_labels',
    joinColumn: { name: 'cardId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'labelId', referencedColumnName: 'id' },
  })
  public labels: Label[];

  @OneToMany(() => Attachment, (attachment) => attachment.card)
  public attachments: Attachment[];

  @OneToMany(() => Checklist, (checklist) => checklist.card)
  public checklists: Checklist[];

  @OneToMany(() => Action, (action) => action.card)
  public actions: Action[];

  @OneToMany(() => Comment, (comment) => comment.card)
  public comments: Comment[];
}
