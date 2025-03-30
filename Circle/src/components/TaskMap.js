import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

const TaskMap = ({ tasks, onTaskPress, initialRegion = null }) => {
  const [region, setRegion] = useState(initialRegion);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      if (!initialRegion) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, [initialRegion]);

  const getMarkerColor = (task) => {
    switch (task.status) {
      case 'pending':
        return '#FFA500';
      case 'assigned':
        return '#2196F3';
      case 'in_progress':
        return '#4CAF50';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderMarker = (task) => (
    <Marker
      key={task.id}
      coordinate={{
        latitude: task.location.latitude,
        longitude: task.location.longitude,
      }}
      pinColor={getMarkerColor(task)}
      onPress={() => onTaskPress(task)}
    >
      <Callout>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{task.title}</Text>
          <Text style={styles.calloutBudget}>${task.budget}</Text>
          <TouchableOpacity
            style={styles.calloutButton}
            onPress={() => onTaskPress(task)}
          >
            <Text style={styles.calloutButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </Callout>
    </Marker>
  );

  const renderCurrentLocationButton = () => (
    <TouchableOpacity
      style={styles.currentLocationButton}
      onPress={async () => {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        } catch (error) {
          Alert.alert('Error', 'Failed to get current location');
        }
      }}
    >
      <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {tasks.map(renderMarker)}
      </MapView>
      {renderCurrentLocationButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  calloutBudget: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
});

export default TaskMap; 