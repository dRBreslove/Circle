import { Platform } from 'react-native';
import Sound from 'react-native-sound';
import { Camera } from 'react-native-camera';
import { Accelerometer } from 'react-native-sensors';
import { validateSyncPoint } from '../../utils/continuom/utils';
import { AUTO_SYNC } from '../../utils/continuom/constants';

class AutoSyncService {
  constructor() {
    this.syncSound = new Sound(AUTO_SYNC.SOUND_FILE, Sound.MAIN_BUNDLE);
    this.isInitialized = false;
    this.camera = null;
    this.accelerometerSubscription = null;
    this.dots = {
      user1: {
        mainDisplay: { x: 0.5, y: 0.5 },
        floatingFrame: { x: 0.5, y: 0.5 }
      },
      user2: {
        mainDisplay: { x: 0.5, y: 0.5 },
        floatingFrame: { x: 0.5, y: 0.5 }
      }
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.requestCameraPermissions();
      await this.initializeCamera();
      await this.initializeAccelerometer();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AutoSync:', error);
      throw error;
    }
  }

  async requestCameraPermissions() {
    try {
      const { status } = await Camera.requestPermissions();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      throw error;
    }
  }

  async initializeCamera() {
    try {
      this.camera = await Camera.getAvailableCameraTypesAsync();
      if (!this.camera) {
        throw new Error('No camera available');
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      throw error;
    }
  }

  async initializeAccelerometer() {
    try {
      this.accelerometerSubscription = Accelerometer.subscribe(({ x, y, z }) => {
        this.updateDotPositions(x, y, z);
      });
    } catch (error) {
      console.error('Accelerometer initialization error:', error);
      throw error;
    }
  }

  updateDotPositions(x, y, z) {
    // Convert accelerometer data to dot positions
    const sensitivity = 0.1;
    const newX = Math.max(0, Math.min(1, 0.5 + x * sensitivity));
    const newY = Math.max(0, Math.min(1, 0.5 + y * sensitivity));

    // Update positions for both displays
    this.dots.user1.mainDisplay = { x: newX, y: newY };
    this.dots.user1.floatingFrame = { x: newX, y: newY };
    
    // Emit position updates
    this.emitPositionUpdate('user1', newX, newY);
  }

  updateDotPosition(userId, displayType, position) {
    this.dots[userId][displayType] = position;
    this.checkSyncAlignment();
  }

  checkSyncAlignment() {
    const allDotsCentered = this.areAllDotsCentered();
    
    if (allDotsCentered) {
      this.handleSyncSuccess();
    }
  }

  areAllDotsCentered() {
    return (
      this.isDotCentered(this.dots.user1.mainDisplay) &&
      this.isDotCentered(this.dots.user1.floatingFrame) &&
      this.isDotCentered(this.dots.user2.mainDisplay) &&
      this.isDotCentered(this.dots.user2.floatingFrame)
    );
  }

  isDotCentered(dot) {
    return (
      Math.abs(dot.x - 0.5) < AUTO_SYNC.CENTER_THRESHOLD &&
      Math.abs(dot.y - 0.5) < AUTO_SYNC.CENTER_THRESHOLD
    );
  }

  async handleSyncSuccess() {
    try {
      await this.playSyncSound();
      const syncPoint = await this.generateContinuomSync();
      this.emitSyncSuccess(syncPoint);
    } catch (error) {
      console.error('Failed to handle sync success:', error);
    }
  }

  playSyncSound() {
    return new Promise((resolve, reject) => {
      this.syncSound.play((success) => {
        if (success) {
          resolve();
        } else {
          reject(new Error('Failed to play sync sound'));
        }
      });
    });
  }

  async generateContinuomSync() {
    const syncPoint = {
      x: 0,
      y: 0,
      z: 0,
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1
    };

    if (!validateSyncPoint(syncPoint)) {
      throw new Error('Invalid sync point generated');
    }

    return syncPoint;
  }

  emitPositionUpdate(userId, x, y) {
    // Implementation for position update events
  }

  emitSyncSuccess(syncPoint) {
    // Implementation for sync success events
  }

  cleanup() {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.unsubscribe();
    }
    if (this.syncSound) {
      this.syncSound.release();
    }
    if (this.camera) {
      this.camera.stopCamera();
    }
    this.isInitialized = false;
  }
}

export const autoSyncService = new AutoSyncService(); 