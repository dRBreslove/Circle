import { GRID_SIZE, POSITION_COLORS, SYNC_POINT } from './constants';

export const parsePositionName = (name) => {
  const [side, direction, vertical] = name.split('');
  return {
    side,
    direction,
    vertical
  };
};

export const calculateColor = (x, y, z, positionName) => {
  // Use predefined color for the position
  const baseColor = POSITION_COLORS[positionName] || '#FFFFFF';
  
  // Convert base color to RGB
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  
  // Adjust color based on coordinates
  const intensity = calculateIntensity(x, y, z);
  return `rgb(${r * intensity}, ${g * intensity}, ${b * intensity})`;
};

export const calculateIntensity = (x, y, z) => {
  const center = GRID_SIZE / 2;
  const distance = Math.sqrt(
    Math.pow(x - center, 2) + 
    Math.pow(y - center, 2) + 
    Math.pow(z - center, 2)
  );
  return Math.max(0, 1 - (distance / (GRID_SIZE / 2)));
};

export const convertContinuomToPixels = (position) => {
  const pixels = [];
  const { perspective } = position;
  const baseX = position.cor.x ? 0 : GRID_SIZE / 2;
  const baseY = position.cor.y ? 0 : GRID_SIZE / 2;
  const baseZ = position.cor.z ? 0 : GRID_SIZE / 2;
  
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const scale = perspective.scale * (1 - perspective.depth * 0.1);
        pixels.push({
          x: (x - baseX) * scale,
          y: (y - baseY) * scale,
          z: (z - baseZ) * scale,
          color: calculateColor(x, y, z, position.name),
          intensity: calculateIntensity(x, y, z),
          scale
        });
      }
    }
  }
  
  return pixels;
};

export const validateSyncPoint = (point) => {
  return (
    point.x === SYNC_POINT.x &&
    point.y === SYNC_POINT.y &&
    point.z === SYNC_POINT.z &&
    point.rotation.x === SYNC_POINT.rotation.x &&
    point.rotation.y === SYNC_POINT.rotation.y &&
    point.rotation.z === SYNC_POINT.rotation.z &&
    point.scale === SYNC_POINT.scale
  );
};

export const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) +
    Math.pow(point2.y - point1.y, 2) +
    Math.pow(point2.z - point1.z, 2)
  );
};

export const isWithinSyncRange = (distance) => {
  return distance >= SYNC_DISTANCE.MIN && distance <= SYNC_DISTANCE.MAX;
}; 