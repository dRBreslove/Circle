# Services Organization

## Core Services
- `core/`
  - `AppService.js` - Application state management
  - `AuthService.js` - Authentication handling
  - `ConfigService.js` - Configuration management
  - `ErrorService.js` - Error handling and logging

## VR Services
- `vr/`
  - `VRDService.js` - VR device management
  - `SolarSystemService.js` - Solar system calculations
  - `VRStateService.js` - VR state management
  - `VRInputService.js` - VR input handling

## Sync Services
- `sync/`
  - `SyncService.js` - Core sync functionality
  - `AutoSyncService.js` - Automatic sync handling
  - `SyncStateService.js` - Sync state management
  - `SyncValidationService.js` - Sync data validation

## Camera Services
- `camera/`
  - `CameraService.js` - Camera management
  - `FaceDetectionService.js` - Face detection logic
  - `ImageProcessingService.js` - Image processing

## Network Services
- `network/`
  - `WebRTCService.js` - WebRTC communication
  - `SocketService.js` - Socket.io handling
  - `APIService.js` - REST API communication
  - `NetworkStateService.js` - Network state management

## Data Services
- `data/`
  - `MongoDBService.js` - MongoDB operations
  - `StorageService.js` - Local storage
  - `CacheService.js` - Data caching
  - `MigrationService.js` - Data migration

## Service Guidelines
1. Keep services focused and single-responsibility
2. Implement proper error handling
3. Use dependency injection
4. Include service documentation
5. Add service tests
6. Follow consistent naming conventions
7. Implement proper logging
8. Use proper state management
9. Handle cleanup properly 