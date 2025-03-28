import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { Accelerometer } from 'expo-sensors';

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
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const mapRef = useRef(null);
  const subscription = useRef(null);

  useEffect(() => {
    // Get initial device location
    Geolocation.getCurrentPosition(
      (position) => {
        setDeviceLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => Alert.alert('Error', error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );

    // Start accelerometer subscription
    subscription.current = Accelerometer.addListener(data => {
      setAccelerometerData(data);
    });

    // Set accelerometer update interval
    Accelerometer.setUpdateInterval(1000);

    return () => {
      if (subscription.current) {
        subscription.current.remove();
      }
    };
  }, []);

  // Convert Continuom coordinates to map coordinates
  const getMapCoordinates = (position) => {
    if (!deviceLocation) return null;

    // Calculate offset based on Continuom position
    const latOffset = position.north ? 0.0001 : -0.0001; // Smaller offset for more precise positioning
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

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
    const coordinates = getMapCoordinates(position);
    
    if (coordinates) {
      mapRef.current?.animateToRegion(coordinates, 1000);
    }
  };

  if (!deviceLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: deviceLocation.latitude,
          longitude: deviceLocation.longitude,
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  accelerometerInfo: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  accelerometerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  positionButton: {
    width: '48%',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedButtonText: {
    color: '#fff',
  },
}); 