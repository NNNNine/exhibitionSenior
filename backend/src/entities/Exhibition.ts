import { Entity, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';
import { Wall } from './Wall';
import { ExhibitionItem } from './ExhibitionItem';

@Entity('exhibitions')
export class Exhibition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column('text')
  description: string;

  @ManyToOne(() => User, user => user.curatedExhibitions)
  @JoinColumn({ name: 'curatorId' })
  curator: User;

  @Column()
  curatorId: string;

  @Column('timestamptz')
  startDate: Date;

  @Column('timestamptz')
  endDate: Date;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => Wall, wall => wall.exhibition, { cascade: true })
  walls: Wall[];

  @OneToMany(() => ExhibitionItem, item => item.exhibition, { cascade: true })
  items: ExhibitionItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}