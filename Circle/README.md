# Circle - WebRTC Group Chat App

Circle is a hybrid mobile application that enables secure group communication through face recognition and WebRTC technology. Users can create or join circles (groups) by scanning their faces, and then communicate through video, audio, and text chat.

## Features

- Face recognition-based circle creation and joining
- Real-time video and audio communication
- Text chat functionality
- Secure peer-to-peer connections
- MongoDB for circle management
- Modern and intuitive UI
- Position System (PosSys) with Continuom coordinate system
- Live location sharing
- Device orientation-based positioning
- VR visualization of shared positions

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- React Native development environment
- Expo CLI

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dRBreslove/circle.git
cd circle
```

2. Install dependencies:
```bash
npm install
```

3. Start MongoDB:
```bash
mongod
```

4. Start the server:
```bash
npm run dev
```

5. Start the mobile app:
```bash
npm run mobile
```

## Project Structure

- `/server` - Node.js server with WebRTC signaling and MongoDB integration
- `/screens` - React Native screens for the mobile app
  - `HomeScreen.js` - Main screen with options to create or join a circle
  - `FaceScanScreen.js` - Face recognition and circle joining screen
  - `CircleScreen.js` - Group chat interface with video, audio, and text
  - `PosSysScreen.js` - Position System with Continuom coordinate system
  - `VRViewScreen.js` - VR visualization of shared positions

## Usage

### Basic Circle Features

1. Launch the app
2. Choose to create a new circle or join an existing one
3. Scan your face to generate a unique face key
4. Join the circle and start communicating with other members

### Position System (PosSys)

The PosSys feature implements a unique 3D coordinate system called Continuom, which maps positions to both a 2D map interface and a VR space using the device's current location and orientation.

#### Continuom Coordinate System

The Continuom system defines 8 unique positions in 3D space:

```javascript
const Continuom = [
  { id: 0, name: 'Up-North-West', up: true, north: true, west: true },
  { id: 1, name: 'Up-South-West', up: true, north: false, west: true },
  { id: 2, name: 'Up-South-East', up: true, north: false, west: false },
  { id: 3, name: 'Up-North-East', up: true, north: true, west: false },
  { id: 4, name: 'Down-North-West', up: false, north: true, west: true },
  { id: 5, name: 'Down-South-East', up: false, north: false, west: false },
  { id: 6, name: 'Down-South-West', up: false, north: false, west: true },
  { id: 7, name: 'Down-North-East', up: false, north: true, west: false },
];
```

Each position is defined by three binary attributes:
- `up`: Vertical position (true = above ground, false = below ground)
- `north`: North-South position (true = north, false = south)
- `west`: East-West position (true = west, false = east)

#### Using PosSys

1. Tap the "Position System" button on the home screen
2. Allow location access when prompted
3. The map interface shows all 8 Continuom positions centered on your current location
4. Select a position by:
   - Tapping the position button in the control panel
   - Tapping the marker on the map
5. The map will animate to show the selected position
6. Device orientation affects the positioning:
   - Up/Down is represented by zoom level and device tilt
   - North/South/East/West are represented by position on the map
   - Real-time accelerometer data adjusts the view

#### Position Mapping Example

```javascript
// Convert Continuom coordinates to map coordinates
const getMapCoordinates = (position) => {
  if (!deviceLocation) return null;

  // Calculate offset based on Continuom position
  const latOffset = position.north ? 0.0001 : -0.0001;
  const lngOffset = position.west ? -0.0001 : 0.0001;
  
  // Use accelerometer data to adjust zoom level
  const baseZoom = 0.0002;
  const zFactor = Math.abs(accelerometerData.z);
  const zoomLevel = position.up ? baseZoom * (1 + zFactor) : baseZoom * (1 - zFactor);
  
  return {
    latitude: deviceLocation.latitude + latOffset,
    longitude: deviceLocation.longitude + lngOffset,
    latitudeDelta: zoomLevel,
    longitudeDelta: zoomLevel,
  };
};
```

#### VR Visualization

The PosSys positions are also visualized in VR using A-Frame:

1. Each position is represented as a 32x32x32 grid of colored pixels
2. Pixels are positioned in 3D space based on their Continuom coordinates
3. Color and intensity are calculated based on position and distance from center
4. Real-time updates when positions change
5. Interactive hover effects on pixels

#### Sharing Positions

1. Select a Continuom position
2. Tap "Share Position" to broadcast your position to circle members
3. Other members will see your position in their VR view
4. Tap "Stop Sharing" to end position sharing

### Live Location Sharing

1. In a circle, tap the "Show Map" button
2. Your location will be shared with circle members
3. See all members' locations on the map
4. Blue pin shows your location
5. Red pins show other members' locations

## Security

- Face recognition data is used only for circle authentication
- All communication is peer-to-peer using WebRTC
- No data is stored except for circle membership information
- Face keys are generated locally and never transmitted in raw form
- Location sharing is only active within circles
- Device orientation data is processed locally

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
