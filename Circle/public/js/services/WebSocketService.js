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
            console.error('Error initializing WebSocket:', error);
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
            console.log(`Reconnection attempt ${attempt}`);
            this.reconnectAttempts = attempt;
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect to WebSocket');
            throw new Error('WebSocket connection failed');
        });

        // Handle all incoming events
        this.socket.onAny((event, ...args) => {
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                handlers.forEach(handler => handler(...args));
            }
        });
    }

    // Event handling
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    // Group events
    joinGroup(groupId) {
        this.socket.emit('join_group', { groupId });
    }

    leaveGroup(groupId) {
        this.socket.emit('leave_group', { groupId });
    }

    // Chat events
    sendMessage(groupId, message) {
        this.socket.emit('send_message', {
            groupId,
            message
        });
    }

    // Call events
    initiateCall(groupId, type) {
        this.socket.emit('initiate_call', {
            groupId,
            type
        });
    }

    acceptCall(callId) {
        this.socket.emit('accept_call', { callId });
    }

    rejectCall(callId) {
        this.socket.emit('reject_call', { callId });
    }

    endCall(callId) {
        this.socket.emit('end_call', { callId });
    }

    // WebRTC signaling
    sendOffer(callId, offer) {
        this.socket.emit('webrtc_offer', {
            callId,
            offer
        });
    }

    sendAnswer(callId, answer) {
        this.socket.emit('webrtc_answer', {
            callId,
            answer
        });
    }

    sendIceCandidate(callId, candidate) {
        this.socket.emit('webrtc_ice_candidate', {
            callId,
            candidate
        });
    }

    // Presence events
    updatePresence(status) {
        this.socket.emit('update_presence', { status });
    }

    // Error handling
    handleError(error) {
        console.error('WebSocket error:', error);
        this.socket.emit('error', { message: error.message });
    }

    // Cleanup
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.eventHandlers.clear();
    }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService; 