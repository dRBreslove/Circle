import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.socket) {
      return;
    }

    this.socket = io(process.env.WS_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('transaction_update', (data) => {
      this.notifySubscribers('transaction_update', data);
    });

    this.socket.on('health_update', (data) => {
      this.notifySubscribers('health_update', data);
    });

    this.socket.on('error_update', (data) => {
      this.notifySubscribers('error_update', data);
    });

    this.socket.on('rate_update', (data) => {
      this.notifySubscribers('rate_update', data);
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event).delete(callback);
      if (this.subscribers.get(event).size === 0) {
        this.subscribers.delete(event);
      }
    };
  }

  notifySubscribers(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.subscribers.clear();
    }
  }

  // Subscribe to specific events
  subscribeToTransactions(callback) {
    return this.subscribe('transaction_update', callback);
  }

  subscribeToHealth(callback) {
    return this.subscribe('health_update', callback);
  }

  subscribeToErrors(callback) {
    return this.subscribe('error_update', callback);
  }

  subscribeToRates(callback) {
    return this.subscribe('rate_update', callback);
  }
}

export default new WebSocketService(); 