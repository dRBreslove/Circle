import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VRD from './VRD';
import VRDSettings from './VRDSettings';
import VRDTutorial from './VRDTutorial';

const VRDContainer = ({ onGesture, onPositionUpdate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  const checkTutorialStatus = async () => {
    try {
      const tutorialCompleted = await AsyncStorage.getItem('vrdTutorialCompleted');
      if (!tutorialCompleted) {
        setShowTutorial(true);
      }
    } catch (error) {
      console.error('Failed to check tutorial status:', error);
    }
  };

  const handleGesture = (gesture) => {
    onGesture?.(gesture);
  };

  const handlePositionUpdate = (data) => {
    onPositionUpdate?.(data);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setIsActive(true);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <View style={styles.container}>
      {isActive && (
        <VRD
          onGesture={handleGesture}
          onPositionUpdate={handlePositionUpdate}
          style={styles.vrd}
        />
      )}

      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={toggleSettings}
      >
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </TouchableOpacity>

      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={toggleSettings}
      >
        <View style={styles.modalContainer}>
          <VRDSettings onClose={toggleSettings} />
        </View>
      </Modal>

      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTutorial(false)}
      >
        <VRDTutorial onComplete={handleTutorialComplete} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100
  },
  vrd: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }]
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 150, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  settingsButtonText: {
    fontSize: 20
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  }
});

export default VRDContainer; 