import { User } from './user.types';
import { Artwork } from './artwork.types';

/**
 * Wall interface - represents a wall in the exhibition
 */
export interface Wall {
  id: string;
  name: string;
  displayOrder: number;
  exhibitionId: string;
  placements: ArtworkPlacement[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Artwork placement positions
 */
export enum PlacementPosition {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  CUSTOM = 'custom'
}

/**
 * Artwork placement interface - represents artwork placement on a wall
 */
export interface ArtworkPlacement {
  id: string;
  wallId: string;
  artworkId: string;
  artwork: Artwork;
  position: PlacementPosition;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
  scale?: {
    x: number;
    y: number;
    z: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Exhibition interface - represents the exhibition in the system
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
  walls: Wall[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Exhibition creation/update data interface
 */
export interface ExhibitionData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

/**
 * Wall creation/update data interface
 */
export interface WallData {
  name: string;
  displayOrder?: number;
}

/**
 * Wall layout update data interface
 */
export interface WallLayoutData {
  placements: {
    artworkId: string;
    position: PlacementPosition;
    coordinates?: {
      x: number;
      y: number;
      z: number;
    };
    rotation?: {
      x: number;
      y: number;
      z: number;
    };
    scale?: {
      x: number;
      y: number;
      z: number;
    };
  }[];
}

/**
 * Drag item type for react-dnd
 */
export interface DraggableArtwork extends Artwork {
  type: 'ARTWORK';
}

/**
 * Drop result type for react-dnd
 */
export interface DropResult {
  position: PlacementPosition;
  wallId: string;
}