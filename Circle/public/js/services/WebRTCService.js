class WebRTCService {
    constructor() {
        this.peerConnections = new Map();
        this.localStream = null;
        this.localVideoElement = null;
        this.remoteVideoElements = new Map();
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
    }

    async init() {
        try {
            // Request permissions for media devices
            await this.requestPermissions();
            
            // Initialize WebSocket event listeners
            this.setupWebSocketListeners();
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
            throw error;
        }
    }

    async requestPermissions() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    setupWebSocketListeners() {
        webSocketService.on('webrtc_offer', this.handleOffer.bind(this));
        webSocketService.on('webrtc_answer', this.handleAnswer.bind(this));
        webSocketService.on('webrtc_ice_candidate', this.handleIceCandidate.bind(this));
    }

    // Call Management
    async startCall(groupId, type) {
        try {
            const peerConnection = this.createPeerConnection();
            this.peerConnections.set(groupId, peerConnection);

            // Add local stream tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });

            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            webSocketService.sendOffer(groupId, offer);

            // Create local video element
            this.createLocalVideoElement();

            return peerConnection;
        } catch (error) {
            console.error('Error starting call:', error);
            throw error;
        }
    }

    async handleOffer({ groupId, offer }) {
        try {
            const peerConnection = this.createPeerConnection();
            this.peerConnections.set(groupId, peerConnection);

            // Add local stream tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });

            // Set remote description and create answer
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Send answer
            webSocketService.sendAnswer(groupId, answer);

            // Create local video element
            this.createLocalVideoElement();

            return peerConnection;
        } catch (error) {
            console.error('Error handling offer:', error);
            throw error;
        }
    }

    async handleAnswer({ groupId, answer }) {
        try {
            const peerConnection = this.peerConnections.get(groupId);
            if (!peerConnection) {
                throw new Error('No peer connection found');
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
            throw error;
        }
    }

    async handleIceCandidate({ groupId, candidate }) {
        try {
            const peerConnection = this.peerConnections.get(groupId);
            if (!peerConnection) {
                throw new Error('No peer connection found');
            }

            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
            throw error;
        }
    }

    // Peer Connection Management
    createPeerConnection() {
        const peerConnection = new RTCPeerConnection(this.configuration);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const groupId = this.getGroupIdByPeerConnection(peerConnection);
                webSocketService.sendIceCandidate(groupId, event.candidate);
            }
        };

        peerConnection.ontrack = (event) => {
            this.handleRemoteTrack(event);
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.iceConnectionState);
        };

        return peerConnection;
    }

    // Media Stream Management
    createLocalVideoElement() {
        if (this.localVideoElement) {
            return;
        }

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = this.localStream;

        const container = document.createElement('div');
        container.className = 'video-container local';
        container.appendChild(video);

        document.getElementById('videoGrid').appendChild(container);
        this.localVideoElement = video;
    }

    handleRemoteTrack(event) {
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = event.streams[0];

        const container = document.createElement('div');
        container.className = 'video-container remote';
        container.appendChild(video);

        document.getElementById('videoGrid').appendChild(container);
        this.remoteVideoElements.set(event.streams[0].id, video);
    }

    // Call Controls
    setMute(muted) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !muted;
            });
        }
    }

    setVideoEnabled(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    // Cleanup
    async endCall(groupId) {
        try {
            const peerConnection = this.peerConnections.get(groupId);
            if (peerConnection) {
                peerConnection.close();
                this.peerConnections.delete(groupId);
            }

            // Clean up video elements
            if (this.localVideoElement) {
                this.localVideoElement.srcObject.getTracks().forEach(track => track.stop());
                this.localVideoElement.parentElement.remove();
                this.localVideoElement = null;
            }

            this.remoteVideoElements.forEach(video => {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.parentElement.remove();
            });
            this.remoteVideoElements.clear();

            // Notify server
            webSocketService.endCall(groupId);
        } catch (error) {
            console.error('Error ending call:', error);
            throw error;
        }
    }

    // Utility Methods
    getGroupIdByPeerConnection(peerConnection) {
        for (const [groupId, pc] of this.peerConnections.entries()) {
            if (pc === peerConnection) {
                return groupId;
            }
        }
        return null;
    }

    cleanup() {
        // Stop all tracks in local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        // Close all peer connections
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();

        // Clean up video elements
        if (this.localVideoElement) {
            this.localVideoElement.srcObject.getTracks().forEach(track => track.stop());
            this.localVideoElement.parentElement.remove();
        }

        this.remoteVideoElements.forEach(video => {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.parentElement.remove();
        });
        this.remoteVideoElements.clear();
    }
}

// Export singleton instance
const webRTCService = new WebRTCService();
export default webRTCService; 