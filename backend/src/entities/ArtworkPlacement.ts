import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Wall } from './Wall';
import { Artwork } from './Artwork';

export enum PlacementPosition {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  CUSTOM = 'custom'  // For more flexible placement if needed
}

@Entity('artwork_placements')
export class ArtworkPlacement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wall, wall => wall.placements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallId' })
  wall: Wall;

  @Column()
  wallId: string;

  @ManyToOne(() => Artwork, artwork => artwork.placements)
  @JoinColumn({ name: 'artworkId' })
  artwork: Artwork;

  @Column()
  artworkId: string;

  @Column({
    type: 'enum',
    enum: PlacementPosition,
    default: PlacementPosition.CUSTOM
  })
  position: PlacementPosition;

  // For custom positioning
  @Column('jsonb', { nullable: true })
  coordinates: { x: number, y: number, z: number } | null;

  // For rotation
  @Column('jsonb', { nullable: true })
  rotation: { x: number, y: number, z: number } | null;

  // For scaling
  @Column('jsonb', { nullable: true })
  scale: { x: number, y: number, z: number } | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
