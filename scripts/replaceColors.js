const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Flatten colors object for easier searching
function flattenColors(obj, parentKey = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === 'string') {
      acc[value.toLowerCase()] = newKey;
    } else if (typeof value === 'object') {
      Object.assign(acc, flattenColors(value, newKey));
    }
    return acc;
  }, {});
}

// Convert hex to RGB for comparison
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const num = parseInt(hex, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255
  ];
}

// Find the closest theme color for a given hex color
function findThemeColor(targetColor, themeColors) {
  let minDistance = Infinity;
  let closestColor = null;

  const targetRgb = hexToRgb(targetColor.replace(/^#/, ''));

  Object.entries(themeColors).forEach(([color, path]) => {
    if (color.startsWith('#')) {
      const currentRgb = hexToRgb(color.replace(/^#/, ''));
      const distance = Math.sqrt(
        Math.pow(targetRgb[0] - currentRgb[0], 2) +
        Math.pow(targetRgb[1] - currentRgb[1], 2) +
        Math.pow(targetRgb[2] - currentRgb[2], 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = path;
      }
    }
  });

  return closestColor;
}

// Process a single file
function processFile(filePath, themeColors) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if colors are already imported
  const hasColorImport = content.includes("import { colors }");
  
  // Find color literals in style objects
  const colorRegex = /(backgroundColor|color|borderColor|shadowColor):\s*['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = colorRegex.exec(content)) !== null) {
    const [fullMatch, property, colorValue] = match;
    
    // Skip if it's already using theme colors
    if (colorValue.includes('colors.')) continue;
    
    // Find the closest theme color
    const themeColor = findThemeColor(colorValue, themeColors);
    
    if (themeColor) {
      content = content.replace(
        fullMatch,
        `${property}: colors.${themeColor}`
      );
      modified = true;
    }
  }

  if (modified) {
    // Add colors import if not present
    if (!hasColorImport) {
      const importStatement = "import { colors } from '../theme/colors';\n";
      content = importStatement + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

// Find all relevant files and process them
const files = glob.sync('src/**/*.{js,jsx,ts,tsx}');
const { colors } = require('../src/theme/colors');
const themeColors = flattenColors(colors);

files.forEach(file => {
  try {
    processFile(file, themeColors);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log('Color replacement complete!'); 