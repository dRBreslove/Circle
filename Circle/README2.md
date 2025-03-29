# Position System & VR Features Guide

<img src="src/assets/images/circle-app-logo.png" alt="Circle App Logo" width="100">

This guide provides detailed information about the Position System and VR features in Circle.

## Table of Contents
- [Position System](#position-system)
- [VR Features](#vr-features)
- [Technical Implementation](#technical-implementation)
- [Related Documentation](#related-documentation)

## Position System

The Position System in Circle allows users to share and view their locations in real-time.

### Features
- Real-time location tracking
- Location accuracy display
- Speed and heading information
- Altitude data
- Map visualization

### Implementation
The Position System uses:
- `expo-location` for location services
- `react-native-maps` for map display
- WebSocket for real-time updates

### Position Data Structure
```javascript
interface Position {
  latitude: number;    // Decimal degrees
  longitude: number;   // Decimal degrees
  altitude: number;    // Meters above sea level
  accuracy: number;    // Accuracy in meters
  speed: number;       // Meters per second
  heading: number;     // Degrees from true north
  timestamp: number;   // Unix timestamp
}
```

## VR Features

### VR Space Visualization

1. **Solar System**
   - Sun and Moon visualization
   - Real-time celestial positioning
   - Interactive controls
   - Astronomical accuracy

2. **VRhC (VR hand-held Controller)**
   - 3D space rendering
   - User interaction
   - Object manipulation
   - Environment effects

3. **Sync Features**
   - Real-time synchronization
   - State management
   - Data persistence
   - Error handling

### Technical Implementation

#### Solar System Service
```javascript
class SolarSystemService {
  constructor() {
    this.sunPosition = { x: 0, y: 0, z: 0 };
    this.moonPosition = { x: 0, y: 0, z: 0 };
  }

  updatePosition() {
    // Calculate positions based on time and location
    const now = new Date();
    const location = await this.getCurrentLocation();
    
    this.sunPosition = this.calculateSunPosition(now, location);
    this.moonPosition = this.calculateMoonPosition(now, location);
  }

  calculateSunPosition(time, location) {
    // Astronomical calculations for sun position
    return { x: 0, y: 0, z: 0 }; // Example
  }

  calculateMoonPosition(time, location) {
    // Astronomical calculations for moon position
    return { x: 0, y: 0, z: 0 }; // Example
  }
}
```

#### VRhC Container
```javascript
const VRhCContainer = ({ children }) => {
  const [isGridVisible, setGridVisible] = useState(false);
  const [syncState, setSyncState] = useState(null);

  const handleSync = async () => {
    try {
      const sync = await establishSync();
      setSyncState(sync);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <VRhCSettings 
        onGridToggle={() => setGridVisible(!isGridVisible)}
        onSync={handleSync}
      />
      {children}
      {isGridVisible && <ContinuomGrid />}
    </View>
  );
};
```

### Error Handling
```javascript
try {
  await solarSystem.updatePosition();
} catch (error) {
  if (error.code === 'LOCATION_SERVICES_DISABLED') {
    // Handle location services disabled
  } else if (error.code === 'PERMISSION_DENIED') {
    // Handle permission denied
  } else {
    // Handle other errors
  }
}
```

## Related Documentation

- [Main Documentation](README.md) - Overview and setup
- [Development Guide](README3.md) - Development and testing
- [Release Checklist](RELEASE.md) - Release process

---

[Continue to Development Guide](README3.md) 