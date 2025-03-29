import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Slider, Switch, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SyncSettings = ({ visible, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState({
    sensitivity: 0.1,
    alignmentThreshold: 0.2,
    distanceRange: {
      min: 20,
      max: 80
    },
    hapticFeedback: true,
    soundEffects: true,
    quickSyncEnabled: true,
    debugMode: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('syncSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('syncSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      onSettingsChange(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleDistanceRangeChange = (type, value) => {
    const newSettings = {
      ...settings,
      distanceRange: {
        ...settings.distanceRange,
        [type]: value
      }
    };
    saveSettings(newSettings);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.settingsContainer}>
          <Text style={styles.title}>Sync Settings</Text>
          
          {/* Sensitivity */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sensitivity</Text>
            <Slider
              style={styles.slider}
              value={settings.sensitivity}
              onValueChange={(value) => handleSettingChange('sensitivity', value)}
              minimumValue={0.05}
              maximumValue={0.2}
              step={0.01}
            />
            <Text style={styles.settingValue}>{Math.round(settings.sensitivity * 100)}%</Text>
          </View>

          {/* Alignment Threshold */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Alignment Threshold</Text>
            <Slider
              style={styles.slider}
              value={settings.alignmentThreshold}
              onValueChange={(value) => handleSettingChange('alignmentThreshold', value)}
              minimumValue={0.1}
              maximumValue={0.5}
              step={0.05}
            />
            <Text style={styles.settingValue}>{Math.round(settings.alignmentThreshold * 100)}%</Text>
          </View>

          {/* Distance Range */}
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>Distance Range (cm)</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Min</Text>
              <Slider
                style={styles.slider}
                value={settings.distanceRange.min}
                onValueChange={(value) => handleDistanceRangeChange('min', value)}
                minimumValue={10}
                maximumValue={50}
                step={1}
              />
              <Text style={styles.settingValue}>{settings.distanceRange.min}</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Max</Text>
              <Slider
                style={styles.slider}
                value={settings.distanceRange.max}
                onValueChange={(value) => handleDistanceRangeChange('max', value)}
                minimumValue={50}
                maximumValue={100}
                step={1}
              />
              <Text style={styles.settingValue}>{settings.distanceRange.max}</Text>
            </View>
          </View>

          {/* Toggle Settings */}
          <View style={styles.settingSection}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(value) => handleSettingChange('hapticFeedback', value)}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Switch
                value={settings.soundEffects}
                onValueChange={(value) => handleSettingChange('soundEffects', value)}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Quick Sync Mode</Text>
              <Switch
                value={settings.quickSyncEnabled}
                onValueChange={(value) => handleSettingChange('quickSyncEnabled', value)}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Debug Mode</Text>
              <Switch
                value={settings.debugMode}
                onValueChange={(value) => handleSettingChange('debugMode', value)}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  settingSection: {
    marginVertical: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  settingLabel: {
    flex: 1,
    fontSize: 16
  },
  slider: {
    flex: 2,
    marginHorizontal: 10
  },
  settingValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 14
  },
  closeButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default SyncSettings; 