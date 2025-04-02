import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

class VRDService {
  constructor() {
    this.listeners = new Set();
    this.isInitialized = false;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { pitch: 0, yaw: 0, roll: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.lastUpdate = Date.now();
    this.gestureHistory = [];
    this.recordedGestures = new Map();
    this.isRecording = false;
    this.isPlaying = false;
    this.currentPlayback = null;
    this.calibrationData = {
      referencePosition: null,
      referenceRotation: null,
      positionOffsets: { x: 0, y: 0, z: 0 },
      rotationOffsets: { pitch: 0, yaw: 0, roll: 0 },
      sensitivityFactors: { x: 1, y: 1, z: 1 },
      lastCalibration: null
    };
    this.settings = {
      sensitivity: 0.1,
      gestureThreshold: 1.5,
      updateInterval: 16, // ~60fps
      hapticFeedback: true,
      gestureHistorySize: 10,
      complexGestureTimeout: 1000, // ms
      rotationThreshold: 45, // degrees
      accelerationThreshold: 2.0,
      velocityThreshold: 1.0,
      autoCalibrate: true,
      calibrationInterval: 300000, // 5 minutes
      recordingBufferSize: 1000,
      playbackSpeed: 1.0
    };
  }

  async initialize() {
    try {
      if (this.isInitialized) return;

      // Initialize accelerometer
      await Accelerometer.setUpdateInterval(this.settings.updateInterval);
      Accelerometer.addListener(this.handleAccelerometerData);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize VRD service:', error);
      return false;
    }
  }

  cleanup() {
    if (this.isInitialized) {
      Accelerometer.removeAllListeners();
      this.listeners.clear();
      this.isInitialized = false;
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
  }

  handleAccelerometerData({ x, y, z }) {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    // Apply calibration offsets
    const calibratedAcceleration = {
      x: (x - this.calibrationData.positionOffsets.x) * this.calibrationData.sensitivityFactors.x,
      y: (y - this.calibrationData.positionOffsets.y) * this.calibrationData.sensitivityFactors.y,
      z: (z - this.calibrationData.positionOffsets.z) * this.calibrationData.sensitivityFactors.z
    };

    // Update acceleration
    this.acceleration = calibratedAcceleration;

    // Update velocity
    this.velocity = {
      x: this.velocity.x + x * deltaTime,
      y: this.velocity.y + y * deltaTime,
      z: this.velocity.z + z * deltaTime
    };

    // Apply damping
    const damping = 0.95;
    this.velocity = {
      x: this.velocity.x * damping,
      y: this.velocity.y * damping,
      z: this.velocity.z * damping
    };

    // Update position
    this.position = {
      x: this.position.x + this.velocity.x * deltaTime * this.settings.sensitivity,
      y: this.position.y + this.velocity.y * deltaTime * this.settings.sensitivity,
      z: this.position.z + this.velocity.z * deltaTime * this.settings.sensitivity
    };

    // Calculate rotation
    this.rotation = {
      pitch: Math.atan2(y, z) * (180 / Math.PI),
      yaw: Math.atan2(x, z) * (180 / Math.PI),
      roll: Math.atan2(x, y) * (180 / Math.PI)
    };

    // Detect gestures
    const gesture = this.detectGesture();
    if (gesture) {
      this.gestureHistory.push({
        type: gesture,
        timestamp: now,
        position: { ...this.position },
        rotation: { ...this.rotation },
        velocity: { ...this.velocity },
        acceleration: { ...this.acceleration }
      });

      // Keep gesture history size limited
      if (this.gestureHistory.length > this.settings.gestureHistorySize) {
        this.gestureHistory.shift();
      }

      this.notifyListeners({ type: 'gesture', data: gesture });
    }

    // Detect complex gestures
    const complexGesture = this.detectComplexGesture();
    if (complexGesture) {
      this.notifyListeners({ type: 'complexGesture', data: complexGesture });
    }

    // Notify position update
    this.notifyListeners({
      type: 'position',
      data: {
        position: this.position,
        rotation: this.rotation,
        velocity: this.velocity,
        acceleration: this.acceleration
      }
    });

    // Record gesture data if recording
    if (this.isRecording) {
      const gestureData = Array.from(this.recordedGestures.values()).pop();
      if (gestureData && gestureData.length < this.settings.recordingBufferSize) {
        gestureData.push({
          position: { ...this.position },
          rotation: { ...this.rotation },
          acceleration: { ...this.acceleration },
          timestamp: now
        });
      }
    }
  }

  detectGesture() {
    const speed = Math.sqrt(
      Math.pow(this.velocity.x, 2) +
      Math.pow(this.velocity.y, 2) +
      Math.pow(this.velocity.z, 2)
    );

    const acceleration = Math.sqrt(
      Math.pow(this.acceleration.x, 2) +
      Math.pow(this.acceleration.y, 2) +
      Math.pow(this.acceleration.z, 2)
    );

    // Basic swipe gestures
    if (speed > this.settings.velocityThreshold) {
      if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y) && 
          Math.abs(this.velocity.x) > Math.abs(this.velocity.z)) {
        return this.velocity.x > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
      }
      if (Math.abs(this.velocity.y) > Math.abs(this.velocity.x) && 
          Math.abs(this.velocity.y) > Math.abs(this.velocity.z)) {
        return this.velocity.y > 0 ? 'SWIPE_UP' : 'SWIPE_DOWN';
      }
      if (Math.abs(this.velocity.z) > Math.abs(this.velocity.x) && 
          Math.abs(this.velocity.z) > Math.abs(this.velocity.y)) {
        return this.velocity.z > 0 ? 'SWIPE_FORWARD' : 'SWIPE_BACKWARD';
      }
    }

    // Rotation gestures
    if (Math.abs(this.rotation.pitch) > this.settings.rotationThreshold) {
      return this.rotation.pitch > 0 ? 'TILT_UP' : 'TILT_DOWN';
    }
    if (Math.abs(this.rotation.roll) > this.settings.rotationThreshold) {
      return this.rotation.roll > 0 ? 'TILT_RIGHT' : 'TILT_LEFT';
    }

    // Acceleration-based gestures
    if (acceleration > this.settings.accelerationThreshold) {
      if (Math.abs(this.acceleration.x) > Math.abs(this.acceleration.y) && 
          Math.abs(this.acceleration.x) > Math.abs(this.acceleration.z)) {
        return this.acceleration.x > 0 ? 'JAB_RIGHT' : 'JAB_LEFT';
      }
      if (Math.abs(this.acceleration.y) > Math.abs(this.acceleration.x) && 
          Math.abs(this.acceleration.y) > Math.abs(this.acceleration.z)) {
        return this.acceleration.y > 0 ? 'JAB_UP' : 'JAB_DOWN';
      }
      if (Math.abs(this.acceleration.z) > Math.abs(this.acceleration.x) && 
          Math.abs(this.acceleration.z) > Math.abs(this.acceleration.y)) {
        return this.acceleration.z > 0 ? 'JAB_FORWARD' : 'JAB_BACKWARD';
      }
    }

    return null;
  }

  detectComplexGesture() {
    if (this.gestureHistory.length < 2) return null;

    const now = Date.now();
    const recentGestures = this.gestureHistory.filter(
      g => now - g.timestamp < this.settings.complexGestureTimeout
    );

    if (recentGestures.length < 2) return null;

    // Detect circular motion
    const circularMotion = this.detectCircularMotion(recentGestures);
    if (circularMotion) return circularMotion;

    // Detect figure-eight motion
    const figureEight = this.detectFigureEight(recentGestures);
    if (figureEight) return figureEight;

    // Detect wave motion
    const wave = this.detectWaveMotion(recentGestures);
    if (wave) return wave;

    return null;
  }

  detectCircularMotion(gestures) {
    // Calculate average position
    const avgX = gestures.reduce((sum, g) => sum + g.position.x, 0) / gestures.length;
    const avgY = gestures.reduce((sum, g) => sum + g.position.y, 0) / gestures.length;
    const avgZ = gestures.reduce((sum, g) => sum + g.position.z, 0) / gestures.length;

    // Calculate radius
    const radius = Math.sqrt(
      Math.pow(gestures[0].position.x - avgX, 2) +
      Math.pow(gestures[0].position.y - avgY, 2) +
      Math.pow(gestures[0].position.z - avgZ, 2)
    );

    // Check if points form a circle
    const isCircular = gestures.every(g => {
      const distance = Math.sqrt(
        Math.pow(g.position.x - avgX, 2) +
        Math.pow(g.position.y - avgY, 2) +
        Math.pow(g.position.z - avgZ, 2)
      );
      return Math.abs(distance - radius) < 0.1;
    });

    if (isCircular) {
      return 'CIRCLE';
    }

    return null;
  }

  detectFigureEight(gestures) {
    // Check for alternating circular motions
    const midPoint = Math.floor(gestures.length / 2);
    const firstHalf = gestures.slice(0, midPoint);
    const secondHalf = gestures.slice(midPoint);

    const firstCircle = this.detectCircularMotion(firstHalf);
    const secondCircle = this.detectCircularMotion(secondHalf);

    if (firstCircle && secondCircle) {
      return 'FIGURE_EIGHT';
    }

    return null;
  }

  detectWaveMotion(gestures) {
    // Check for oscillating motion in any axis
    const oscillations = gestures.reduce((count, g, i) => {
      if (i === 0) return 0;
      const prev = gestures[i - 1];
      if (Math.sign(g.position.y - prev.position.y) !== 
          Math.sign(prev.position.y - (i > 1 ? gestures[i - 2].position.y : prev.position.y))) {
        return count + 1;
      }
      return count;
    }, 0);

    if (oscillations >= 3) {
      return 'WAVE';
    }

    return null;
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in VRD listener:', error);
      }
    });
  }

  // Utility methods
  resetPosition() {
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { pitch: 0, yaw: 0, roll: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.gestureHistory = [];
  }

  getCurrentState() {
    return {
      position: { ...this.position },
      rotation: { ...this.rotation },
      velocity: { ...this.velocity },
      acceleration: { ...this.acceleration },
      timestamp: Date.now()
    };
  }

  getGestureHistory() {
    return [...this.gestureHistory];
  }

  clearGestureHistory() {
    this.gestureHistory = [];
  }

  // Calibration methods
  async calibrate(options = {}) {
    const {
      type = 'full',
      duration = 1000,
      samples = 10
    } = options;

    this.isCalibrating = true;
    this.notifyListeners({ type: 'calibrationStart', data: { type } });

    try {
      switch (type) {
        case 'quick':
          await this.quickCalibrate(duration);
          break;
        case 'full':
          await this.fullCalibrate(duration, samples);
          break;
        case 'dynamic':
          await this.dynamicCalibrate(duration);
          break;
        default:
          throw new Error('Invalid calibration type');
      }

      this.calibrationData.lastCalibration = Date.now();
      this.notifyListeners({ type: 'calibrationComplete', data: this.calibrationData });
      return true;
    } catch (error) {
      console.error('Calibration failed:', error);
      this.notifyListeners({ type: 'calibrationError', data: { error } });
      return false;
    } finally {
      this.isCalibrating = false;
    }
  }

  async quickCalibrate(duration) {
    return new Promise(resolve => {
      const samples = [];
      const startTime = Date.now();

      const collectSample = () => {
        if (Date.now() - startTime < duration) {
          samples.push({
            position: { ...this.position },
            rotation: { ...this.rotation },
            acceleration: { ...this.acceleration }
          });
          setTimeout(collectSample, 50);
        } else {
          this.processCalibrationSamples(samples);
          resolve();
        }
      };

      collectSample();
    });
  }

  async fullCalibrate(duration, samples) {
    return new Promise(resolve => {
      const collectedSamples = [];
      const interval = duration / samples;

      const collectSample = () => {
        if (collectedSamples.length < samples) {
          collectedSamples.push({
            position: { ...this.position },
            rotation: { ...this.rotation },
            acceleration: { ...this.acceleration }
          });
          setTimeout(collectSample, interval);
        } else {
          this.processCalibrationSamples(collectedSamples);
          resolve();
        }
      };

      collectSample();
    });
  }

  async dynamicCalibrate(duration) {
    return new Promise(resolve => {
      const samples = [];
      const startTime = Date.now();
      let lastSample = null;

      const collectSample = () => {
        if (Date.now() - startTime < duration) {
          const currentSample = {
            position: { ...this.position },
            rotation: { ...this.rotation },
            acceleration: { ...this.acceleration }
          };

          if (lastSample) {
            const movement = this.calculateMovement(lastSample, currentSample);
            if (movement > 0.1) { // Only collect samples with significant movement
              samples.push(currentSample);
            }
          }

          lastSample = currentSample;
          setTimeout(collectSample, 50);
        } else {
          this.processCalibrationSamples(samples);
          resolve();
        }
      };

      collectSample();
    });
  }

  processCalibrationSamples(samples) {
    if (samples.length === 0) return;

    // Calculate reference values
    const avgPosition = samples.reduce((acc, sample) => ({
      x: acc.x + sample.position.x,
      y: acc.y + sample.position.y,
      z: acc.z + sample.position.z
    }), { x: 0, y: 0, z: 0 });

    avgPosition.x /= samples.length;
    avgPosition.y /= samples.length;
    avgPosition.z /= samples.length;

    // Calculate sensitivity factors
    const sensitivityFactors = this.calculateSensitivityFactors(samples);

    // Update calibration data
    this.calibrationData = {
      ...this.calibrationData,
      referencePosition: avgPosition,
      referenceRotation: { ...this.rotation },
      sensitivityFactors
    };
  }

  calculateSensitivityFactors(samples) {
    const factors = { x: 1, y: 1, z: 1 };
    
    // Calculate movement ranges
    const ranges = samples.reduce((acc, sample) => ({
      x: Math.max(acc.x, Math.abs(sample.position.x)),
      y: Math.max(acc.y, Math.abs(sample.position.y)),
      z: Math.max(acc.z, Math.abs(sample.position.z))
    }), { x: 0, y: 0, z: 0 });

    // Normalize factors
    const maxRange = Math.max(ranges.x, ranges.y, ranges.z);
    if (maxRange > 0) {
      factors.x = ranges.x / maxRange;
      factors.y = ranges.y / maxRange;
      factors.z = ranges.z / maxRange;
    }

    return factors;
  }

  calculateMovement(sample1, sample2) {
    return Math.sqrt(
      Math.pow(sample2.position.x - sample1.position.x, 2) +
      Math.pow(sample2.position.y - sample1.position.y, 2) +
      Math.pow(sample2.position.z - sample1.position.z, 2)
    );
  }

  // Gesture recording and playback methods
  startRecording(gestureName) {
    if (this.isRecording) return false;
    
    this.isRecording = true;
    this.recordedGestures.set(gestureName, []);
    this.notifyListeners({ type: 'recordingStart', data: { gestureName } });
    return true;
  }

  stopRecording() {
    if (!this.isRecording) return null;
    
    this.isRecording = false;
    const gestureName = Array.from(this.recordedGestures.keys()).pop();
    const gestureData = this.recordedGestures.get(gestureName);
    
    if (gestureData.length > 0) {
      this.notifyListeners({ type: 'recordingComplete', data: { gestureName, gestureData } });
      return { gestureName, gestureData };
    }
    
    return null;
  }

  playGesture(gestureName, options = {}) {
    const { speed = 1.0, loop = false } = options;
    const gestureData = this.recordedGestures.get(gestureName);
    
    if (!gestureData || this.isPlaying) return false;
    
    this.isPlaying = true;
    this.currentPlayback = {
      gestureName,
      data: [...gestureData],
      speed,
      loop,
      currentIndex: 0
    };
    
    this.notifyListeners({ type: 'playbackStart', data: { gestureName } });
    this.playNextFrame();
    return true;
  }

  stopPlayback() {
    if (!this.isPlaying) return false;
    
    this.isPlaying = false;
    this.currentPlayback = null;
    this.notifyListeners({ type: 'playbackStop' });
    return true;
  }

  playNextFrame() {
    if (!this.isPlaying || !this.currentPlayback) return;
    
    const { data, currentIndex, speed, loop } = this.currentPlayback;
    if (currentIndex >= data.length) {
      if (loop) {
        this.currentPlayback.currentIndex = 0;
      } else {
        this.stopPlayback();
        return;
      }
    }
    
    const frame = data[currentIndex];
    this.position = { ...frame.position };
    this.rotation = { ...frame.rotation };
    this.acceleration = { ...frame.acceleration };
    
    this.notifyListeners({
      type: 'position',
      data: {
        position: this.position,
        rotation: this.rotation,
        acceleration: this.acceleration
      }
    });
    
    this.currentPlayback.currentIndex++;
    setTimeout(() => this.playNextFrame(), this.settings.updateInterval / speed);
  }
}

export const vrdService = new VRDService(); 