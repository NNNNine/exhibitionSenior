import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';

export enum NotificationType {
  ARTWORK_UPLOAD = 'artwork_upload',
  ARTWORK_APPROVED = 'artwork_approved',
  ARTWORK_REJECTED = 'artwork_rejected',
  EXHIBITION_CREATED = 'exhibition_created',
  COMMENT_ADDED = 'comment_added'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.ARTWORK_UPLOAD
  })
  type: NotificationType;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  entityId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column()
  recipientId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ nullable: true })
  senderId: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}