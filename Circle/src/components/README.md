# Components Organization

## VR Components
- `vr/`
  - `VRDContainer.js` - Main VR container
  - `VRD.js` - Core VR functionality
  - `VRDSettings.js` - VR settings panel
  - `VRDTutorial.js` - VR tutorial component
  - `SolarSystem.js` - Solar system visualization

## Sync Components
- `sync/`
  - `SyncOverlay.js` - Main sync overlay
  - `SyncHistory.js` - Sync history display
  - `SyncSettings.js` - Sync settings panel
  - `SyncTutorial.js` - Sync tutorial component

## Camera Components
- `camera/`
  - `CameraPreview.js` - Camera preview component
  - `FaceDetection.js` - Face detection logic
  - `CameraControls.js` - Camera control panel

## Common Components
- `common/`
  - `Button.js` - Reusable button component
  - `Card.js` - Reusable card component
  - `Modal.js` - Reusable modal component
  - `Loading.js` - Loading indicator
  - `ErrorBoundary.js` - Error handling component

## Screen Components
- `screens/`
  - `HomeScreen.js` - Home screen
  - `CircleScreen.js` - Circle management
  - `PosSysScreen.js` - Position system
  - `VRViewScreen.js` - VR view
  - `FaceScanScreen.js` - Face scanning

## Component Guidelines
1. Keep components under 300 lines
2. Use functional components with hooks
3. Implement proper prop types
4. Include component documentation
5. Add component tests
6. Follow consistent naming conventions
7. Use proper error handling
8. Implement loading states
9. Add accessibility support 