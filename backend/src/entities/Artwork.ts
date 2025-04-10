import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Comment } from './Comment';
import { ExhibitionItem } from './ExhibitionItem';

export enum ArtworkStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

@Entity('artworks')
export class Artwork {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    title: string;

    @Column('text')
    description: string;

    @ManyToOne(() => User, user => user.artworks)
    @JoinColumn({ name: 'artistId' })
    artist: User;

    @Column()
    artistId: string;

    @Column()
    fileUrl: string;

    @Column()
    thumbnailUrl: string;

    @Column({ length: 50 })
    category: string;

    @Column('simple-array')
    tags: string[];

    @Column('timestamptz')
    creationDate: Date;
    
    @Column({
        type: 'enum',
        enum: ArtworkStatus,
        default: ArtworkStatus.PENDING
    })
    status: ArtworkStatus;

    @OneToMany(() => Comment, comment => comment.artwork)
    comments: Comment[];

    @OneToMany(() => ExhibitionItem, item => item.artwork)
    exhibitionItems: ExhibitionItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}