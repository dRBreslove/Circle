class WebSocketService {
    constructor() {
        this.socket = null;
        this.eventHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    async init() {
        try {
            this.socket = io({
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });

            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        this.socket.on('reconnect_attempt', (attempt) => {
            this.reconnectAttempts = attempt;
            console.log(`Reconnection attempt ${attempt}`);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect to WebSocket');
        });

        this.socket.onAny((event, data) => {
            const handlers = this.eventHandlers.get(event) || [];
            handlers.forEach(handler => handler(data));
        });
    }

    on(event, handler) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.push(handler);
        this.eventHandlers.set(event, handlers);
    }

    off(event, handler) {
        const handlers = this.eventHandlers.get(event) || [];
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    joinGroup(groupId) {
        this.socket.emit('group:join', { groupId });
    }

    leaveGroup(groupId) {
        this.socket.emit('group:leave', { groupId });
    }

    sendMessage(data) {
        this.socket.emit('message:send', data);
    }

    initiateCall(data) {
        this.socket.emit('call:initiate', data);
    }

    acceptCall(data) {
        this.socket.emit('call:accept', data);
    }

    rejectCall(data) {
        this.socket.emit('call:reject', data);
    }

    endCall(data) {
        this.socket.emit('call:end', data);
    }

    sendOffer(data) {
        this.socket.emit('webrtc:offer', data);
    }

    sendAnswer(data) {
        this.socket.emit('webrtc:answer', data);
    }

    sendIceCandidate(data) {
        this.socket.emit('webrtc:ice-candidate', data);
    }

    updatePresence(data) {
        this.socket.emit('presence:update', data);
    }

    handleError(error) {
        console.error('WebSocket error:', error);
        this.socket.emit('error', { message: error.message });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService; 