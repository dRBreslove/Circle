import { CONTINUOM_POSITIONS, GRID_SIZE } from './constants';

/**
 * Calculate the connection points between multiple members in a circle
 * @param {Array} members - Array of circle members with their positions and distances
 * @returns {Object} Connection points and sync status for all members
 */
export const calculateCircleSync = (members) => {
  if (members.length < 2) {
    throw new Error('At least 2 members are required for circle sync');
  }

  const syncStatus = {
    members: [],
    connections: [],
    circleStrength: 0,
    isComplete: false
  };

  // Calculate connections between all pairs of members
  for (let i = 0; i < members.length; i++) {
    const member1 = members[i];
    const member1Status = {
      id: member1.id,
      position: member1.position,
      connections: [],
      syncStrength: 0
    };

    for (let j = i + 1; j < members.length; j++) {
      const member2 = members[j];
      const connection = calculateContinuomConnection(
        member1.position,
        member2.position,
        member1.distances[j] // Distance between member1 and member2
      );

      member1Status.connections.push({
        to: member2.id,
        ...connection
      });

      syncStatus.connections.push({
        from: member1.id,
        to: member2.id,
        ...connection
      });
    }

    // Calculate member's overall sync strength
    member1Status.syncStrength = calculateMemberSyncStrength(member1Status.connections);
    syncStatus.members.push(member1Status);
  }

  // Calculate overall circle sync strength
  syncStatus.circleStrength = calculateCircleStrength(syncStatus.connections);
  syncStatus.isComplete = checkCircleCompletion(syncStatus.members);

  return syncStatus;
};

/**
 * Calculate the connection point between two Continuom positions based on distance
 * @param {Object} position1 - First Continuom position
 * @param {Object} position2 - Second Continuom position
 * @param {number} distance - Distance between phones in centimeters
 * @returns {Object} Connection point coordinates and metadata
 */
const calculateContinuomConnection = (position1, position2, distance) => {
  // Convert distance to grid units (assuming 1 grid unit = 1cm)
  const gridDistance = Math.min(distance, GRID_SIZE);
  
  // Get the relative positions of both Continuoms
  const pos1 = CONTINUOM_POSITIONS.find(p => p.id === position1.id);
  const pos2 = CONTINUOM_POSITIONS.find(p => p.id === position2.id);
  
  if (!pos1 || !pos2) {
    throw new Error('Invalid Continuom position IDs');
  }
  
  // Calculate the connection point based on the positions and distance
  const connectionPoint = {
    x: (pos1.cor.x + pos2.cor.x) / 2,
    y: (pos1.cor.y + pos2.cor.y) / 2,
    z: (pos1.cor.z + pos2.cor.z) / 2,
    distance: gridDistance,
    position1: pos1.name,
    position2: pos2.name,
    syncStrength: calculateSyncStrength(gridDistance)
  };
  
  return connectionPoint;
};

/**
 * Calculate the sync strength between two positions
 * @param {number} distance - Distance in grid units
 * @returns {number} Sync strength value between 0 and 1
 */
const calculateSyncStrength = (distance) => {
  // Maximum distance for full sync (in grid units)
  const MAX_DISTANCE = GRID_SIZE / 2;
  
  // Calculate sync strength (1 = perfect sync, 0 = no sync)
  const strength = Math.max(0, 1 - (distance / MAX_DISTANCE));
  
  return strength;
};

/**
 * Calculate the overall sync strength for a member based on their connections
 * @param {Array} connections - Array of member's connections
 * @returns {number} Overall sync strength value between 0 and 1
 */
const calculateMemberSyncStrength = (connections) => {
  if (connections.length === 0) return 0;
  
  const totalStrength = connections.reduce((sum, conn) => sum + conn.syncStrength, 0);
  return totalStrength / connections.length;
};

/**
 * Calculate the overall circle sync strength
 * @param {Array} connections - Array of all connections in the circle
 * @returns {number} Overall circle sync strength value between 0 and 1
 */
const calculateCircleStrength = (connections) => {
  if (connections.length === 0) return 0;
  
  const totalStrength = connections.reduce((sum, conn) => sum + conn.syncStrength, 0);
  return totalStrength / connections.length;
};

/**
 * Check if the circle is complete (all members are connected)
 * @param {Array} members - Array of member statuses
 * @returns {boolean} Whether the circle is complete
 */
const checkCircleCompletion = (members) => {
  // A circle is complete when each member has connections to all other members
  const requiredConnections = members.length - 1;
  
  return members.every(member => 
    member.connections.length === requiredConnections
  );
};

/**
 * Check if two positions can sync based on their types
 * @param {Object} position1 - First Continuom position
 * @param {Object} position2 - Second Continuom position
 * @returns {boolean} Whether the positions can sync
 */
export const canPositionsSync = (position1, position2) => {
  const pos1 = CONTINUOM_POSITIONS.find(p => p.id === position1.id);
  const pos2 = CONTINUOM_POSITIONS.find(p => p.id === position2.id);
  
  if (!pos1 || !pos2) {
    return false;
  }
  
  // Positions can sync if they share the same side (Left/Right)
  return pos1.name[0] === pos2.name[0];
};

/**
 * Get the sync mode status for a circle member
 * @param {Object} member - Circle member object
 * @returns {Object} Sync mode status
 */
export const getSyncModeStatus = (member) => {
  return {
    isInSync: member.syncMode?.active || false,
    currentPosition: member.syncMode?.position,
    connectedTo: member.syncMode?.connectedTo || [],
    syncStrength: member.syncMode?.strength || 0
  };
}; 