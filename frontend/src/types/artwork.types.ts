import { User } from './user.types';

/**
 * Artwork interface - represents an artwork in the system
 */
export interface Artwork {
  id: string;
  title: string;
  description: string;
  artistId: string;
  artist?: User;
  fileUrl: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  creationDate: string;
  comments?: Comment[];
  exhibitionItems?: ExhibitionItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Comment interface - represents a comment on an artwork
 */
export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: User;
  artworkId: string;
  artwork?: Artwork;
  timestamp: string;
}

/**
 * Exhibition item interface - represents an artwork placed in an exhibition
 */
export interface ExhibitionItem {
  id: string;
  exhibitionId: string;
  artworkId: string;
  artwork?: Artwork;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Artwork creation data interface
 */
export interface ArtworkCreateData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  creationDate?: string;
  image: File;
}

/**
 * Artwork update data interface
 */
export interface ArtworkUpdateData {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  image?: File;
}