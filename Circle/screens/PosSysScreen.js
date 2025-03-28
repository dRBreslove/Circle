import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { Accelerometer } from 'expo-sensors';
import { useNavigation } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import { WebSocket } from 'react-native-websocket';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

// Continuom coordinate system
const Continuom = [
  // Right side positions with perspective scaling
  { 
    id: 0, 
    name: 'TopFrontRight', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  { 
    id: 1, 
    name: 'BottomFrontRight', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  { 
    id: 2, 
    name: 'TopBackRight', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 0.8, depth: 1 }
  },
  { 
    id: 3, 
    name: 'BottomBackRight', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 0.8, depth: 1 }
  },
  
  // Left side positions with perspective scaling
  { 
    id: 4, 
    name: 'TopFrontLeft', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  { 
    id: 5, 
    name: 'BottomFrontLeft', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 1, depth: 0 }
  },
  { 
    id: 6, 
    name: 'TopBackLeft', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 0.8, depth: 1 }
  },
  { 
    id: 7, 
    name: 'BottomBackLeft', 
    cor: { x: 0, y: 0, z: 0 },
    perspective: { scale: 0.8, depth: 1 }
  }
];

export default function PosSysScreen() {
  const navigation = useNavigation();
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [orientation, setOrientation] = useState({ x: 0, y: 0, z: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cameraPoints, setCameraPoints] = useState([]);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const mapRef = useRef(null);
  const subscription = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);
  const streamInterval = useRef(null);
  const [pixelData, setPixelData] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef(null);
  const recordingStartTime = useRef(null);
  const [recordingUri, setRecordingUri] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    let subscription;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission not granted');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setDeviceLocation(location);

        subscription = Accelerometer.addListener(accelerometerData => {
          setOrientation(accelerometerData);
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    setupWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (streamInterval.current) clearInterval(streamInterval.current);
    };
  }, []);

  const setupWebSocket = () => {
    wsRef.current = new WebSocket('ws://localhost:3000');
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      wsRef.current.send(JSON.stringify({
        type: 'join_circle',
        circleId: faceKey
      }));
    };
  };

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
    // Convert Continuom position to pixel coordinates
    const pixelCoordinates = convertContinuomToPixels(position);
    setPixelData(pixelCoordinates);
    
    // Send pixel data to A-Frame scene
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stream_update',
        circleId: faceKey,
        pixelData: pixelCoordinates
      }));
    }
  };

  const convertContinuomToPixels = (position) => {
    const gridSize = 32; // 32x32 grid for A-Frame
    const pixels = [];
    
    // Calculate base position in the grid
    const baseX = position.cor.x ? 0 : gridSize / 2;
    const baseY = position.cor.y ? 0 : gridSize / 2;
    const baseZ = position.cor.z ? 0 : gridSize / 2;
    
    // Apply perspective scaling
    const perspectiveScale = position.perspective.scale;
    const depthFactor = position.perspective.depth;
    
    // Generate QubPix data based on position
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          // Calculate distance from center for intensity
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - gridSize/2, 2) + 
            Math.pow(y - gridSize/2, 2) + 
            Math.pow(z - gridSize/2, 2)
          );
          
          // Calculate color based on position and Continuom coordinates
          const r = Math.floor((x / gridSize) * 255);
          const g = Math.floor((y / gridSize) * 255);
          const b = Math.floor((z / gridSize) * 255);
          
          // Apply perspective scaling to position
          const scaledX = (x - baseX) * perspectiveScale * (1 - depthFactor * 0.1);
          const scaledY = (y - baseY) * perspectiveScale * (1 - depthFactor * 0.1);
          const scaledZ = (z - baseZ) * perspectiveScale * (1 - depthFactor * 0.1);
          
          // Create QubPix with color and position
          pixels.push({
            x: scaledX,
            y: scaledY,
            z: scaledZ,
            color: `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`,
            intensity: 1 - (distanceFromCenter / (gridSize/2)),
            scale: perspectiveScale * (1 - depthFactor * 0.1),
            position: {
              id: position.id,
              name: position.name,
              cor: position.cor
            }
          });
        }
      }
    }
    
    return pixels;
  };

  const handleZoomChange = (event) => {
    setZoomLevel(event.zoom);
  };

  const startStreaming = async () => {
    if (!cameraRef.current || isStreaming) return;
    
    setIsStreaming(true);
    const gridSize = 32; // 32x32 grid for performance
    
    streamInterval.current = setInterval(async () => {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.1,
          base64: true,
          exif: true,
        });

        const image = new Image();
        image.src = `data:image/jpeg;base64,${photo.base64}`;
        
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = gridSize;
          canvas.height = gridSize;
          
          // Draw and scale image to match grid size
          ctx.drawImage(image, 0, 0, gridSize, gridSize);
          
          // Sample pixels
          const pixelData = [];
          const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
          
          for (let i = 0; i < imageData.data.length; i += 4) {
            pixelData.push({
              color: `#${[imageData.data[i], imageData.data[i+1], imageData.data[i+2]]
                .map(x => x.toString(16).padStart(2, '0'))
                .join('')}`
            });
          }
          
          // Send pixel data through WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(pixelData));
          }
        };
      } catch (error) {
        console.error('Error capturing camera data:', error);
      }
    }, 100); // Stream every 100ms
  };

  const stopStreaming = () => {
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }
    setIsStreaming(false);
  };

  const addCameraPoint = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.1, // Lower quality for better performance
          base64: true,
          exif: true,
        });

        // Process the image to get pixel data
        const image = new Image();
        image.src = `data:image/jpeg;base64,${photo.base64}`;
        
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
          
          // Sample pixels (every 10th pixel for performance)
          const pixelData = [];
          const sampleRate = 10;
          
          for (let y = 0; y < canvas.height; y += sampleRate) {
            for (let x = 0; x < canvas.width; x += sampleRate) {
              const pixel = ctx.getImageData(x, y, 1, 1).data;
              pixelData.push({
                x: (x - canvas.width/2) / 100, // Scale down for VR
                y: (y - canvas.height/2) / 100,
                z: -5,
                color: `#${[pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')}`,
                isFrontCamera,
                timestamp: Date.now()
              });
            }
          }
          
          setCameraPoints([...cameraPoints, ...pixelData]);
        };
      } catch (error) {
        console.error('Error capturing camera data:', error);
      }
    }
  };

  const toggleCamera = () => {
    setIsFrontCamera(!isFrontCamera);
  };

  const viewInVR = () => {
    navigation.navigate('VRView', {
      deviceLocation,
      orientation,
      zoomLevel,
      cameraPoints
    });
  };

  const handleShare = () => {
    if (!selectedPosition) {
      Alert.alert('Error', 'Please select a position first');
      return;
    }

    setIsSharing(true);
    const pixelCoordinates = convertContinuomToPixels(selectedPosition);
    
    // Send position data to all circle members
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'share_possys',
        circleId: faceKey,
        position: selectedPosition,
        pixelData: pixelCoordinates
      }));
    }
  };

  const stopSharing = () => {
    setIsSharing(false);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_sharing',
        circleId: faceKey
      }));
    }
  };

  const getMapCoordinates = (position) => {
    if (!deviceLocation) return null;

    // Calculate base offset based on Continuom position
    const latOffset = position.z ? 0.0001 : -0.0001;
    const lngOffset = position.x ? -0.0001 : 0.0001;
    
    // Apply perspective scaling
    const baseZoom = 0.0002;
    const zFactor = Math.abs(accelerometerData.z);
    const perspectiveScale = position.perspective.scale;
    const depthFactor = position.perspective.depth;
    
    // Calculate zoom level with perspective
    const zoomLevel = position.y 
      ? baseZoom * (1 + zFactor) * perspectiveScale * (1 + depthFactor * 0.2)
      : baseZoom * (1 - zFactor) * perspectiveScale * (1 + depthFactor * 0.2);
    
    return {
      latitude: deviceLocation.coords.latitude + latOffset,
      longitude: deviceLocation.coords.longitude + lngOffset,
      latitudeDelta: zoomLevel,
      longitudeDelta: zoomLevel,
    };
  };

  const getPositionColor = (position) => {
    const { cor } = position;
    const isRightSide = position.cor.x === 1;
    
    // Different color schemes for right and left sides
    if (isRightSide) {
      const r = 255;  // Red for right side
      const g = cor.y ? 255 : 0;  // Green for vertical position
      const b = cor.z ? 255 : 0;  // Blue for north/south
      return `rgb(${r},${g},${b})`;
    } else {
      const r = 0;  // No red for left side
      const g = cor.y ? 255 : 0;  // Green for vertical position
      const b = cor.z ? 255 : 0;  // Blue for north/south
      return `rgb(${r},${g},${b})`;
    }
  };

  const renderGrid = () => {
    return Continuom.map((pos) => {
      const coords = getMapCoordinates(pos);
      if (!coords) return null;

      return (
        <View key={pos.id} style={styles.gridContainer}>
          <Marker
            coordinate={{
              latitude: coords.latitude,
              longitude: coords.longitude,
            }}
            style={[
              styles.gridMarker,
              {
                transform: [
                  { scale: pos.perspective.scale },
                  { translateY: pos.perspective.depth * 10 }
                ]
              }
            ]}
          >
            <View style={styles.gridContent}>
              <Text style={styles.gridText}>{pos.name}</Text>
              <View style={styles.gridLines}>
                {/* Render perspective grid lines */}
                {[...Array(3)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.gridLine,
                      {
                        transform: [
                          { scale: 1 - (i * 0.2) },
                          { translateY: i * 5 }
                        ]
                      }
                    ]}
                  />
                ))}
              </View>
            </View>
          </Marker>
        </View>
      );
    });
  };

  const startRecording = async () => {
    try {
      if (!cameraRef.current) return;

      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingTimer(setInterval(updateRecordingDuration, 1000));

      // Create a unique filename in the Movies directory
      const fileName = `Circle_Recording_${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`;
      const moviesDir = `${FileSystem.documentDirectory}Movies/`;
      
      // Ensure Movies directory exists
      const dirInfo = await FileSystem.getInfoAsync(moviesDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(moviesDir, { intermediates: true });
      }

      const video = await cameraRef.current.recordAsync({
        quality: Camera.Constants.VideoQuality['720p'],
        maxDuration: 3600, // 1 hour max
        skipProcessing: true,
      });

      // Move the recorded video to the Movies directory
      const destinationUri = `${moviesDir}${fileName}`;
      await FileSystem.moveAsync({
        from: video.uri,
        to: destinationUri
      });

      setRecordingUri(destinationUri);
      Alert.alert(
        'Recording Complete',
        'Would you like to share this video?',
        [
          {
            text: 'Share',
            onPress: () => shareToWhatsApp(destinationUri)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    } finally {
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setRecordingDuration(0);
    }
  };

  const updateRecordingDuration = () => {
    const duration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
    setRecordingDuration(duration);
  };

  const shareToWhatsApp = async (videoUri) => {
    try {
      // Check if WhatsApp is installed
      const isWhatsAppInstalled = await Linking.canOpenURL('whatsapp://send');
      
      if (!isWhatsAppInstalled) {
        Alert.alert(
          'WhatsApp Not Installed',
          'Please install WhatsApp to share videos',
          [{ text: 'OK' }]
        );
        return;
      }

      // Share the video directly from the Movies directory
      await Sharing.shareAsync(videoUri, {
        mimeType: 'video/mp4',
        dialogTitle: 'Share to WhatsApp',
        UTI: 'public.movie'
      });
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      Alert.alert('Error', 'Failed to share video to WhatsApp');
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Position System</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Device Location:</Text>
          <Text style={styles.value}>
            {deviceLocation ? 
              `Lat: ${deviceLocation.coords.latitude.toFixed(6)}, 
               Long: ${deviceLocation.coords.longitude.toFixed(6)}` : 
              'Loading...'}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Device Orientation:</Text>
          <Text style={styles.value}>
            X: {orientation.x.toFixed(2)}, 
            Y: {orientation.y.toFixed(2)}, 
            Z: {orientation.z.toFixed(2)}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Zoom Level:</Text>
          <Text style={styles.value}>{zoomLevel.toFixed(2)}x</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Camera Points:</Text>
          <Text style={styles.value}>{cameraPoints.length} points recorded</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, isStreaming ? styles.stopButton : styles.startButton]} 
          onPress={isStreaming ? stopStreaming : startStreaming}
        >
          <Text style={styles.buttonText}>
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={toggleCamera}>
          <Text style={styles.buttonText}>
            Switch to {isFrontCamera ? 'Back' : 'Front'} Camera
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.vrButton]} onPress={viewInVR}>
          <Text style={styles.buttonText}>View in VR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.button, 
            isRecording ? styles.recordingButton : styles.recordButton
          ]} 
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? `Stop Recording (${recordingDuration} seconds)` : 'Start Recording'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={isFrontCamera ? Camera.Constants.Type.front : Camera.Constants.Type.back}
          onZoomChanged={handleZoomChange}
        >
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>{recordingDuration} seconds</Text>
            </View>
          )}
        </Camera>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: deviceLocation?.coords.latitude || 0,
            longitude: deviceLocation?.coords.longitude || 0,
            latitudeDelta: 0.0002,
            longitudeDelta: 0.0002,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {renderGrid()}
        </MapView>
      </View>

      <View style={styles.controlPanel}>
        <Text style={styles.title}>PosSys Continuom</Text>
        <View style={styles.accelerometerInfo}>
          <Text style={styles.accelerometerText}>
            Device Orientation: {Math.round(accelerometerData.z * 100)}%
          </Text>
        </View>
        <View style={styles.grid}>
          {Continuom.map((pos) => (
            <TouchableOpacity
              key={pos.id}
              style={[
                styles.positionButton,
                selectedPosition?.id === pos.id && styles.selectedButton,
              ]}
              onPress={() => handlePositionSelect(pos)}
            >
              <Text style={[
                styles.buttonText,
                selectedPosition?.id === pos.id && styles.selectedButtonText,
              ]}>
                {pos.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Share Button */}
        <TouchableOpacity
          style={[
            styles.shareButton,
            isSharing && styles.sharingButton
          ]}
          onPress={isSharing ? stopSharing : handleShare}
        >
          <Text style={styles.buttonText}>
            {isSharing ? 'Stop Sharing' : 'Share Position'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  controls: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  vrButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    height: 300,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  controlPanel: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accelerometerInfo: {
    marginBottom: 15,
  },
  accelerometerText: {
    fontSize: 14,
    color: '#333',
  },
  grid: {
    marginBottom: 15,
  },
  positionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  selectedButtonText: {
    color: '#fff',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  sharingButton: {
    backgroundColor: '#f44336',
  },
  gridContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridMarker: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  gridLines: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '50%',
    left: 0,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
  },
  recordingButton: {
    backgroundColor: '#ff4444',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f44336',
    marginRight: 5,
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingDuration: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
}); 