import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { solarSystemService } from '../services/solar/SolarSystemService';

const SolarSystem = ({ style }) => {
  const [isActive, setIsActive] = useState(false);
  const [celestialObjects, setCelestialObjects] = useState(null);
  const sunScaleAnim = useRef(new Animated.Value(1)).current;
  const moonScaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    initializeSolarSystem();
    return () => cleanup();
  }, []);

  const initializeSolarSystem = async () => {
    const success = await solarSystemService.initialize();
    if (success) {
      setIsActive(true);
      solarSystemService.addListener(handleSolarSystemUpdate);
      startGlowAnimation();
    }
  };

  const cleanup = () => {
    solarSystemService.removeListener(handleSolarSystemUpdate);
    solarSystemService.cleanup();
    setIsActive(false);
  };

  const handleSolarSystemUpdate = (event) => {
    if (event.type === 'celestialUpdate') {
      setCelestialObjects(event.data.objects);
    }
  };

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const renderSun = () => {
    if (!celestialObjects?.sun) return null;

    const sunStyle = {
      transform: [
        { scale: sunScaleAnim },
        { rotate: `${celestialObjects.sun.currentRotation}deg` }
      ],
      shadowColor: celestialObjects.sun.glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: glowAnim,
      shadowRadius: 50,
      elevation: 10
    };

    return (
      <Animated.View style={[styles.sun, sunStyle]}>
        <View style={[styles.sunBody, { backgroundColor: celestialObjects.sun.color }]} />
        {celestialObjects.sun.glow && (
          <View style={[styles.sunGlow, { backgroundColor: celestialObjects.sun.glowColor }]} />
        )}
      </Animated.View>
    );
  };

  const renderMoon = () => {
    if (!celestialObjects?.moon) return null;

    const moonStyle = {
      transform: [
        { translateX: celestialObjects.moon.position.x },
        { translateY: celestialObjects.moon.position.y },
        { translateZ: celestialObjects.moon.position.z },
        { scale: moonScaleAnim },
        { rotate: `${celestialObjects.moon.rotation.y}rad` }
      ],
      shadowColor: celestialObjects.moon.glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: glowAnim,
      shadowRadius: 20,
      elevation: 5
    };

    return (
      <Animated.View style={[styles.moon, moonStyle]}>
        <View style={[styles.moonBody, { backgroundColor: celestialObjects.moon.color }]} />
        <View style={[styles.moonPhase, {
          backgroundColor: '#000',
          width: `${celestialObjects.moon.phase * 100}%`
        }]} />
        {celestialObjects.moon.glow && (
          <View style={[styles.moonGlow, { backgroundColor: celestialObjects.moon.glowColor }]} />
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {isActive && (
        <>
          {renderSun()}
          {renderMoon()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sun: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sunBody: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFA500'
  },
  sunGlow: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: 75,
    opacity: 0.3
  },
  moon: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  moonBody: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#A0A0A0',
    overflow: 'hidden'
  },
  moonPhase: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#000'
  },
  moonGlow: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: 30,
    opacity: 0.2
  }
});

export default SolarSystem; 