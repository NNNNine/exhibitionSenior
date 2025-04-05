import { User } from './user.types';
import { Artwork, ExhibitionItem } from './artwork.types';

/**
 * Exhibition interface - represents an exhibition in the system
 */
export interface Exhibition {
  id: string;
  title: string;
  description: string;
  curatorId: string;
  curator?: User;
  startDate: string;
  endDate: string;
  isActive: boolean;
  items?: ExhibitionItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Exhibition creation data interface
 */
export interface ExhibitionCreateData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

/**
 * Exhibition update data interface
 */
export interface ExhibitionUpdateData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

/**
 * Exhibition with artworks and positions
 */
export interface ExhibitionWithItems extends Exhibition {
  items: (ExhibitionItem & { artwork: Artwork })[];
}

/**
 * Re-export ExhibitionItem for convenience
 */
export type { ExhibitionItem } from './artwork.types';