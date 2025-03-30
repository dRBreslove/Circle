class NotificationService {
    constructor() {
        this.container = this.createContainer();
        this.notifications = new Map();
        this.nextId = 1;
        this.defaultDuration = 5000; // 5 seconds
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = this.defaultDuration) {
        const id = this.nextId++;
        const notification = this.createNotificationElement(message, type, id);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Trigger reflow for animation
        notification.offsetHeight;

        // Add show class for animation
        notification.classList.add('show');

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }

        return id;
    }

    createNotificationElement(message, type, id) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = id;

        const icon = this.getIconForType(type);
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">
                <span class="material-icons">close</span>
            </button>
        `;

        // Add close button event listener
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(id);
        });

        return notification;
    }

    getIconForType(type) {
        const icons = {
            success: '<span class="material-icons">check_circle</span>',
            error: '<span class="material-icons">error</span>',
            warning: '<span class="material-icons">warning</span>',
            info: '<span class="material-icons">info</span>'
        };
        return icons[type] || icons.info;
    }

    remove(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        notification.classList.remove('show');
        notification.addEventListener('animationend', () => {
            notification.remove();
            this.notifications.delete(id);
        });
    }

    // Convenience methods
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    // Persistent notifications
    showPersistent(message, type = 'info', onClose = null) {
        const id = this.show(message, type, 0);
        const notification = this.notifications.get(id);
        
        if (onClose) {
            notification.dataset.onClose = onClose;
        }

        return id;
    }

    // Toast notifications
    toast(message, type = 'info', duration = 3000) {
        const id = this.nextId++;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.id = id;
        toast.textContent = message;

        this.container.appendChild(toast);
        this.notifications.set(id, toast);

        // Trigger reflow for animation
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => this.remove(id), duration);

        return id;
    }

    // Clear all notifications
    clearAll() {
        for (const [id] of this.notifications) {
            this.remove(id);
        }
    }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService; 