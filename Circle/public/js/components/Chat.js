class ChatComponent {
    constructor(app) {
        this.app = app;
        this.elements = {
            container: document.getElementById('chatSection'),
            messagesList: document.getElementById('messagesList'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            attachBtn: document.getElementById('attachBtn'),
            backBtn: document.querySelector('.back-btn'),
            groupName: document.getElementById('currentGroupName'),
            participantCount: document.getElementById('participantCount'),
            videoCallBtn: document.getElementById('videoCallBtn'),
            voiceCallBtn: document.getElementById('voiceCallBtn')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        this.elements.attachBtn.addEventListener('click', () => this.handleAttachment());
        this.elements.backBtn.addEventListener('click', () => this.handleBack());
        this.elements.videoCallBtn.addEventListener('click', () => this.handleVideoCall());
        this.elements.voiceCallBtn.addEventListener('click', () => this.handleVoiceCall());
    }

    show() {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        this.elements.container.classList.add('active');
    }

    async loadMessages(groupId) {
        try {
            const messages = await this.app.services.chat.getMessages(groupId);
            this.app.state.messages = messages;
            this.renderMessages(messages);
            this.updateGroupInfo();
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.app.showError('Failed to load messages');
        }
    }

    renderMessages(messages) {
        this.elements.messagesList.innerHTML = messages.map(message => this.renderMessage(message)).join('');
        this.scrollToBottom();
    }

    renderMessage(message) {
        const isOwnMessage = message.userId === this.app.state.currentUser.id;
        return `
            <div class="message ${isOwnMessage ? 'own' : ''}" data-message-id="${message.id}">
                <div class="message-avatar">
                    <img src="${message.userAvatar || 'default-avatar.png'}" alt="${message.userName}">
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${message.userName}</span>
                        <span class="message-time">${this.formatTime(message.timestamp)}</span>
                    </div>
                    ${this.renderMessageContent(message)}
                </div>
            </div>
        `;
    }

    renderMessageContent(message) {
        if (message.type === 'text') {
            return `<div class="message-text">${this.escapeHtml(message.content)}</div>`;
        } else if (message.type === 'image') {
            return `<img src="${message.content}" alt="Shared image" class="message-image">`;
        } else if (message.type === 'file') {
            return `
                <div class="message-file">
                    <span class="material-icons">attach_file</span>
                    <a href="${message.content}" target="_blank">${message.fileName}</a>
                </div>
            `;
        }
        return '';
    }

    async handleSendMessage() {
        const content = this.elements.messageInput.value.trim();
        if (!content || !this.app.state.currentGroup) return;

        try {
            const message = await this.app.services.chat.sendMessage({
                groupId: this.app.state.currentGroup.id,
                content,
                type: 'text'
            });

            this.app.state.messages.push(message);
            this.renderMessages(this.app.state.messages);
            this.elements.messageInput.value = '';
        } catch (error) {
            console.error('Failed to send message:', error);
            this.app.showError('Failed to send message');
        }
    }

    async handleAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx,.txt';
        input.multiple = true;

        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                try {
                    const message = await this.app.services.chat.sendAttachment({
                        groupId: this.app.state.currentGroup.id,
                        file
                    });
                    this.app.state.messages.push(message);
                    this.renderMessages(this.app.state.messages);
                } catch (error) {
                    console.error('Failed to send attachment:', error);
                    this.app.showError('Failed to send attachment');
                }
            }
        });

        input.click();
    }

    handleBack() {
        this.app.state.currentGroup = null;
        this.app.state.messages = [];
        this.app.components.groups.show();
    }

    handleVideoCall() {
        this.app.components.call.startCall('video');
    }

    handleVoiceCall() {
        this.app.components.call.startCall('voice');
    }

    addMessage(message) {
        this.app.state.messages.push(message);
        this.renderMessages(this.app.state.messages);
    }

    addParticipant(participant) {
        this.app.state.participants.push(participant);
        this.updateGroupInfo();
    }

    removeParticipant(participant) {
        this.app.state.participants = this.app.state.participants.filter(p => p.id !== participant.id);
        this.updateGroupInfo();
    }

    updateGroupInfo() {
        if (this.app.state.currentGroup) {
            this.elements.groupName.textContent = this.app.state.currentGroup.name;
            this.elements.participantCount.textContent = `${this.app.state.participants.length} participants`;
        }
    }

    scrollToBottom() {
        this.elements.messagesList.scrollTop = this.elements.messagesList.scrollHeight;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
} 