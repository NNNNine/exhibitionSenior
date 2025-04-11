import { DataSource } from 'typeorm';
import path from 'path';

// Entities
import { User } from '../entities/User';
import { Artwork } from '../entities/Artwork';
import { Exhibition } from '../entities/Exhibition';
import { ExhibitionItem } from '../entities/ExhibitionItem';
import { Comment } from '../entities/Comment';
import { Notification } from '../entities/Notification';
import { ArtworkPlacement } from '../entities/ArtworkPlacement';
import { Wall } from '../entities/Wall';

// Create a new DataSource instance
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DB_URL,
  port: parseInt(process.env.DB_PORT || '5432'),
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [User, Artwork, Exhibition, ExhibitionItem, Comment, Notification, ArtworkPlacement, Wall],
  migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
  subscribers: []
});