import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to VRD',
    description: 'The VRD (VR Device) is your personal controller in VR space. Let\'s learn how to use it!',
    position: { x: width / 2, y: height / 2 },
    type: 'intro'
  },
  {
    title: 'Basic Movement',
    description: 'Move your device to control the VRD position. The device\'s accelerometer tracks your movements.',
    position: { x: width / 2, y: height / 2 },
    type: 'movement',
    animation: 'move'
  },
  {
    title: 'Basic Gestures',
    description: 'Try these basic gestures:\n• Swipe in any direction\n• Tilt the device\n• Quick jabs',
    position: { x: width / 2, y: height / 2 },
    type: 'gestures',
    animation: 'gesture'
  },
  {
    title: 'Complex Gestures',
    description: 'Advanced gestures:\n• Draw a circle\n• Make a figure-eight\n• Wave motion',
    position: { x: width / 2, y: height / 2 },
    type: 'complex',
    animation: 'complex'
  },
  {
    title: 'Visual Feedback',
    description: 'Watch for visual cues:\n• Glow effects\n• Gesture text\n• Battery level',
    position: { x: width / 2, y: height / 2 },
    type: 'visual',
    animation: 'visual'
  },
  {
    title: 'Settings & Calibration',
    description: 'Customize your experience:\n• Adjust sensitivity\n• Set thresholds\n• Calibrate device',
    position: { x: width / 2, y: height / 2 },
    type: 'settings',
    animation: 'settings'
  },
  {
    title: 'Ready to Start!',
    description: 'You\'re all set to use the VRD. Remember, you can always access the tutorial again from settings.',
    position: { x: width / 2, y: height / 2 },
    type: 'complete'
  }
];

const VRDTutorial = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const demoAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    animateStep();
  }, [currentStep]);

  const animateStep = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();

    // Start demo animation if applicable
    if (TUTORIAL_STEPS[currentStep].animation) {
      startDemoAnimation();
    }
  };

  const startDemoAnimation = () => {
    const step = TUTORIAL_STEPS[currentStep];
    demoAnim.setValue(0);

    switch (step.animation) {
      case 'move':
        Animated.loop(
          Animated.sequence([
            Animated.timing(demoAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true
            }),
            Animated.timing(demoAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true
            })
          ])
        ).start();
        break;
      case 'gesture':
        Animated.loop(
          Animated.sequence([
            Animated.timing(demoAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true
            }),
            Animated.delay(200),
            Animated.timing(demoAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true
            })
          ])
        ).start();
        break;
      case 'complex':
        Animated.loop(
          Animated.sequence([
            Animated.timing(demoAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true
            }),
            Animated.delay(500),
            Animated.timing(demoAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true
            })
          ])
        ).start();
        break;
      case 'visual':
        Animated.loop(
          Animated.sequence([
            Animated.timing(demoAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true
            }),
            Animated.delay(500),
            Animated.timing(demoAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true
            })
          ])
        ).start();
        break;
      case 'settings':
        Animated.loop(
          Animated.sequence([
            Animated.timing(demoAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true
            }),
            Animated.delay(300),
            Animated.timing(demoAnim, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: true
            })
          ])
        ).start();
        break;
    }
  };

  const handleNext = async () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        setCurrentStep(prev => prev + 1);
      });
    } else {
      await AsyncStorage.setItem('vrdTutorialCompleted', 'true');
      onComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('vrdTutorialCompleted', 'true');
    onComplete();
  };

  const renderDemoAnimation = () => {
    const step = TUTORIAL_STEPS[currentStep];
    if (!step.animation) return null;

    const animatedStyle = {
      transform: [
        { scale: demoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2]
        })},
        { rotate: demoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        })}
      ],
      opacity: demoAnim
    };

    return (
      <Animated.View style={[styles.demoContainer, animatedStyle]}>
        <View style={styles.demoVRD}>
          <View style={styles.demoIndicator} />
        </View>
      </Animated.View>
    );
  };

  const renderStep = () => {
    const step = TUTORIAL_STEPS[currentStep];
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }]
    };

    return (
      <Animated.View style={[styles.stepContainer, animatedStyle]}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
        {renderDemoAnimation()}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      {renderStep()}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip Tutorial</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep < TUTORIAL_STEPS.length - 1 ? 'Next' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  stepContainer: {
    backgroundColor: 'rgba(0, 150, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  description: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20
  },
  demoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  demoVRD: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  demoIndicator: {
    width: 20,
    height: 20,
    backgroundColor: '#00ff00',
    borderRadius: 10
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    maxWidth: 400
  },
  skipButton: {
    padding: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16
  },
  nextButton: {
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#fff'
  },
  nextButtonText: {
    color: 'rgba(0, 150, 255, 0.9)',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default VRDTutorial; 