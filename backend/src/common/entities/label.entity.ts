import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DateTimeEntity } from './base/dateTimeEntity';
import { Board } from './board.entity';
import { Card } from './card.entity';

@Entity('labels')
@Index('idx_label_board_id', ['boardId'])
export class Label extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'uuid' })
  boardId: string;
  @ManyToOne(() => Board, (board) => board.labels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  public board: Board;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  color: string;

  @ManyToMany(() => Card, (card) => card.labels)
  public cards: Card[];
}
