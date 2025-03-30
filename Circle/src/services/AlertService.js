import * as Notifications from 'expo-notifications';
import { db } from '../config/database';

class AlertService {
  constructor() {
    this.collection = db.collection('alerts');
    this.thresholds = {
      errorRate: 0.05, // 5% error rate threshold
      successRate: 0.95, // 95% success rate threshold
      processingTime: 30000, // 30 seconds processing time threshold
      volumeSpike: 2, // 2x normal volume threshold
    };
    this.setupNotifications();
  }

  async setupNotifications() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Notification permissions not granted');
        return;
      }
    }

    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async checkThresholds(metrics) {
    const alerts = [];

    // Check error rate
    if (metrics.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Error rate (${(metrics.errorRate * 100).toFixed(1)}%) exceeds threshold (${(this.thresholds.errorRate * 100).toFixed(1)}%)`,
        timestamp: new Date(),
      });
    }

    // Check success rate
    if (metrics.successRate < this.thresholds.successRate) {
      alerts.push({
        type: 'success_rate',
        severity: 'high',
        message: `Success rate (${(metrics.successRate * 100).toFixed(1)}%) below threshold (${(this.thresholds.successRate * 100).toFixed(1)}%)`,
        timestamp: new Date(),
      });
    }

    // Check processing time
    if (metrics.averageProcessingTime > this.thresholds.processingTime) {
      alerts.push({
        type: 'processing_time',
        severity: 'medium',
        message: `Average processing time (${Math.round(metrics.averageProcessingTime / 1000)}s) exceeds threshold (${this.thresholds.processingTime / 1000}s)`,
        timestamp: new Date(),
      });
    }

    // Check volume spike
    if (metrics.volumeSpike > this.thresholds.volumeSpike) {
      alerts.push({
        type: 'volume_spike',
        severity: 'medium',
        message: `Volume spike detected (${metrics.volumeSpike}x normal)`,
        timestamp: new Date(),
      });
    }

    // Store alerts in database
    if (alerts.length > 0) {
      await this.storeAlerts(alerts);
      await this.sendNotifications(alerts);
    }

    return alerts;
  }

  async storeAlerts(alerts) {
    try {
      await this.collection.insertMany(alerts);
    } catch (error) {
      console.error('Error storing alerts:', error);
    }
  }

  async sendNotifications(alerts) {
    for (const alert of alerts) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Alert: ${alert.type.replace('_', ' ').toUpperCase()}`,
            body: alert.message,
            data: { severity: alert.severity },
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  }

  async getRecentAlerts(limit = 10) {
    try {
      return await this.collection
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      return [];
    }
  }

  async getAlertsByType(type, limit = 10) {
    try {
      return await this.collection
        .find({ type })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error fetching alerts by type:', error);
      return [];
    }
  }

  async getAlertsBySeverity(severity, limit = 10) {
    try {
      return await this.collection
        .find({ severity })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error fetching alerts by severity:', error);
      return [];
    }
  }

  async updateThresholds(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds,
    };
  }

  async getThresholds() {
    return this.thresholds;
  }

  async clearAlerts() {
    try {
      await this.collection.deleteMany({});
    } catch (error) {
      console.error('Error clearing alerts:', error);
    }
  }
}

export default new AlertService(); 