import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Artwork } from './Artwork';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User, user => user.comments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Artwork, artwork => artwork.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artworkId' })
  artwork: Artwork;

  @Column()
  artworkId: string;

  @CreateDateColumn()
  timestamp: Date;
}