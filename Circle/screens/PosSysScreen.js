import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { Accelerometer } from 'expo-sensors';
import { useNavigation } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { WebSocket } from 'react-native-websocket';

const { width } = Dimensions.get('window');

// Continuom coordinate system
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
    const baseX = position.west ? 0 : gridSize / 2;
    const baseY = position.north ? 0 : gridSize / 2;
    const baseZ = position.up ? 0 : gridSize / 2;
    
    // Generate pixel data based on position
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          // Calculate color based on position and distance from center
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - gridSize/2, 2) + 
            Math.pow(y - gridSize/2, 2) + 
            Math.pow(z - gridSize/2, 2)
          );
          
          // Create color gradient based on position
          const r = Math.floor((x / gridSize) * 255);
          const g = Math.floor((y / gridSize) * 255);
          const b = Math.floor((z / gridSize) * 255);
          
          pixels.push({
            x: x - baseX,
            y: y - baseY,
            z: z - baseZ,
            color: `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`,
            intensity: 1 - (distanceFromCenter / (gridSize/2))
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
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={isFrontCamera ? Camera.Constants.Type.front : Camera.Constants.Type.back}
          onZoomChanged={handleZoomChange}
        />
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
          {Continuom.map((pos) => {
            const coordinates = getMapCoordinates(pos);
            if (!coordinates) return null;
            
            return (
              <Marker
                key={pos.id}
                coordinate={coordinates}
                title={pos.name}
                pinColor={selectedPosition?.id === pos.id ? '#007AFF' : '#FF3B30'}
                onPress={() => handlePositionSelect(pos)}
              />
            );
          })}
        </MapView>
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
}); 