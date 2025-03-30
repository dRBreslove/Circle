class CallComponent {
    constructor(app) {
        this.app = app;
        this.elements = {
            videoContainer: document.getElementById('videoCallSection'),
            voiceContainer: document.getElementById('voiceCallSection'),
            videoGrid: document.getElementById('videoGrid'),
            callParticipants: document.getElementById('callParticipants'),
            muteBtn: document.getElementById('muteBtn'),
            videoBtn: document.getElementById('videoBtn'),
            endCallBtn: document.getElementById('endCallBtn'),
            backBtn: document.querySelectorAll('.back-btn')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.muteBtn.addEventListener('click', () => this.handleMute());
        this.elements.videoBtn.addEventListener('click', () => this.handleVideoToggle());
        this.elements.endCallBtn.addEventListener('click', () => this.handleEndCall());
        this.elements.backBtn.forEach(btn => {
            btn.addEventListener('click', () => this.handleBack());
        });
    }

    async startCall(type) {
        if (!this.app.state.currentGroup) return;

        this.app.state.callType = type;
        this.app.state.isInCall = true;

        try {
            await this.app.services.webrtc.initializeCall({
                groupId: this.app.state.currentGroup.id,
                type
            });

            if (type === 'video') {
                this.showVideoCall();
            } else {
                this.showVoiceCall();
            }

            this.updateCallControls();
        } catch (error) {
            console.error('Failed to start call:', error);
            this.app.showError('Failed to start call');
        }
    }

    showVideoCall() {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        this.elements.videoContainer.classList.add('active');
    }

    showVoiceCall() {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        this.elements.voiceContainer.classList.add('active');
    }

    handleMute() {
        this.app.state.isMuted = !this.app.state.isMuted;
        this.app.services.webrtc.setMute(this.app.state.isMuted);
        this.updateCallControls();
    }

    handleVideoToggle() {
        this.app.state.isVideoEnabled = !this.app.state.isVideoEnabled;
        this.app.services.webrtc.setVideoEnabled(this.app.state.isVideoEnabled);
        this.updateCallControls();
    }

    handleEndCall() {
        this.app.services.webrtc.endCall();
        this.app.state.isInCall = false;
        this.app.state.callType = null;
        this.app.components.chat.show();
    }

    handleBack() {
        if (this.app.state.isInCall) {
            this.handleEndCall();
        } else {
            this.app.components.chat.show();
        }
    }

    updateCallControls() {
        this.elements.muteBtn.querySelector('.material-icons').textContent = 
            this.app.state.isMuted ? 'mic_off' : 'mic';
        
        this.elements.videoBtn.querySelector('.material-icons').textContent = 
            this.app.state.isVideoEnabled ? 'videocam' : 'videocam_off';
    }

    handleIncomingCall(data) {
        const confirmCall = confirm(`${data.userName} is calling. Accept?`);
        if (confirmCall) {
            this.startCall(data.type);
        } else {
            this.app.services.webrtc.rejectCall(data.callId);
        }
    }

    addParticipant(participant) {
        if (this.app.state.callType === 'video') {
            this.addVideoParticipant(participant);
        } else {
            this.addVoiceParticipant(participant);
        }
    }

    addVideoParticipant(participant) {
        const videoEl = document.createElement('video');
        videoEl.id = `video-${participant.id}`;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.muted = participant.id === this.app.state.currentUser.id;

        const container = document.createElement('div');
        container.className = 'video-container';
        container.dataset.participantId = participant.id;
        container.innerHTML = `
            <div class="participant-info">
                <span class="participant-name">${participant.name}</span>
                <span class="participant-status">${participant.isMuted ? 'Muted' : 'Speaking'}</span>
            </div>
        `;
        container.appendChild(videoEl);

        this.elements.videoGrid.appendChild(container);
        this.app.services.webrtc.attachStream(videoEl, participant.stream);
    }

    addVoiceParticipant(participant) {
        const participantEl = document.createElement('div');
        participantEl.className = 'participant-avatar';
        participantEl.dataset.participantId = participant.id;
        participantEl.innerHTML = `
            <img src="${participant.avatar || 'default-avatar.png'}" alt="${participant.name}">
            <div class="participant-info">
                <span class="participant-name">${participant.name}</span>
                <span class="participant-status">${participant.isMuted ? 'Muted' : 'Speaking'}</span>
            </div>
        `;

        this.elements.callParticipants.appendChild(participantEl);
    }

    removeParticipant(participantId) {
        if (this.app.state.callType === 'video') {
            const container = this.elements.videoGrid.querySelector(`[data-participant-id="${participantId}"]`);
            if (container) {
                container.remove();
            }
        } else {
            const participantEl = this.elements.callParticipants.querySelector(`[data-participant-id="${participantId}"]`);
            if (participantEl) {
                participantEl.remove();
            }
        }
    }

    updateParticipantStatus(participantId, status) {
        const statusEl = document.querySelector(`[data-participant-id="${participantId}"] .participant-status`);
        if (statusEl) {
            statusEl.textContent = status;
        }
    }
} 