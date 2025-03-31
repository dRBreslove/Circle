// Main Application Class
class CircleApp {
    constructor() {
        this.socket = null;
        this.authService = new AuthService();
        this.webSocketService = new WebSocketService();
        this.webRTCService = new WebRTCService();
        this.miningPoolService = new MiningPoolService();
        
        this.components = {
            groups: new GroupsComponent(this),
            chat: new ChatComponent(this),
            call: new CallComponent(this),
            mining: new MiningComponent(this),
            profile: new ProfileComponent(this)
        };

        this.init();
    }

    async init() {
        try {
            // Initialize services
            await this.authService.init();
            this.webSocketService.init();
            this.webRTCService.init();
            this.miningPoolService.init();

            // Initialize components
            Object.values(this.components).forEach(component => component.init());

            // Setup navigation
            this.setupNavigation();

            // Setup global event listeners
            this.setupEventListeners();

            // Show initial section
            this.showSection('groups');
        } catch (error) {
            console.error('Application initialization error:', error);
            this.showError('Failed to initialize application');
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
    }

    setupEventListeners() {
        // Global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e);
            this.showError('An unexpected error occurred');
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            Object.values(this.components).forEach(component => {
                if (component.handleResize) {
                    component.handleResize();
                }
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            }
        });
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CircleApp();
}); 