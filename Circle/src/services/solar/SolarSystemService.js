import { Platform } from 'react-native';

class SolarSystemService {
  constructor() {
    this.isInitialized = false;
    this.listeners = new Set();
    this.currentTime = new Date();
    this.observerLocation = {
      latitude: 0,
      longitude: 0,
      altitude: 0
    };
    this.celestialObjects = {
      sun: {
        name: 'Sun',
        type: 'star',
        radius: 696340, // km
        distance: 0, // Sun is at the center
        color: '#FFD700',
        glowColor: '#FFA500',
        rotationPeriod: 27 * 24 * 60 * 60 * 1000, // 27 days in milliseconds
        currentRotation: 0
      },
      moon: {
        name: 'Moon',
        type: 'satellite',
        radius: 1737.1, // km
        distance: 384400, // km from Earth
        color: '#C0C0C0',
        glowColor: '#E0E0E0',
        orbitalPeriod: 27.3 * 24 * 60 * 60 * 1000, // 27.3 days in milliseconds
        currentAngle: 0,
        phase: 0 // 0 = new moon, 0.5 = full moon
      }
    };
    this.settings = {
      scale: 1.0,
      autoUpdate: true,
      showLabels: true,
      showOrbits: true,
      showGlow: true,
      updateInterval: 1000, // 1 second
      timeScale: 1.0 // 1.0 = real time
    };
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Get device location for accurate celestial calculations
      if (Platform.OS !== 'web') {
        const location = await this.getDeviceLocation();
        this.observerLocation = location;
      }

      // Start time updates
      this.startTimeUpdates();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize SolarSystemService:', error);
      return false;
    }
  }

  async getDeviceLocation() {
    // This would be implemented using the device's GPS
    // For now, return default coordinates
    return {
      latitude: 0,
      longitude: 0,
      altitude: 0
    };
  }

  startTimeUpdates() {
    if (!this.settings.autoUpdate) return;

    setInterval(() => {
      this.updateTime();
    }, this.settings.updateInterval);
  }

  updateTime() {
    const now = new Date();
    const timeDiff = now - this.currentTime;
    this.currentTime = now;

    // Update celestial object positions
    this.updateCelestialPositions(timeDiff);
  }

  updateCelestialPositions(timeDiff) {
    // Update Moon's position
    const moon = this.celestialObjects.moon;
    moon.currentAngle = (moon.currentAngle + (timeDiff * this.settings.timeScale / moon.orbitalPeriod)) % 360;
    moon.phase = (moon.currentAngle / 360 + 0.5) % 1;

    // Calculate Moon's position in 3D space
    const moonAngle = (moon.currentAngle * Math.PI) / 180;
    moon.position = {
      x: Math.cos(moonAngle) * moon.distance * this.settings.scale,
      y: Math.sin(moonAngle) * moon.distance * this.settings.scale,
      z: 0
    };

    // Calculate Moon's rotation based on its orbital position
    moon.rotation = {
      x: 0,
      y: moonAngle,
      z: 0
    };

    // Notify listeners of updates
    this.notifyListeners({
      type: 'celestialUpdate',
      data: {
        time: this.currentTime,
        objects: this.celestialObjects
      }
    });
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => listener(event));
  }

  updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
  }

  getCurrentState() {
    return {
      time: this.currentTime,
      observerLocation: this.observerLocation,
      celestialObjects: this.celestialObjects,
      settings: this.settings
    };
  }

  cleanup() {
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const solarSystemService = new SolarSystemService(); 