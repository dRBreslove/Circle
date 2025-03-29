export const CONTINUOM_POSITIONS = [
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
};

export const GRID_SIZE = 32;

export const SYNC_POINT = {
  x: 0,
  y: 0,
  z: 0,
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1
};

export const POSITION_COLORS = {
  RFU: '#FF0000',
  RFD: '#FF3333',
  RBU: '#FF6666',
  RBD: '#FF9999',
  LFU: '#0000FF',
  LFD: '#3333FF',
  LBU: '#6666FF',
  LBD: '#9999FF'
};

export const SYNC_DISTANCE = {
  MIN: 0,  // Devices must be touching
  MAX: 5   // Maximum distance in centimeters
};

// Auto Sync Mode Constants
export const AUTO_SYNC = {
  CENTER_THRESHOLD: 0.1,  // Threshold for considering a dot centered
  SOUND_FILE: 'sync_success.mp3',
  CAMERA: {
    BACK: 'back',
    FRONT: 'front'
  },
  DISPLAY_TYPES: {
    MAIN: 'mainDisplay',
    FLOATING: 'floatingFrame'
  },
  DOT_COLORS: {
    BACKGROUND: '#FFFFFF',
    DOT: '#FF0000'
  }
}; 