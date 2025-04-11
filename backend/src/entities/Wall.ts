import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exhibition } from './Exhibition';
import { ArtworkPlacement } from './ArtworkPlacement';

@Entity('walls')
export class Wall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ default: 0 })
  displayOrder: number;

  @ManyToOne(() => Exhibition, exhibition => exhibition.walls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exhibitionId' })
  exhibition: Exhibition;

  @Column()
  exhibitionId: string;

  @OneToMany(() => ArtworkPlacement, placement => placement.wall, { cascade: true })
  placements: ArtworkPlacement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}