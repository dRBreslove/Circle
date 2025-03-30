class ChatService {
    constructor() {
        this.baseUrl = '/api/chat';
        this.messageCache = new Map(); // Cache for messages by group ID
    }

    async getMessages(groupId, limit = 50, before = null) {
        try {
            const cacheKey = `${groupId}-${limit}-${before}`;
            if (this.messageCache.has(cacheKey)) {
                return this.messageCache.get(cacheKey);
            }

            const url = new URL(`${this.baseUrl}/${groupId}/messages`);
            url.searchParams.append('limit', limit);
            if (before) {
                url.searchParams.append('before', before);
            }

            const response = await fetch(url, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const messages = await response.json();
            this.messageCache.set(cacheKey, messages);
            return messages;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    async sendMessage(groupId, text, attachment = null) {
        try {
            const formData = new FormData();
            formData.append('text', text);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            const response = await fetch(`${this.baseUrl}/${groupId}/messages`, {
                method: 'POST',
                headers: {
                    ...this.getAuthHeaders(),
                    // Remove Content-Type header to let browser set it with boundary for FormData
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const message = await response.json();
            this.clearMessageCache(groupId);
            return message;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async deleteMessage(groupId, messageId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/messages/${messageId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to delete message');
            }

            this.clearMessageCache(groupId);
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }

    async editMessage(groupId, messageId, text) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/messages/${messageId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error('Failed to edit message');
            }

            const message = await response.json();
            this.clearMessageCache(groupId);
            return message;
        } catch (error) {
            console.error('Error editing message:', error);
            throw error;
        }
    }

    async uploadAttachment(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.baseUrl}/attachments`, {
                method: 'POST',
                headers: {
                    ...this.getAuthHeaders(),
                    // Remove Content-Type header to let browser set it with boundary for FormData
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload attachment');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading attachment:', error);
            throw error;
        }
    }

    async deleteAttachment(groupId, messageId, attachmentId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/messages/${messageId}/attachments/${attachmentId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to delete attachment');
            }

            this.clearMessageCache(groupId);
            return true;
        } catch (error) {
            console.error('Error deleting attachment:', error);
            throw error;
        }
    }

    async markAsRead(groupId, messageId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/messages/${messageId}/read`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to mark message as read');
            }

            return true;
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }

    async getUnreadCount(groupId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/unread`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get unread count');
            }

            const data = await response.json();
            return data.count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    // Cache Management
    clearMessageCache(groupId) {
        for (const key of this.messageCache.keys()) {
            if (key.startsWith(groupId)) {
                this.messageCache.delete(key);
            }
        }
    }

    clearAllCache() {
        this.messageCache.clear();
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`
        };
    }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService; 