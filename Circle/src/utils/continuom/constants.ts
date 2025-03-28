import { ContinuomPosition } from './types';

export const CONTINUOM_POSITIONS: ContinuomPosition[] = [
  {
    id: 0,
    name: 'RightFrontUp',
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  {
    id: 1,
    name: 'RightFrontDown',
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  {
    id: 2,
    name: 'RightBackUp',
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 0.8, depth: 1 }
  },
  {
    id: 3,
    name: 'RightBackDown',
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 0.8, depth: 1 }
  },
  {
    id: 4,
    name: 'LeftFrontUp',
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  {
    id: 5,
    name: 'LeftFrontDown',
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  {
    id: 6,
    name: 'LeftBackUp',
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 0.8, depth: 1 }
  },
  {
    id: 7,
    name: 'LeftBackDown',
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 0.8, depth: 1 }
  }
];

export const PERSPECTIVE_SCALES = {
  FRONT: 1.0,
  BACK: 0.8,
  SIDE: 0.9
} as const;

export const GRID_SIZE = 32; 