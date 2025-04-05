import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Artwork } from './Artwork';
import { Comment } from './Comment';
import { Exhibition } from './Exhibition';

export enum UserRole {
  VISITOR = 'visitor',
  ARTIST = 'artist',
  CURATOR = 'curator',
  ADMIN = 'admin'
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50, unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.VISITOR
    })
    role: UserRole;

    @Column({ nullable: true })
    profileUrl: string;

    @Column('jsonb', { nullable: true })
    preferences: any;

    @OneToMany(() => Artwork, artwork => artwork.artist)
    artworks: Artwork[];

    @OneToMany(() => Comment, comment => comment.user)
    comments: Comment[];

    @OneToMany(() => Exhibition, exhibition => exhibition.curator)
    curatedExhibitions: Exhibition[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}