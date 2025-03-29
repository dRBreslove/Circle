import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const SyncTutorial = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnimation = new Animated.Value(1);

  const steps = [
    {
      title: 'Welcome to Sync Mode',
      description: 'Let\'s get your devices synchronized for the best Continuom experience.',
      position: { top: 20, left: 20 }
    },
    {
      title: 'Camera Setup',
      description: 'Enable your camera to help align your devices. Make sure both devices are visible to each other.',
      position: { top: height * 0.3, left: 20 }
    },
    {
      title: 'Alignment Guide',
      description: 'Use the crosshair and distance guide to position your devices correctly. The green zone shows the optimal distance.',
      position: { top: height * 0.5, left: 20 }
    },
    {
      title: 'Hold Steady',
      description: 'Once aligned, hold your devices steady for 3 seconds to complete the sync.',
      position: { top: height * 0.7, left: 20 }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        setCurrentStep(prev => prev + 1);
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.tutorialBox,
          { 
            opacity: fadeAnimation,
            top: steps[currentStep].position.top,
            left: steps[currentStep].position.left
          }
        ]}
      >
        <Text style={styles.title}>{steps[currentStep].title}</Text>
        <Text style={styles.description}>{steps[currentStep].description}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip Tutorial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000
  },
  tutorialBox: {
    position: 'absolute',
    width: width - 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  description: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  skipButton: {
    padding: 10
  },
  skipText: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.7
  },
  nextButton: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center'
  },
  nextText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default SyncTutorial; 