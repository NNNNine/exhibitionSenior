import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exhibition } from './Exhibition';
import { Artwork } from './Artwork';

@Entity('exhibition_items')
export class ExhibitionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exhibition, exhibition => exhibition.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exhibitionId' })
  exhibition: Exhibition;

  @Column()
  exhibitionId: string;

  @ManyToOne(() => Artwork, artwork => artwork.exhibitionItems)
  @JoinColumn({ name: 'artworkId' })
  artwork: Artwork;

  @Column()
  artworkId: string;

  @Column('jsonb')
  position: { x: number; y: number; z: number };

  @Column('jsonb')
  rotation: { x: number; y: number; z: number };

  @Column('jsonb')
  scale: { x: number; y: number; z: number };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}