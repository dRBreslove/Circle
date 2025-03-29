import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, Animated } from 'react-native';
import { Camera } from 'react-native-camera';
import { AUTO_SYNC } from '../utils/continuom/constants';

const { width, height } = Dimensions.get('window');

const CameraPreview = ({ onAlignmentChange }) => {
  const [alignment, setAlignment] = useState({
    horizontal: 0,
    vertical: 0,
    distance: 0,
    isAligned: false
  });
  const [countdown, setCountdown] = useState(null);
  const [holdSteady, setHoldSteady] = useState(false);
  const pulseAnimation = new Animated.Value(1);

  useEffect(() => {
    const interval = setInterval(detectAlignment, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (holdSteady) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [holdSteady]);

  const detectAlignment = async () => {
    try {
      // Simulated alignment detection with more realistic values
      const newAlignment = {
        horizontal: Math.random() * 2 - 1,
        vertical: Math.random() * 2 - 1,
        distance: Math.random() * 100,
        isAligned: false
      };

      // Check if alignment is within acceptable range
      const isAligned = 
        Math.abs(newAlignment.horizontal) < 0.2 &&
        Math.abs(newAlignment.vertical) < 0.2 &&
        newAlignment.distance > 20 &&
        newAlignment.distance < 80;

      newAlignment.isAligned = isAligned;

      setAlignment(newAlignment);
      onAlignmentChange(newAlignment);

      // Handle hold steady state
      if (isAligned && !holdSteady) {
        setHoldSteady(true);
        startCountdown();
      } else if (!isAligned) {
        setHoldSteady(false);
        setCountdown(null);
      }
    } catch (error) {
      console.error('Alignment detection error:', error);
    }
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(timer);
        setCountdown(null);
        setHoldSteady(false);
        // Trigger sync success
        onAlignmentChange({ ...alignment, syncComplete: true });
      }
    }, 1000);
  };

  const renderAlignmentGuides = () => {
    const horizontalOffset = alignment.horizontal * 50;
    const verticalOffset = alignment.vertical * 50;

    return (
      <View style={styles.alignmentGuides}>
        {/* Center Crosshair */}
        <View style={styles.crosshair}>
          <View style={styles.horizontalLine} />
          <View style={styles.verticalLine} />
          <View style={styles.centerDot} />
        </View>

        {/* Alignment Indicators */}
        <Animated.View style={[
          styles.alignmentIndicators,
          { transform: [{ scale: pulseAnimation }] }
        ]}>
          <View style={[
            styles.indicator,
            { opacity: Math.abs(alignment.horizontal) }
          ]}>
            <Text style={styles.indicatorText}>
              {alignment.horizontal > 0 ? '→' : '←'}
            </Text>
          </View>
          <View style={[
            styles.indicator,
            { opacity: Math.abs(alignment.vertical) }
          ]}>
            <Text style={styles.indicatorText}>
              {alignment.vertical > 0 ? '↑' : '↓'}
            </Text>
          </View>
        </Animated.View>

        {/* Distance Guide */}
        <View style={styles.distanceGuide}>
          <View style={[
            styles.distanceBar,
            { width: `${(alignment.distance / 100) * 200}%` }
          ]} />
          <View style={styles.optimalRange} />
        </View>

        {/* Hold Steady Message */}
        {holdSteady && (
          <View style={styles.holdSteadyContainer}>
            <Text style={styles.holdSteadyText}>Hold Steady!</Text>
            {countdown && (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={AUTO_SYNC.CAMERA.BACK}
        captureAudio={false}
      >
        {renderAlignmentGuides()}
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  camera: {
    flex: 1
  },
  alignmentGuides: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  crosshair: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  horizontalLine: {
    position: 'absolute',
    width: 100,
    height: 2,
    backgroundColor: 'rgba(255, 0, 0, 0.5)'
  },
  verticalLine: {
    position: 'absolute',
    width: 2,
    height: 100,
    backgroundColor: 'rgba(255, 0, 0, 0.5)'
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000'
  },
  alignmentIndicators: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 100
  },
  indicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5
  },
  indicatorText: {
    color: '#FFF',
    fontSize: 24
  },
  distanceGuide: {
    position: 'absolute',
    bottom: 80,
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2
  },
  distanceBar: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 2
  },
  optimalRange: {
    position: 'absolute',
    left: '20%',
    right: '80%',
    height: '100%',
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    borderRadius: 2
  },
  holdSteadyContainer: {
    position: 'absolute',
    top: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center'
  },
  holdSteadyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  countdownText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5
  }
});

export default CameraPreview; 