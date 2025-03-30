class GroupService {
    constructor() {
        this.baseUrl = '/api/groups';
    }

    async getUserGroups() {
        try {
            const response = await fetch(`${this.baseUrl}/my-groups`, {
                headers: authService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user groups');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user groups:', error);
            throw error;
        }
    }

    async createGroup(groupData) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: authService.getAuthHeaders(),
                body: JSON.stringify(groupData)
            });

            if (!response.ok) {
                throw new Error('Failed to create group');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    }

    async joinGroup(groupId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/join`, {
                method: 'POST',
                headers: authService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to join group');
            }

            return await response.json();
        } catch (error) {
            console.error('Error joining group:', error);
            throw error;
        }
    }

    async leaveGroup(groupId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/leave`, {
                method: 'POST',
                headers: authService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to leave group');
            }

            return await response.json();
        } catch (error) {
            console.error('Error leaving group:', error);
            throw error;
        }
    }

    async getGroupDetails(groupId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}`, {
                headers: authService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch group details');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching group details:', error);
            throw error;
        }
    }

    async updateGroup(groupId, groupData) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}`, {
                method: 'PUT',
                headers: authService.getAuthHeaders(),
                body: JSON.stringify(groupData)
            });

            if (!response.ok) {
                throw new Error('Failed to update group');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating group:', error);
            throw error;
        }
    }

    async deleteGroup(groupId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}`, {
                method: 'DELETE',
                headers: authService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to delete group');
            }

            return true;
        } catch (error) {
            console.error('Error deleting group:', error);
            throw error;
        }
    }

    async addMember(groupId, userId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/members`, {
                method: 'POST',
                headers: authService.getAuthHeaders(),
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                throw new Error('Failed to add member');
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    }

    async removeMember(groupId, userId) {
        try {
            const response = await fetch(`${this.baseUrl}/${groupId}/members/${userId}`, {
                method: 'DELETE',
                headers: authService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to remove member');
            }

            return true;
        } catch (error) {
            console.error('Error removing member:', error);
            throw error;
        }
    }

    async searchGroups(query) {
        try {
            const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`, {
                headers: authService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to search groups');
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching groups:', error);
            throw error;
        }
    }

    async searchUsers(query) {
        try {
            const response = await fetch(`${this.baseUrl}/users/search?q=${encodeURIComponent(query)}`, {
                headers: authService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to search users');
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }
}

// Export singleton instance
const groupService = new GroupService();
export default groupService; 