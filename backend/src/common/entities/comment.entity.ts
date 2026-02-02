// src/common/entities/comment.entity.ts
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DateTimeEntity } from './base/dateTimeEntity';
import { User } from './user.entity';
import { Card } from './card.entity';

@Entity('comments')
@Index('idx_comment_card_id', ['card'])
@Index('idx_comment_created_at', ['createdAt'])
export class Comment extends DateTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'text' })
  public content: string;

  @Column({ type: 'boolean', default: false })
  public isDeleted: boolean;

  @ManyToOne(() => Card, (card) => card.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cardId' })
  public card: Card;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authorId' })
  public author: User;
}
