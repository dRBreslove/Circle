class WebRTCService {
    constructor() {
        this.peerConnections = new Map();
        this.localStream = null;
        this.localVideoElement = null;
        this.remoteVideoElements = new Map();
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
    }

    async init() {
        try {
            // Request permissions for media devices
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch (error) {
            console.error('Failed to initialize WebRTC:', error);
            throw error;
        }
    }

    async initializeCall({ groupId, type }) {
        try {
            // Get local media stream
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            });

            // Create peer connections for each participant
            const participants = await this.getGroupParticipants(groupId);
            participants.forEach(participant => {
                this.createPeerConnection(participant.id);
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize call:', error);
            throw error;
        }
    }

    createPeerConnection(participantId) {
        const peerConnection = new RTCPeerConnection(this.configuration);
        this.peerConnections.set(participantId, peerConnection);

        // Add local stream tracks to peer connection
        this.localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.localStream);
        });

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.handleIceCandidate(participantId, event.candidate);
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            this.handleRemoteTrack(participantId, event.streams[0]);
        };

        return peerConnection;
    }

    async createOffer(participantId) {
        try {
            const peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) return;

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error('Failed to create offer:', error);
            throw error;
        }
    }

    async handleOffer(participantId, offer) {
        try {
            const peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Failed to handle offer:', error);
            throw error;
        }
    }

    async handleAnswer(participantId, answer) {
        try {
            const peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Failed to handle answer:', error);
            throw error;
        }
    }

    async handleIceCandidate(participantId, candidate) {
        try {
            const peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) return;

            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Failed to handle ICE candidate:', error);
            throw error;
        }
    }

    handleRemoteTrack(participantId, stream) {
        // Emit event for UI to handle remote stream
        const event = new CustomEvent('remoteTrack', {
            detail: { participantId, stream }
        });
        window.dispatchEvent(event);
    }

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

    async getGroupParticipants(groupId) {
        // Implement API call to get group participants
        const response = await fetch(`/api/groups/${groupId}/participants`);
        return response.json();
    }

    endCall() {
        // Stop all tracks in local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Close all peer connections
        this.peerConnections.forEach(connection => connection.close());
        this.peerConnections.clear();
    }

    rejectCall(callId) {
        // Implement call rejection logic
        this.endCall();
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

    // Cleanup
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