import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Vibration, Easing } from 'react-native';
import { vrdService } from '../services/vrd/VRDService';

const VRD = ({ onGesture, onPositionUpdate, style }) => {
  const [isActive, setIsActive] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [calibrationStatus, setCalibrationStatus] = useState(null);
  
  const positionAnim = useRef(new Animated.ValueXY()).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const gestureTextAnim = useRef(new Animated.Value(0)).current;
  const recordingIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeVRD();
    return () => cleanup();
  }, []);

  const initializeVRD = async () => {
    const success = await vrdService.initialize();
    if (success) {
      setIsActive(true);
      vrdService.addListener(handleVRDUpdate);
      startBatteryMonitoring();
      calibrate();
    }
  };

  const cleanup = () => {
    vrdService.removeListener(handleVRDUpdate);
    vrdService.cleanup();
    setIsActive(false);
  };

  const startBatteryMonitoring = () => {
    const interval = setInterval(() => {
      setBatteryLevel(prev => Math.max(0, prev - 0.1));
      if (batteryLevel <= 20) {
        Vibration.vibrate([0, 100, 50, 100]);
        animateGlow(1, 'red');
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const calibrate = async (type = 'full') => {
    setIsCalibrating(true);
    setCalibrationStatus('Starting calibration...');
    
    try {
      const success = await vrdService.calibrate({ type });
      if (success) {
        setCalibrationStatus('Calibration complete');
        animateGlow(0.5, '#00ff00');
      } else {
        setCalibrationStatus('Calibration failed');
        animateGlow(1, 'red');
      }
    } catch (error) {
      setCalibrationStatus('Calibration error');
      animateGlow(1, 'red');
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleVRDUpdate = (event) => {
    switch (event.type) {
      case 'position':
        handlePositionUpdate(event.data);
        break;
      case 'gesture':
        handleGesture(event.data);
        break;
      case 'complexGesture':
        handleComplexGesture(event.data);
        break;
      case 'calibrationStart':
        setCalibrationStatus('Calibrating...');
        break;
      case 'calibrationComplete':
        setCalibrationStatus('Calibration complete');
        animateGlow(0.5, '#00ff00');
        break;
      case 'calibrationError':
        setCalibrationStatus('Calibration error');
        animateGlow(1, 'red');
        break;
      case 'recordingStart':
        setIsRecording(true);
        setCurrentRecording(event.data.gestureName);
        animateRecordingIndicator();
        break;
      case 'recordingComplete':
        setIsRecording(false);
        setCurrentRecording(null);
        stopRecordingAnimation();
        break;
      case 'playbackStart':
        setIsPlaying(true);
        setCurrentRecording(event.data.gestureName);
        break;
      case 'playbackStop':
        setIsPlaying(false);
        setCurrentRecording(null);
        break;
    }
  };

  const handlePositionUpdate = (data) => {
    const { position, rotation, acceleration } = data;
    
    // Animate position with spring physics
    Animated.spring(positionAnim, {
      toValue: {
        x: position.x * 100,
        y: position.y * 100
      },
      useNativeDriver: true
    }).start();

    // Animate rotation with spring physics
    Animated.spring(rotationAnim, {
      toValue: rotation.yaw,
      useNativeDriver: true
    }).start();

    // Scale based on acceleration
    const accelerationMagnitude = Math.sqrt(
      Math.pow(acceleration.x, 2) +
      Math.pow(acceleration.y, 2) +
      Math.pow(acceleration.z, 2)
    );
    
    Animated.spring(scaleAnim, {
      toValue: 1 + (accelerationMagnitude * 0.1),
      useNativeDriver: true
    }).start();

    // Notify parent component
    onPositionUpdate?.(data);
  };

  const handleGesture = (gesture) => {
    setCurrentGesture(gesture);
    Vibration.vibrate(50);
    animateGestureText(gesture);
    onGesture?.(gesture);
  };

  const handleComplexGesture = (gesture) => {
    setCurrentGesture(gesture);
    Vibration.vibrate([0, 100, 50, 100]);
    animateGestureText(gesture);
    onGesture?.(gesture);
  };

  const animateGestureText = (gesture) => {
    gestureTextAnim.setValue(1);
    Animated.sequence([
      Animated.timing(gestureTextAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.delay(1000),
      Animated.timing(gestureTextAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  const animateGlow = (intensity, color) => {
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: intensity,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.delay(500),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  const animateRecordingIndicator = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingIndicatorAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(recordingIndicatorAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const stopRecordingAnimation = () => {
    recordingIndicatorAnim.setValue(0);
  };

  const renderVRD = () => {
    const animatedStyle = {
      transform: [
        { translateX: positionAnim.x },
        { translateY: positionAnim.y },
        { rotate: rotationAnim.interpolate({
          inputRange: [-180, 180],
          outputRange: ['-180deg', '180deg']
        })},
        { scale: scaleAnim }
      ]
    };

    const glowStyle = {
      shadowColor: '#00ff00',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: glowAnim,
      shadowRadius: 20,
      elevation: 5
    };

    return (
      <View style={styles.container}>
        <Animated.View style={[styles.vrdContainer, animatedStyle, glowStyle, style]}>
          <View style={styles.vrdBody}>
            <View style={styles.vrdIndicator} />
            <Text style={styles.batteryText}>{Math.round(batteryLevel)}%</Text>
          </View>
        </Animated.View>
        {currentGesture && (
          <Animated.View style={[styles.gestureTextContainer, { opacity: gestureTextAnim }]}>
            <Text style={styles.gestureText}>{currentGesture}</Text>
          </Animated.View>
        )}
        {isCalibrating && (
          <View style={styles.calibratingContainer}>
            <Text style={styles.calibratingText}>{calibrationStatus}</Text>
          </View>
        )}
        {isRecording && (
          <Animated.View style={[styles.recordingContainer, { opacity: recordingIndicatorAnim }]}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.recordingText}>Recording: {currentRecording}</Text>
          </Animated.View>
        )}
        {isPlaying && (
          <View style={styles.playingContainer}>
            <Text style={styles.playingText}>Playing: {currentRecording}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isActive ? renderVRD() : (
        <TouchableOpacity 
          style={styles.activateButton}
          onPress={initializeVRD}
        >
          <Text style={styles.activateButtonText}>Activate VRD</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  vrdContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  vrdBody: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 150, 255, 0.8)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  vrdIndicator: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10
  },
  batteryText: {
    position: 'absolute',
    bottom: -20,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  gestureTextContainer: {
    position: 'absolute',
    top: -40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15
  },
  gestureText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  calibratingContainer: {
    position: 'absolute',
    top: -60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  calibratingText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold'
  },
  recordingContainer: {
    position: 'absolute',
    top: -80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    backgroundColor: '#ff0000',
    borderRadius: 5,
    marginRight: 8
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  playingContainer: {
    position: 'absolute',
    top: -80,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  playingText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold'
  },
  activateButton: {
    padding: 10,
    backgroundColor: 'rgba(0, 150, 255, 0.8)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff'
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default VRD; 