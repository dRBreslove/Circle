import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Text, TouchableOpacity, Vibration, AsyncStorage } from 'react-native';
import { AUTO_SYNC } from '../utils/continuom/constants';
import { autoSyncService } from '../services/sync/AutoSyncService';
import CameraPreview from './CameraPreview';
import SyncTutorial from './SyncTutorial';
import SyncSettings from './SyncSettings';
import SyncHistory from './SyncHistory';
import { detectAlignment } from '../utils/vision';

const SyncOverlay = ({ onSyncSuccess }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    mainDisplay: { x: 0.5, y: 0.5 },
    floatingFrame: { x: 0.5, y: 0.5 }
  });
  const [alignment, setAlignment] = useState({
    horizontal: 0,
    vertical: 0,
    distance: 0,
    isAligned: false
  });
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [quickSyncMode, setQuickSyncMode] = useState(false);
  const [syncHistory, setSyncHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [settings, setSettings] = useState({
    sensitivity: 0.1,
    alignmentThreshold: 0.2,
    distanceRange: { min: 20, max: 80 },
    hapticFeedback: true,
    soundEffects: true,
    quickSyncEnabled: true,
    debugMode: false
  });
  const dotAnimation = new Animated.Value(0);
  const progressAnimation = new Animated.Value(0);
  const successAnimation = new Animated.Value(0);

  useEffect(() => {
    checkFirstTime();
    loadSettings();
    initializeSync();
    return () => {
      autoSyncService.cleanup();
    };
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenSyncTutorial');
      setShowTutorial(!hasSeenTutorial);
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
  };

  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenSyncTutorial', 'true');
      setShowTutorial(false);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
    }
  };

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

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const initializeSync = async () => {
    try {
      await autoSyncService.initialize();
      setIsInitialized(true);
      startDotAnimation();
      startProgressAnimation();
      loadSyncHistory();
    } catch (error) {
      setError('Failed to initialize sync. Please check camera and accelerometer permissions.');
      console.error('Failed to initialize sync:', error);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('syncHistory');
      if (history) {
        setSyncHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

  const saveSyncHistory = async (syncData) => {
    try {
      const newHistory = [syncData, ...syncHistory.slice(0, 4)];
      await AsyncStorage.setItem('syncHistory', JSON.stringify(newHistory));
      setSyncHistory(newHistory);
    } catch (error) {
      console.error('Error saving sync history:', error);
    }
  };

  const startDotAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(dotAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const startProgressAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const playSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start(() => {
      setShowSuccess(false);
    });
  };

  const handleAlignmentChange = async (newAlignment) => {
    if (settings.debugMode) {
      console.log('Alignment Update:', newAlignment);
    }

    setAlignment(newAlignment);
    
    if (newAlignment.syncComplete) {
      handleSyncSuccess();
      return;
    }

    // Update dot positions based on alignment and sensitivity
    const sensitivity = settings.sensitivity;
    const newX = Math.max(0, Math.min(1, 0.5 + newAlignment.horizontal * sensitivity));
    const newY = Math.max(0, Math.min(1, 0.5 + newAlignment.vertical * sensitivity));
    
    setSyncStatus(prev => ({
      ...prev,
      mainDisplay: { x: newX, y: newY },
      floatingFrame: { x: newX, y: newY }
    }));

    // Provide haptic feedback based on alignment progress
    if (settings.hapticFeedback) {
      const alignmentQuality = Math.abs(newAlignment.horizontal) + Math.abs(newAlignment.vertical);
      if (alignmentQuality < 0.1) {
        Vibration.vibrate(50);
      }
    }
  };

  const handleSyncSuccess = () => {
    if (settings.hapticFeedback) {
      Vibration.vibrate([0, 50, 0, 50]);
    }
    setShowSuccess(true);
    playSuccessAnimation();

    // Save sync history
    const syncData = {
      timestamp: new Date().toISOString(),
      alignment: alignment,
      duration: quickSyncMode ? 'quick' : 'standard'
    };
    saveSyncHistory(syncData);

    setTimeout(() => {
      onSyncSuccess();
    }, 1000);
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    initializeSync();
  };

  const toggleQuickSync = () => {
    if (!settings.quickSyncEnabled) {
      setError('Quick sync mode is disabled in settings');
      return;
    }
    setQuickSyncMode(!quickSyncMode);
    if (quickSyncMode) {
      setShowCamera(true);
    } else {
      setShowCamera(false);
      handleAlignmentChange({
        horizontal: 0,
        vertical: 0,
        distance: 50,
        isAligned: true,
        syncComplete: true
      });
    }
  };

  const renderDot = (displayType) => {
    const dotStyle = {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: AUTO_SYNC.DOT_COLORS.DOT,
      transform: [
        {
          scale: dotAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.2]
          })
        }
      ]
    };

    return (
      <Animated.View
        style={[
          dotStyle,
          {
            left: `${syncStatus[displayType].x * 100}%`,
            top: `${syncStatus[displayType].y * 100}%`
          }
        ]}
      />
    );
  };

  const renderProgressBar = () => {
    const progress = progressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progress }
            ]}
          />
        </View>
      </View>
    );
  };

  const renderSuccessOverlay = () => {
    if (!showSuccess) return null;

    const scale = successAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1]
    });

    return (
      <Animated.View style={[styles.successOverlay, { transform: [{ scale }] }]}>
        <Text style={styles.successText}>Sync Complete!</Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {showTutorial && (
        <SyncTutorial onComplete={handleTutorialComplete} />
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Main Display */}
          <View style={styles.mainDisplay}>
            <View style={styles.background}>
              {renderDot('mainDisplay')}
            </View>
          </View>

          {/* Floating Frame */}
          <View style={styles.floatingFrame}>
            <View style={styles.background}>
              {renderDot('floatingFrame')}
            </View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={[styles.controlButton, quickSyncMode && styles.controlButtonActive]}
              onPress={toggleQuickSync}
            >
              <Text style={styles.controlButtonText}>
                {quickSyncMode ? 'Quick Sync On' : 'Quick Sync Off'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowCamera(!showCamera)}
            >
              <Text style={styles.controlButtonText}>
                {showCamera ? 'Hide Camera' : 'Show Camera'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.controlButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowHistory(true)}
            >
              <Text style={styles.controlButtonText}>History</Text>
            </TouchableOpacity>
          </View>

          {/* Camera Preview */}
          {showCamera && (
            <View style={styles.cameraContainer}>
              <CameraPreview 
                onAlignmentChange={handleAlignmentChange}
                settings={settings}
              />
            </View>
          )}

          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Alignment Info */}
          <View style={styles.alignmentInfo}>
            <Text style={styles.alignmentText}>
              Distance: {Math.round(alignment.distance)}cm
            </Text>
            <Text style={styles.alignmentText}>
              Alignment: {Math.round(Math.abs(alignment.horizontal) * 100)}%
            </Text>
            {quickSyncMode && (
              <Text style={styles.quickSyncIndicator}>Quick Sync Mode</Text>
            )}
            {settings.debugMode && (
              <Text style={styles.debugText}>
                Debug Mode Active
              </Text>
            )}
          </View>

          {/* Success Overlay */}
          {renderSuccessOverlay()}

          {/* Settings Modal */}
          <SyncSettings
            visible={showSettings}
            onClose={() => setShowSettings(false)}
            onSettingsChange={handleSettingsChange}
          />

          {/* History Modal */}
          <SyncHistory
            visible={showHistory}
            onClose={() => setShowHistory(false)}
            history={syncHistory}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000
  },
  mainDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  floatingFrame: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden'
  },
  background: {
    flex: 1,
    backgroundColor: AUTO_SYNC.DOT_COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001
  },
  cameraToggle: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5
  },
  cameraToggleText: {
    color: '#FFF',
    fontSize: 16
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2
  },
  progressBar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 2
  },
  alignmentInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5
  },
  alignmentText: {
    color: '#FFF',
    fontSize: 14
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 5
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002
  },
  successText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  quickSyncButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5
  },
  quickSyncActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)'
  },
  quickSyncText: {
    color: '#FFF',
    fontSize: 16
  },
  quickSyncIndicator: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5
  },
  controlButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5
  },
  controlButton: {
    padding: 10,
    borderRadius: 5
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)'
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 14
  },
  debugText: {
    color: '#FF0000',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5
  }
});

export default SyncOverlay; 