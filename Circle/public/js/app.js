// Main Application Class
class CircleApp {
    constructor() {
        this.state = {
            currentUser: null,
            currentGroup: null,
            groups: [],
            messages: [],
            participants: [],
            isInCall: false,
            callType: null,
            isMuted: false,
            isVideoEnabled: true
        };

        this.services = {
            ws: new WebSocketService(),
            webrtc: new WebRTCService(),
            auth: new AuthService(),
            group: new GroupService(),
            chat: new ChatService()
        };

        this.components = {
            groups: new GroupsComponent(this),
            chat: new ChatComponent(this),
            call: new CallComponent(this),
            profile: new ProfileComponent(this)
        };

        this.init();
    }

    async init() {
        try {
            // Initialize services
            await this.services.auth.init();
            await this.services.ws.init();
            await this.services.webrtc.init();

            // Load user data
            await this.loadUserData();

            // Setup event listeners
            this.setupEventListeners();

            // Setup WebSocket listeners
            this.setupWebSocketListeners();

            // Render initial view
            this.renderInitialView();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }

    async loadUserData() {
        try {
            const userData = await this.services.auth.getCurrentUser();
            this.state.currentUser = userData;
            await this.components.profile.loadProfile(userData);
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.showError('Failed to load user data');
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('createGroupBtn').addEventListener('click', () => this.components.groups.showCreateModal());
        document.getElementById('profileBtn').addEventListener('click', () => this.components.profile.show());

        // Search
        const searchInput = document.querySelector('.search-box input');
        searchInput.addEventListener('input', debounce((e) => this.handleSearch(e.target.value), 300));

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.hideAllModals());
        });
    }

    setupWebSocketListeners() {
        this.services.ws.on('group:update', (data) => this.handleGroupUpdate(data));
        this.services.ws.on('message:new', (data) => this.handleNewMessage(data));
        this.services.ws.on('participant:join', (data) => this.handleParticipantJoin(data));
        this.services.ws.on('participant:leave', (data) => this.handleParticipantLeave(data));
        this.services.ws.on('call:request', (data) => this.handleCallRequest(data));
    }

    handleGroupUpdate(data) {
        this.components.groups.updateGroup(data);
    }

    handleNewMessage(data) {
        this.components.chat.addMessage(data);
    }

    handleParticipantJoin(data) {
        this.components.chat.addParticipant(data);
    }

    handleParticipantLeave(data) {
        this.components.chat.removeParticipant(data);
    }

    handleCallRequest(data) {
        this.components.call.handleIncomingCall(data);
    }

    handleSearch(query) {
        if (!query.trim()) return;
        
        const searchResults = {
            groups: this.state.groups.filter(group => 
                group.name.toLowerCase().includes(query.toLowerCase())
            ),
            messages: this.state.messages.filter(message => 
                message.content.toLowerCase().includes(query.toLowerCase())
            )
        };

        this.renderSearchResults(searchResults);
    }

    renderInitialView() {
        this.components.groups.render();
        this.components.chat.render();
        this.components.profile.render();
    }

    renderSearchResults(results) {
        // Implement search results rendering
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon material-icons">error</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">
                <span class="material-icons">close</span>
            </button>
        `;

        document.querySelector('.notification-container').appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon material-icons">check_circle</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">
                <span class="material-icons">close</span>
            </button>
        `;

        document.querySelector('.notification-container').appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.circleApp = new CircleApp();
}); 