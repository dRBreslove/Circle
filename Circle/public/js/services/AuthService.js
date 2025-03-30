class AuthService {
    constructor() {
        this.baseUrl = '/api/auth';
        this.currentUser = null;
        this.token = localStorage.getItem('auth_token');
    }

    async init() {
        if (this.token) {
            try {
                this.currentUser = await this.getCurrentUser();
            } catch (error) {
                console.error('Error initializing auth:', error);
                this.logout();
            }
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            this.token = data.token;
            this.currentUser = data.user;
            localStorage.setItem('auth_token', this.token);
            return this.currentUser;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const data = await response.json();
            this.token = data.token;
            this.currentUser = data.user;
            localStorage.setItem('auth_token', this.token);
            return this.currentUser;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        if (!this.token) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
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
            const response = await fetch(`${this.baseUrl}/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
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
            const response = await fetch(`${this.baseUrl}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
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

            const response = await fetch(`${this.baseUrl}/profile/avatar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
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
            const response = await fetch(`${this.baseUrl}/profile/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
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

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('auth_token');
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Export singleton instance
const authService = new AuthService();
export default authService; 