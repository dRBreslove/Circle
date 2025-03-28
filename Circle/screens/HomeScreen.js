import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function HomeScreen({ navigation }) {
  const handleCreateCircle = () => {
    navigation.navigate('FaceScan', { mode: 'create' });
  };

  const handleJoinCircle = () => {
    navigation.navigate('FaceScan', { mode: 'join' });
  };

  const handlePosSys = () => {
    navigation.navigate('PosSys');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Circle</Text>
      <Text style={styles.subtitle}>Create or join a secure circle</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleCreateCircle}
      >
        <Text style={styles.buttonText}>Create New Circle</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.joinButton]}
        onPress={handleJoinCircle}
      >
        <Text style={styles.buttonText}>Join Existing Circle</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.posSysButton]}
        onPress={handlePosSys}
      >
        <Text style={styles.buttonText}>Position System</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    width: '80%',
  },
  joinButton: {
    backgroundColor: '#34C759',
  },
  posSysButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 