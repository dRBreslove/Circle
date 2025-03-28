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
- VR visualization with QubPix
- Screen recording and video capture

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

3. Configure environment variables:
   Create a `.env` file in the root directory with the following content:
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/circle?retryWrites=true&w=majority
   ```
   Replace the placeholders:
   - `<username>`: Your MongoDB username
   - `<password>`: Your MongoDB password
   - `<cluster>`: Your MongoDB cluster address

4. Start MongoDB:
```bash
mongod
```

5. Start the server:
```bash
npm run dev
```

6. Start the mobile app:
```bash
npm run mobile
```

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

#### MongoDB Configuration
- `MONGODB_URI`: MongoDB connection string
  - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/circle?retryWrites=true&w=majority`
  - Required for database connection
  - Supports MongoDB Atlas and self-hosted MongoDB
  - Includes retry writes and write concern options

#### Security Notes
- Never commit the `.env` file to version control
- Keep your database credentials secure
- Use different credentials for development and production
- The `.env` file is included in `.gitignore` by default

## Project Structure

- `/server` - Node.js server with WebRTC signaling and MongoDB integration
- `/screens` - React Native screens for the mobile app
  - `HomeScreen.js` - Main screen with options to create or join a circle
  - `FaceScanScreen.js` - Face recognition and circle joining screen
  - `CircleScreen.js` - Group chat interface with video, audio, and text
  - `PosSysScreen.js` - Position System with Continuom coordinate system
  - `VRViewScreen.js` - VR visualization with QubPix

## Usage

### Basic Circle Features

1. Launch the app
2. Choose to create a new circle or join an existing one
3. Scan your face to generate a unique face key
4. Join the circle and start communicating with other members

### Position System (PosSys)

The PosSys feature implements a unique 3D coordinate system called Continuom, which maps positions to both a 2D map interface and a VR space using the device's current location and orientation.

#### Continuom Coordinate System

The Continuom system defines 8 unique positions in 3D space with perspective-based scaling:

```javascript
const Continuom = [
  // Right side positions with perspective scaling
  { 
    id: 0, 
    name: 'TopFrontRight', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  // ... other positions
];
```

Each position is defined by:
- `id`: Unique identifier (0-7)
- `name`: Descriptive name (e.g., "TopFrontRight")
- `cor`: Continuom coordinates (x, y, z)
- `perspective`: Scaling and depth information
  - `scale`: Base scaling factor (1 for front, 0.8 for back)
  - `depth`: Depth factor (0 for front, 1 for back)

#### QubPix Visualization

The Continuom positions are visualized in VR using QubPix (colored cubes):

1. Each position generates a 32x32x32 grid of QubPix
2. QubPix properties:
   - Color: Based on position and coordinates
   - Scale: Affected by perspective and depth
   - Intensity: Varies with distance from center
   - Position: Mapped to 3D space with perspective scaling

3. Interactive features:
   - Hover effects scale up QubPix by 20%
   - Smooth transitions for all animations
   - Real-time updates through WebSocket

4. Perspective effects:
   - Front positions appear larger and closer
   - Back positions appear smaller and further away
   - Grid lines create depth perception
   - Color intensity varies with distance

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
// Convert Continuom coordinates to QubPix
const convertContinuomToPixels = (position) => {
  const gridSize = 32;
  const pixels = [];
  
  // Calculate base position and perspective scaling
  const baseX = position.cor.x ? 0 : gridSize / 2;
  const baseY = position.cor.y ? 0 : gridSize / 2;
  const baseZ = position.cor.z ? 0 : gridSize / 2;
  const perspectiveScale = position.perspective.scale;
  const depthFactor = position.perspective.depth;
  
  // Generate QubPix with color and position
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        pixels.push({
          x: (x - baseX) * perspectiveScale * (1 - depthFactor * 0.1),
          y: (y - baseY) * perspectiveScale * (1 - depthFactor * 0.1),
          z: (z - baseZ) * perspectiveScale * (1 - depthFactor * 0.1),
          color: calculateColor(x, y, z),
          intensity: calculateIntensity(x, y, z),
          scale: perspectiveScale * (1 - depthFactor * 0.1)
        });
      }
    }
  }
  
  return pixels;
};
```

#### VR Visualization

The PosSys positions are visualized in VR using A-Frame:

1. Each position is represented as a grid of QubPix
2. QubPix are positioned in 3D space based on their Continuom coordinates
3. Color and intensity are calculated based on position and distance from center
4. Real-time updates when positions change
5. Interactive hover effects on QubPix

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

### Camera Switching and Display Modes

The Circle app supports two main display modes with different camera configurations:

#### Local Mode
- Main Display: Shows user's back camera
- Floating Frame: Shows user's front camera
- Position: Floating frame appears in top-right corner (120x160 pixels)

#### Remote Mode
- Main Display: Shows selected member's back camera
- Floating Frame: Shows selected member's front camera
- Position: Floating frame appears in top-right corner (120x160 pixels)

#### Switching Between Modes
1. Tap the "Switch View" button in the floating frame to toggle between local and remote modes
2. Select a member from the member list to view their cameras
3. The floating frame maintains its position and size while switching modes

#### Additional Features
- Real-time video streaming using WebRTC
- High-quality video (1280x720 resolution)
- Smooth transitions between modes
- Member selection through the member list
- Map toggle for location sharing

### Screen Recording

The app includes screen recording functionality:

1. Tap the "Start Recording" button to begin recording
2. Recording duration is displayed in MM:SS format
3. Visual indicator shows recording status
4. Recordings are saved to the device's gallery
5. Maximum recording duration: 1 hour
6. Quality: 720p

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
