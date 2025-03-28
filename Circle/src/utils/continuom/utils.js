import { GRID_SIZE, PERSPECTIVE_SCALES } from './constants';

export const parsePositionName = (name) => {
  const [side, direction, vertical] = name.split('');
  return {
    side,
    direction,
    vertical
  };
};

export const calculateColor = (x, y, z) => {
  // Convert coordinates to RGB values
  const r = Math.floor((x / GRID_SIZE) * 255);
  const g = Math.floor((y / GRID_SIZE) * 255);
  const b = Math.floor((z / GRID_SIZE) * 255);
  return `rgb(${r}, ${g}, ${b})`;
};

export const calculateIntensity = (x, y, z) => {
  const center = GRID_SIZE / 2;
  const distance = Math.sqrt(
    Math.pow(x - center, 2) + 
    Math.pow(y - center, 2) + 
    Math.pow(z - center, 2)
  );
  return 1 - (distance / (GRID_SIZE / 2));
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
          color: calculateColor(x, y, z),
          intensity: calculateIntensity(x, y, z),
          scale
        });
      }
    }
  }
  
  return pixels;
}; 