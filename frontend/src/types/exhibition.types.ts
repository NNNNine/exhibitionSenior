// src/types/exhibition.types.ts
import { User } from './user.types';
import { Artwork } from './artwork.types';

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
  walls: Wall[];
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
 * Wall interface - represents a wall in the exhibition
 */
export interface Wall {
  id: string;
  name: string;
  displayOrder: number;
  exhibitionId: string;
  exhibition?: Exhibition;
  placements: ArtworkPlacement[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Wall data interface for creation/update
 */
export interface WallData {
  name: string;
  displayOrder?: number;
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
  wall?: Wall;
  artworkId: string;
  artwork: Artwork;
  position: PlacementPosition;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  } | null;
  rotation?: {
    x: number;
    y: number;
    z: number;
  } | null;
  scale?: {
    x: number;
    y: number;
    z: number;
  } | null;
  createdAt: string;
  updatedAt: string;
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
 * Exhibition item interface - represents an artwork placed in an exhibition
 */
export interface ExhibitionItem {
  id: string;
  exhibitionId: string;
  exhibition?: Exhibition;
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

/**
 * Unity layout data format for sending to the Unity WebGL application
 */
export interface UnityLayoutData {
  exhibitionId: string;
  title: string;
  walls: {
    id: string;
    name: string;
    displayOrder: number;
    placements: {
      id: string;
      position: string;
      artwork: {
        id: string;
        title: string;
        fileUrl: string;
        artistName: string;
      };
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
  }[];
}