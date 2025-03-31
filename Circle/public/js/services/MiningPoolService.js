class MiningPoolService {
    constructor() {
        this.baseUrl = '/api/mining';
        this.poolConfig = {
            url: '',
            username: '',
            password: '',
            algorithm: 'sha256',
            difficulty: 1
        };
    }

    async connectToPool(poolConfig) {
        try {
            const response = await fetch(`${this.baseUrl}/connect`, {
                method: 'POST',
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(poolConfig)
            });

            if (!response.ok) {
                throw new Error('Failed to connect to mining pool');
            }

            this.poolConfig = poolConfig;
            return await response.json();
        } catch (error) {
            console.error('Connect to pool error:', error);
            throw error;
        }
    }

    async getMiningStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get mining stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Get mining stats error:', error);
            throw error;
        }
    }

    async startMining() {
        try {
            const response = await fetch(`${this.baseUrl}/start`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to start mining');
            }

            return await response.json();
        } catch (error) {
            console.error('Start mining error:', error);
            throw error;
        }
    }

    async stopMining() {
        try {
            const response = await fetch(`${this.baseUrl}/stop`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to stop mining');
            }

            return await response.json();
        } catch (error) {
            console.error('Stop mining error:', error);
            throw error;
        }
    }

    async getPayoutHistory() {
        try {
            const response = await fetch(`${this.baseUrl}/payouts`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get payout history');
            }

            return await response.json();
        } catch (error) {
            console.error('Get payout history error:', error);
            throw error;
        }
    }

    async updateMiningConfig(config) {
        try {
            const response = await fetch(`${this.baseUrl}/config`, {
                method: 'PUT',
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                throw new Error('Failed to update mining config');
            }

            this.poolConfig = { ...this.poolConfig, ...config };
            return await response.json();
        } catch (error) {
            console.error('Update mining config error:', error);
            throw error;
        }
    }

    async getWorkerStats(workerId) {
        try {
            const response = await fetch(`${this.baseUrl}/workers/${workerId}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get worker stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Get worker stats error:', error);
            throw error;
        }
    }

    async getPoolInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/pool-info`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to get pool info');
            }

            return await response.json();
        } catch (error) {
            console.error('Get pool info error:', error);
            throw error;
        }
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`
        };
    }
} 