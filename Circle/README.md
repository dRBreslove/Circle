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

The Continuom system defines 8 unique positions in 3D space with perspective-based scaling, centered around the Heart. Each position name follows the pattern [Side][Front/Back][Up/Down], where:
- Side is either Left (L) or Right (R)
- Front/Back indicates position relative to the Heart
- Up/Down indicates vertical position relative to the Heart

![PosSys Diagram](assets/images/possys-diagram.png.png)

```javascript
const Continuom = [
  // Right side positions with perspective scaling
  { 
    id: 0, 
    name: 'RightFrontUp', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  // ... other positions
];
```

Each position is defined by:
- `id`: Unique identifier (0-7)
- `name`: Descriptive name following [Side][Front/Back][Up/Down] pattern
- `cor`: Continuom coordinates (x, y, z) relative to the Heart
- `perspective`: Scaling and depth information
  - `scale`: Base scaling factor (1 for front, 0.8 for back)
  - `depth`: Depth factor (0 for front, 1 for back)

```
    Front View (Scale: 1.0)        Back View (Scale: 0.8)
    ┌─────────┐                    ┌─────────┐
    │  RFU    │                    │  RBU    │
    │  (0)    │                    │  (2)    │
    ├─────────┤                    ├─────────┤
    │  RFD    │                    │  RBD    │
    │  (1)    │                    │  (3)    │
    └─────────┘                    └─────────┘

    Left View (Scale: 0.9)         Right View (Scale: 0.9)
    ┌─────────┐                    ┌─────────┐
    │  LFU    │                    │  RFU    │
    │  (4)    │                    │  (0)    │
    ├─────────┤                    ├─────────┤
    │  LFD    │                    │  RFD    │
    │  (5)    │                    │  (1)    │
    └─────────┘                    └─────────┘

    Top View (Scale: 1.0)          Bottom View (Scale: 0.8)
    ┌─────────┐                    ┌─────────┐
    │  RFU    │                    │  RFD    │
    │  (0)    │                    │  (1)    │
    ├─────────┤                    ├─────────┤
    │  LFU    │                    │  LFD    │
    │  (4)    │                    │  (5)    │
    └─────────┘                    └─────────┘

Legend:
- RFU: Right Front Up (0)
- RFD: Right Front Down (1)
- RBU: Right Back Up (2)
- RBD: Right Back Down (3)
- LFU: Left Front Up (4)
- LFD: Left Front Down (5)
- LBU: Left Back Up (6)
- LBD: Left Back Down (7)

Position Naming Convention:
- First letter: Side (L/R)
  - L = Left
  - R = Right
- Second letter: Front/Back (F/B)
  - F = Front (towards Heart)
  - B = Back (away from Heart)
- Third letter: Up/Down (U/D)
  - U = Up
  - D = Down

Perspective Scaling:
- Front positions: 1.0 scale
- Back positions: 0.8 scale
- Side positions: 0.9 scale
- Depth factor increases from front (0) to back (1)
```

The diagram above shows the 8 positions in the Continuom coordinate system:
1. Right Front Up (RFU)
2. Right Front Down (RFD)
3. Right Back Up (RBU)
4. Right Back Down (RBD)
5. Left Front Up (LFU)
6. Left Front Down (LFD)
7. Left Back Up (LBU)
8. Left Back Down (LBD)

Each position is color-coded and labeled for easy identification. The perspective scaling is visually represented by the size and depth of each position in the diagram.

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
7. Toggle the Continuom grid:
   - Tap the "Hide Grid" button in the top-right corner to hide the grid
   - Tap "Show Grid" to display the grid again
   - Grid visibility state persists during the session

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

The app includes screen recording functionality with direct WhatsApp sharing:

1. Tap the "Start Recording" button to begin recording
2. Recording duration is displayed in MM:SS format
3. Visual indicator shows recording status
4. Recordings are automatically saved to the app's Movies directory
5. Maximum recording duration: 1 hour
6. Quality: 720p

#### Recording Storage

- All recordings are stored in the app's Movies directory
- Each recording has a unique filename with timestamp
- The Movies directory is created automatically if it doesn't exist
- Recordings persist between app sessions

#### Direct WhatsApp Sharing

1. After recording completes, you'll be prompted to share the video
2. Tap "Share" to open WhatsApp sharing options
3. Choose a WhatsApp contact or group
4. Add an optional message
5. Send the video directly to WhatsApp

Features:
- One-tap sharing to WhatsApp
- No need to manually locate the video file
- Direct integration with WhatsApp's sharing interface
- Maintains original video quality
- Works with both individual chats and group chats

Note: WhatsApp must be installed on the device to share videos. The app will prompt to install WhatsApp if it's not available.

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

## iOS Development Setup

### Prerequisites
- Xcode 15.0 or later
- iOS 17.0+ deployment target
- Apple Developer account (for signing and distribution)

### Project Structure
```
ios/
└── Circle/
    ├── Circle.xcodeproj/          # Xcode project file
    ├── Circle/                    # Main app target
    │   ├── Sources/              # Swift source files
    │   ├── Resources/            # Assets and resources
    │   ├── Info.plist            # App configuration
    │   └── Circle.entitlements   # App capabilities
    └── Preview Content/          # SwiftUI preview assets
```

### Required Capabilities
The app requires the following iOS capabilities:
- Camera access for face recognition and video chat
- Location services for Position System
- Microphone access for audio chat
- Network access for WebRTC
- File system access for video recording
- Associated domains for deep linking

### Building the App
1. Open `ios/Circle/Circle.xcodeproj` in Xcode
2. Select your development team in project settings
3. Choose a target device or simulator
4. Build and run the project (⌘R)

### Development Notes
- The app uses SwiftUI for the user interface
- Minimum deployment target is iOS 17.0
- Supports both iPhone and iPad
- Requires camera and microphone permissions
- Uses modern Swift concurrency features

### Troubleshooting
If you encounter build issues:
1. Clean the build folder (Shift + ⌘K)
2. Clean build folder and remove derived data
3. Ensure all required capabilities are enabled
4. Check signing certificate and provisioning profile

## Android Development Setup

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- Android SDK 34 (Android 14)
- Minimum SDK 24 (Android 7.0)
- Kotlin 1.9.20
- JDK 17

### Project Structure
```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/circle/app/
│   │       │   ├── MainActivity.kt
│   │       │   ├── service/
│   │       │   ├── ui/
│   │       │   │   ├── screens/
│   │       │   │   └── theme/
│   │       │   └── utils/
│   │       ├── res/
│   │       │   ├── drawable/
│   │       │   ├── layout/
│   │       │   └── values/
│   │       └── AndroidManifest.xml
│   └── build.gradle
└── build.gradle
```

### Required Permissions
The app requires the following Android permissions:
- `INTERNET` for WebRTC and network communication
- `CAMERA` for face recognition and video chat
- `RECORD_AUDIO` for audio chat
- `ACCESS_FINE_LOCATION` for Position System
- `ACCESS_COARSE_LOCATION` for approximate location
- `WRITE_EXTERNAL_STORAGE` for video recording (Android 9 and below)
- `READ_EXTERNAL_STORAGE` for accessing recorded videos (Android 9 and below)

### Dependencies
Key dependencies include:
- Jetpack Compose for modern UI
- CameraX for camera functionality
- Google Maps SDK for location features
- WebRTC for video/audio communication
- Room for local storage
- Retrofit for network calls
- Coroutines for asynchronous operations

### Building the App
1. Open the project in Android Studio
2. Sync project with Gradle files
3. Connect an Android device or start an emulator
4. Click "Run" or press Shift+F10

### Development Notes
- Uses Material3 design system
- Implements MVVM architecture
- Follows Android best practices
- Supports both light and dark themes
- Implements runtime permissions handling
- Uses Kotlin Coroutines for async operations

### Troubleshooting
If you encounter build issues:
1. Clean project (Build > Clean Project)
2. Invalidate caches (File > Invalidate Caches)
3. Update Gradle sync
4. Check SDK versions in build.gradle files
5. Verify all required permissions in AndroidManifest.xml
