class AuthService {
    constructor() {
        this.baseUrl = '/api';
        this.tokenRefreshInterval = null;
        this.tokenExpiryTime = null;
    }

    // Secure token storage using httpOnly cookies
    setAuthToken(token, expiresIn = 3600) {
        document.cookie = `auth_token=${token}; path=/; secure; samesite=strict; httponly`;
        this.tokenExpiryTime = Date.now() + (expiresIn * 1000);
        this.startTokenRefresh();
    }

    getAuthToken() {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
        return tokenCookie ? tokenCookie.split('=')[1] : null;
    }

    clearAuth() {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        this.stopTokenRefresh();
        this.tokenExpiryTime = null;
    }

    // Secure headers with CSRF protection
    getAuthHeaders() {
        const token = this.getAuthToken();
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        
        return {
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json'
        };
    }

    // Token refresh mechanism
    startTokenRefresh() {
        this.stopTokenRefresh();
        this.tokenRefreshInterval = setInterval(() => {
            if (this.shouldRefreshToken()) {
                this.refreshToken();
            }
        }, 60000); // Check every minute
    }

    stopTokenRefresh() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }
    }

    shouldRefreshToken() {
        return this.tokenExpiryTime && (this.tokenExpiryTime - Date.now() < 300000); // Refresh if less than 5 minutes remaining
    }

    async refreshToken() {
        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.setAuthToken(data.token, data.expiresIn);
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearAuth();
            return false;
        }
    }

    // Secure login with rate limiting
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            this.setAuthToken(data.token, data.expiresIn);
            return data.user;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    // Secure registration with validation
    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(userData),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const data = await response.json();
            this.setAuthToken(data.token, data.expiresIn);
            return data.user;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    // Secure logout
    async logout() {
        try {
            await fetch(`${this.baseUrl}/auth/logout`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            this.clearAuth();
        }
    }

    // Validate token
    async validateToken() {
        try {
            const response = await fetch(`${this.baseUrl}/auth/validate`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Token validation failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Token validation failed:', error);
            this.clearAuth();
            return null;
        }
    }

    // Check authentication status
    isAuthenticated() {
        return !!this.getAuthToken() && this.tokenExpiryTime && this.tokenExpiryTime > Date.now();
    }

    async init() {
        if (this.isAuthenticated()) {
            try {
                this.currentUser = await this.getCurrentUser();
            } catch (error) {
                console.error('Error initializing auth:', error);
                this.logout();
            }
        }
    }

    async getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth/me`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get current user');
            }

            const user = await response.json();
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }

    async getUserProfile() {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth/profile`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get user profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    async updateProfile(profileData) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth/profile`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedProfile = await response.json();
            this.currentUser = { ...this.currentUser, ...updatedProfile };
            return updatedProfile;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    async updateAvatar(file) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${this.baseUrl}/auth/profile/avatar`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update avatar');
            }

            const data = await response.json();
            this.currentUser.avatar = data.avatarUrl;
            return data.avatarUrl;
        } catch (error) {
            console.error('Error updating avatar:', error);
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth/profile/password`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (!response.ok) {
                throw new Error('Failed to change password');
            }

            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
}

// Export singleton instance
const authService = new AuthService();
export default authService; 