import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  public jti: string;

  @Column({ type: 'varchar', length: 255 })
  public userId: string;

  @Column({ type: 'text' })
  @Column({ type: 'varchar', length: 255, nullable: true }) //thêm nullable: true, cần anh chị em xem lại
  public hash: string;

  @Column({ type: 'timestamp' })
  public expiresAt: Date;

  @Column({ type: 'bool', default: false })
  public revoked: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public replacedByJti?: string;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  public userAgent?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  public ip?: string;
}
