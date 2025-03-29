import 'react-native-gesture-handler/jestSetup';

// Mock the react-native-reanimated library
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock the expo-camera module
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: {
    back: 'back',
    front: 'front'
  }
}));

// Mock the expo-location module
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn()
}));

// Mock the expo-face-detector module
jest.mock('expo-face-detector', () => ({
  FaceDetector: {
    Mode: {
      fast: 'fast',
      accurate: 'accurate'
    },
    Landmarks: {
      all: 'all',
      none: 'none'
    },
    Performance: {
      fast: 'fast',
      accurate: 'accurate'
    }
  }
}));

// Mock WebRTC
jest.mock('react-native-webrtc', () => ({
  RTCPeerConnection: jest.fn(),
  RTCSessionDescription: jest.fn(),
  RTCIceCandidate: jest.fn(),
  MediaStream: jest.fn(),
  MediaStreamTrack: jest.fn(),
  mediaDevices: {
    getUserMedia: jest.fn()
  }
})); 