import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Switch, Slider, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vrdService } from '../services/vrd/VRDService';

const VRDSettings = ({ onClose }) => {
  const [settings, setSettings] = useState({
    sensitivity: 0.1,
    gestureThreshold: 1.5,
    hapticFeedback: true,
    batteryWarning: 20,
    updateInterval: 16,
    rotationThreshold: 45,
    accelerationThreshold: 2.0,
    velocityThreshold: 1.0,
    gestureHistorySize: 10,
    complexGestureTimeout: 1000,
    visualFeedback: true,
    glowIntensity: 0.5,
    calibrationAuto: true,
    gestureTextDisplay: true,
    recordingBufferSize: 1000,
    playbackSpeed: 1.0,
    calibrationInterval: 300000,
    calibrationType: 'full',
    calibrationDuration: 1000,
    calibrationSamples: 10
  });

  const [recordedGestures, setRecordedGestures] = useState([]);
  const [newGestureName, setNewGestureName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGesture, setCurrentGesture] = useState(null);

  useEffect(() => {
    loadSettings();
    loadRecordedGestures();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('vrdSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load VRD settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('vrdSettings', JSON.stringify(settings));
      vrdService.updateSettings(settings);
    } catch (error) {
      console.error('Failed to save VRD settings:', error);
    }
  };

  const loadRecordedGestures = async () => {
    try {
      const savedGestures = await AsyncStorage.getItem('vrdRecordedGestures');
      if (savedGestures) {
        setRecordedGestures(JSON.parse(savedGestures));
      }
    } catch (error) {
      console.error('Failed to load recorded gestures:', error);
    }
  };

  const saveRecordedGestures = async (gestures) => {
    try {
      await AsyncStorage.setItem('vrdRecordedGestures', JSON.stringify(gestures));
      setRecordedGestures(gestures);
    } catch (error) {
      console.error('Failed to save recorded gestures:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      saveSettings();
      return newSettings;
    });
  };

  const handleCalibrate = async (type = settings.calibrationType) => {
    await vrdService.calibrate({
      type,
      duration: settings.calibrationDuration,
      samples: settings.calibrationSamples
    });
  };

  const handleStartRecording = () => {
    if (!newGestureName) return;
    
    const success = vrdService.startRecording(newGestureName);
    if (success) {
      setIsRecording(true);
      setCurrentGesture(newGestureName);
    }
  };

  const handleStopRecording = () => {
    const result = vrdService.stopRecording();
    if (result) {
      setIsRecording(false);
      const newGestures = [...recordedGestures, result.gestureName];
      saveRecordedGestures(newGestures);
      setNewGestureName('');
    }
  };

  const handlePlayGesture = (gestureName) => {
    if (isPlaying) {
      vrdService.stopPlayback();
    } else {
      vrdService.playGesture(gestureName, {
        speed: settings.playbackSpeed
      });
    }
    setIsPlaying(!isPlaying);
    setCurrentGesture(gestureName);
  };

  const handleDeleteGesture = (gestureName) => {
    const newGestures = recordedGestures.filter(g => g !== gestureName);
    saveRecordedGestures(newGestures);
    vrdService.recordedGestures.delete(gestureName);
  };

  const renderSetting = (key, label, type = 'slider', min = 0, max = 1, step = 0.1) => {
    switch (type) {
      case 'switch':
        return (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Switch
              value={settings[key]}
              onValueChange={(value) => handleSettingChange(key, value)}
            />
          </View>
        );
      case 'slider':
        return (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Slider
              style={styles.slider}
              value={settings[key]}
              onValueChange={(value) => handleSettingChange(key, value)}
              minimumValue={min}
              maximumValue={max}
              step={step}
            />
            <Text style={styles.settingValue}>{settings[key].toFixed(1)}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const handleResetDefaults = () => {
    const defaultSettings = {
      sensitivity: 0.1,
      gestureThreshold: 1.5,
      hapticFeedback: true,
      batteryWarning: 20,
      updateInterval: 16,
      rotationThreshold: 45,
      accelerationThreshold: 2.0,
      velocityThreshold: 1.0,
      gestureHistorySize: 10,
      complexGestureTimeout: 1000,
      visualFeedback: true,
      glowIntensity: 0.5,
      calibrationAuto: true,
      gestureTextDisplay: true,
      recordingBufferSize: 1000,
      playbackSpeed: 1.0,
      calibrationInterval: 300000,
      calibrationType: 'full',
      calibrationDuration: 1000,
      calibrationSamples: 10
    };
    setSettings(defaultSettings);
    saveSettings();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VRD Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Settings</Text>
        {renderSetting('sensitivity', 'Sensitivity', 'slider', 0, 0.5)}
        {renderSetting('updateInterval', 'Update Interval (ms)', 'slider', 8, 32, 1)}
        {renderSetting('hapticFeedback', 'Haptic Feedback', 'switch')}
        {renderSetting('visualFeedback', 'Visual Feedback', 'switch')}
        {renderSetting('gestureTextDisplay', 'Show Gesture Text', 'switch')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gesture Settings</Text>
        {renderSetting('gestureThreshold', 'Gesture Threshold', 'slider', 0.5, 3)}
        {renderSetting('rotationThreshold', 'Rotation Threshold (°)', 'slider', 15, 90, 1)}
        {renderSetting('accelerationThreshold', 'Acceleration Threshold', 'slider', 1, 5)}
        {renderSetting('velocityThreshold', 'Velocity Threshold', 'slider', 0.5, 3)}
        {renderSetting('gestureHistorySize', 'Gesture History Size', 'slider', 5, 20, 1)}
        {renderSetting('complexGestureTimeout', 'Complex Gesture Timeout (ms)', 'slider', 500, 2000, 100)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visual Settings</Text>
        {renderSetting('glowIntensity', 'Glow Intensity', 'slider', 0, 1)}
        {renderSetting('batteryWarning', 'Battery Warning (%)', 'slider', 5, 30, 1)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calibration</Text>
        {renderSetting('calibrationAuto', 'Auto Calibration', 'switch')}
        {renderSetting('calibrationInterval', 'Calibration Interval (ms)', 'slider', 60000, 600000, 60000)}
        <View style={styles.calibrationTypeContainer}>
          <Text style={styles.settingLabel}>Calibration Type</Text>
          <View style={styles.calibrationTypeButtons}>
            <TouchableOpacity
              style={[
                styles.calibrationTypeButton,
                settings.calibrationType === 'quick' && styles.calibrationTypeButtonActive
              ]}
              onPress={() => handleSettingChange('calibrationType', 'quick')}
            >
              <Text style={styles.calibrationTypeButtonText}>Quick</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.calibrationTypeButton,
                settings.calibrationType === 'full' && styles.calibrationTypeButtonActive
              ]}
              onPress={() => handleSettingChange('calibrationType', 'full')}
            >
              <Text style={styles.calibrationTypeButtonText}>Full</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.calibrationTypeButton,
                settings.calibrationType === 'dynamic' && styles.calibrationTypeButtonActive
              ]}
              onPress={() => handleSettingChange('calibrationType', 'dynamic')}
            >
              <Text style={styles.calibrationTypeButtonText}>Dynamic</Text>
            </TouchableOpacity>
          </View>
        </View>
        {settings.calibrationType === 'full' && (
          <>
            {renderSetting('calibrationDuration', 'Calibration Duration (ms)', 'slider', 500, 5000, 100)}
            {renderSetting('calibrationSamples', 'Calibration Samples', 'slider', 5, 50, 1)}
          </>
        )}
        <TouchableOpacity 
          style={styles.calibrateButton}
          onPress={() => handleCalibrate()}
        >
          <Text style={styles.calibrateButtonText}>Calibrate Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gesture Recording</Text>
        <View style={styles.recordingContainer}>
          <TextInput
            style={styles.gestureNameInput}
            placeholder="Gesture Name"
            placeholderTextColor="#666"
            value={newGestureName}
            onChangeText={setNewGestureName}
          />
          {!isRecording ? (
            <TouchableOpacity
              style={styles.recordButton}
              onPress={handleStartRecording}
            >
              <Text style={styles.recordButtonText}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.recordButton, styles.stopButton]}
              onPress={handleStopRecording}
            >
              <Text style={styles.recordButtonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}
        </View>
        {renderSetting('recordingBufferSize', 'Recording Buffer Size', 'slider', 100, 5000, 100)}
        {renderSetting('playbackSpeed', 'Playback Speed', 'slider', 0.5, 2, 0.1)}
        
        <Text style={styles.sectionSubtitle}>Recorded Gestures</Text>
        {recordedGestures.map((gestureName) => (
          <View key={gestureName} style={styles.recordedGestureRow}>
            <Text style={styles.recordedGestureName}>{gestureName}</Text>
            <View style={styles.recordedGestureActions}>
              <TouchableOpacity
                style={[
                  styles.playButton,
                  isPlaying && currentGesture === gestureName && styles.playButtonActive
                ]}
                onPress={() => handlePlayGesture(gestureName)}
              >
                <Text style={styles.playButtonText}>
                  {isPlaying && currentGesture === gestureName ? 'Stop' : 'Play'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteGesture(gestureName)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.resetButton}
        onPress={handleResetDefaults}
      >
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 10
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  sectionSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1
  },
  slider: {
    flex: 2,
    marginHorizontal: 10
  },
  settingValue: {
    color: '#fff',
    fontSize: 14,
    width: 40,
    textAlign: 'right'
  },
  calibrationTypeContainer: {
    marginBottom: 15
  },
  calibrationTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  calibrationTypeButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    alignItems: 'center'
  },
  calibrationTypeButtonActive: {
    backgroundColor: 'rgba(0, 150, 255, 0.8)'
  },
  calibrationTypeButtonText: {
    color: '#fff',
    fontSize: 14
  },
  calibrateButton: {
    backgroundColor: 'rgba(0, 150, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  calibrateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  gestureNameInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    padding: 8,
    color: '#fff',
    marginRight: 10
  },
  recordButton: {
    backgroundColor: 'rgba(0, 150, 255, 0.8)',
    padding: 8,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center'
  },
  stopButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)'
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  recordedGestureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5
  },
  recordedGestureName: {
    color: '#fff',
    fontSize: 14
  },
  recordedGestureActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  playButton: {
    backgroundColor: 'rgba(0, 150, 255, 0.8)',
    padding: 5,
    borderRadius: 5,
    marginRight: 10,
    minWidth: 60,
    alignItems: 'center'
  },
  playButtonActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)'
  },
  playButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 5,
    borderRadius: 5,
    minWidth: 60,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16
  }
});

export default VRDSettings; 