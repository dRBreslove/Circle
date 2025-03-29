import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import io from 'socket.io-client';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import Logo from '../src/components/Logo';

const socket = io('http://localhost:3000');

export default function FaceScanScreen({ route, navigation }) {
  const { mode } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.front);
  const cameraRef = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    setupWebRTC();
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const setupWebRTC = async () => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    // Add event listeners for WebRTC
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: 'server',
          candidate: event.candidate,
        });
      }
    };

    // Get local stream with both cameras
    const frontStream = await mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    const backStream = await mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    // Add tracks to peer connection
    frontStream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, frontStream);
    });

    backStream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, backStream);
    });
  };

  const handleFacesDetected = async ({ faces }) => {
    if (faces.length > 0 && !scanning) {
      setScanning(true);
      const faceData = faces[0];
      const faceKey = generateFaceKey(faceData);
      
      try {
        socket.emit('join-circle', { faceKey });
        navigation.navigate('Circle', { faceKey });
      } catch (error) {
        Alert.alert('Error', 'Failed to join circle');
        setScanning(false);
      }
    }
  };

  const generateFaceKey = (faceData) => {
    const { bounds, rollAngle, yawAngle } = faceData;
    return `${bounds.origin.x}-${bounds.origin.y}-${rollAngle}-${yawAngle}`;
  };

  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Logo size={80} style={styles.logo} />
      <Text style={styles.title}>
        {mode === 'create' ? 'Create New Circle' : 'Join Circle'}
      </Text>
      <Text style={styles.subtitle}>
        Position your face in the frame
      </Text>
      
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              {scanning && (
                <View style={styles.scanningIndicator}>
                  <Text style={styles.scanningText}>Verifying...</Text>
                </View>
              )}
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  focusedContainer: {
    flex: 2,
    flexDirection: 'row',
  },
  scanningIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanningText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 