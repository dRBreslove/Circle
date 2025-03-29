# Development and Testing Guide

![Circle App Logo](./src/assets/images/circle-app-logo.png)

This guide provides comprehensive information for developers working on Circle.

## Table of Contents
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Testing Guidelines](#testing-guidelines)
- [Development Best Practices](#development-best-practices)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Development Setup

### Environment Setup
1. Node.js (v14 or higher)
2. npm or yarn
3. Expo CLI
4. MongoDB
5. iOS Simulator (Mac) or Android Studio

### Project Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm start`

## Development Workflow

### Starting Development
```bash
npm run dev
```

### Code Quality
```bash
npm run lint
npm run format
```

### Testing
```bash
npm run test
```

## Project Structure

```
Circle/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── assets/        # Images and other assets
│   └── utils/         # Utility functions
├── server/            # Backend server
├── ios/              # iOS specific files
├── android/          # Android specific files
└── package.json      # Project dependencies
```

## Testing Guidelines

### Test Types
- Unit Tests
- Integration Tests
- E2E Tests
- ESLint Tests

### Coverage Requirements
- Minimum 80% coverage
- Critical paths: 100% coverage
- UI components: 90% coverage

### Tools
- Jest for testing
- ESLint for code quality
- Prettier for formatting

## Development Best Practices

### Code Style
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful comments
- Follow React Native best practices

### Performance
- Optimize images
- Use proper React hooks
- Implement proper cleanup
- Monitor bundle size

## Deployment

### Build Process
1. Android: `npm run build:android`
2. iOS: `npm run build:ios`
3. Server: `npm run build:server`

### Checklist
- [ ] Run all tests
- [ ] Check ESLint
- [ ] Update version
- [ ] Build assets
- [ ] Deploy server
- [ ] Deploy app

## Troubleshooting

### Common Issues
1. Build failures
2. Test failures
3. ESLint errors
4. Performance issues

### Solutions
- Clear cache
- Update dependencies
- Check environment
- Review logs

## Related Documentation

- [Main Documentation](./README.md) - Overview and setup
- [Position System & VR Guide](./README2.md) - Feature details
- [Release Checklist](./RELEASE.md) - Release process

# Development Setup and SyncMode

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

## SyncMode

SyncMode is a special feature that enables synchronized VR experiences when circle members physically meet in the same location. The sync process happens between two members at a time:

### Two-Member Sync Process
- User One streams:
  - Main Display: White background with red dot in the center
  - Floating Frame: White screen with red dot
  - Both dots are linked to User One's device accelerometer
- User Two streams:
  - Main Display: White background with red dot in the center
  - Floating Frame: White screen with red dot
  - Both dots are linked to User Two's device accelerometer
- The red dots move in real-time based on device movement:
  - Tilting the device moves the dots up/down/left/right
  - Rotating the device affects dot position
  - Movement is synchronized between both users' displays

### Sync Point Alignment
- When all four red dots are perfectly centered:
  - Two dots in User One's view (main display and floating frame)
  - Two dots in User Two's view (main display and floating frame)
- A ContinuomSync is automatically created
- The sync point (0,0,0,0,0,0,0,0) is established

### Physical Setup
- Devices must be laid out side by side on a flat surface
- Devices must be at distance 0 (touching or very close to each other)
- This physical arrangement becomes the center of the shared Continuom space

### Synchronized VR Experience
- All members see the same A-Frame scene
- Member positions are represented as colored cubes
- Connection lines show the relationships between members
- Visual effects reflect the strength of the circle's connection:
  - Member opacity shows individual sync strength
  - Connection lines show relationship strength
  - Scene environment changes based on overall circle strength
- Continuom Grid Toggle:
  - Tap the "Toggle Grid" button to show/hide the Continuom grid
  - Grid visibility is synchronized between all members
  - Grid state persists during the sync session
  - Grid helps visualize the 8 positions in 3D space

### Real-time Updates
- Position updates are broadcast to all members
- Scene updates maintain relative positions
- Circle strength affects visual effects and environment
- Grid visibility changes are synchronized in real-time

### Sync Requirements
- Two members must be physically present
- Devices must be laid out side by side
- Devices must be at distance 0 (touching or very close)
- All four red dots must be perfectly centered
- Both members must have their streams active
- ContinuomSync must be automatically established

The sync point (0,0,0,0,0,0,0,0) represents the physical center point where the devices are laid out, serving as the reference point for all subsequent movements and interactions in the shared VR space.

Note: This feature is specifically designed for in-person gatherings where devices can be physically arranged together. It is not available for remote or virtual meetings. 