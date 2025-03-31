class MiningComponent {
    constructor() {
        this.miningService = new MiningPoolService();
        this.isMining = false;
        this.currentStats = null;
        this.workerStats = null;
        this.poolInfo = null;
        this.payoutHistory = null;
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.startStatsUpdate();
    }

    setupEventListeners() {
        document.getElementById('startMiningBtn').addEventListener('click', () => this.startMining());
        document.getElementById('stopMiningBtn').addEventListener('click', () => this.stopMining());
        document.getElementById('connectPoolBtn').addEventListener('click', () => this.showPoolConfig());
        document.getElementById('updateConfigBtn').addEventListener('click', () => this.updateMiningConfig());
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadMiningStats(),
                this.loadPoolInfo(),
                this.loadPayoutHistory()
            ]);
            this.updateUI();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to load mining data');
        }
    }

    async loadMiningStats() {
        try {
            this.currentStats = await this.miningService.getMiningStats();
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Failed to load mining stats:', error);
        }
    }

    async loadPoolInfo() {
        try {
            this.poolInfo = await this.miningService.getPoolInfo();
            this.updatePoolInfoDisplay();
        } catch (error) {
            console.error('Failed to load pool info:', error);
        }
    }

    async loadPayoutHistory() {
        try {
            this.payoutHistory = await this.miningService.getPayoutHistory();
            this.updatePayoutHistoryDisplay();
        } catch (error) {
            console.error('Failed to load payout history:', error);
        }
    }

    async startMining() {
        try {
            await this.miningService.startMining();
            this.isMining = true;
            this.updateMiningStatus();
            this.showSuccess('Mining started successfully');
        } catch (error) {
            console.error('Failed to start mining:', error);
            this.showError('Failed to start mining');
        }
    }

    async stopMining() {
        try {
            await this.miningService.stopMining();
            this.isMining = false;
            this.updateMiningStatus();
            this.showSuccess('Mining stopped successfully');
        } catch (error) {
            console.error('Failed to stop mining:', error);
            this.showError('Failed to stop mining');
        }
    }

    async showPoolConfig() {
        const config = {
            url: document.getElementById('poolUrl').value,
            username: document.getElementById('poolUsername').value,
            password: document.getElementById('poolPassword').value,
            algorithm: document.getElementById('poolAlgorithm').value,
            difficulty: parseInt(document.getElementById('poolDifficulty').value, 10)
        };

        try {
            await this.miningService.connectToPool(config);
            this.showSuccess('Connected to mining pool successfully');
            await this.loadPoolInfo();
        } catch (error) {
            console.error('Failed to connect to pool:', error);
            this.showError('Failed to connect to mining pool');
        }
    }

    async updateMiningConfig() {
        const config = {
            algorithm: document.getElementById('miningAlgorithm').value,
            difficulty: parseInt(document.getElementById('miningDifficulty').value, 10)
        };

        try {
            await this.miningService.updateMiningConfig(config);
            this.showSuccess('Mining configuration updated successfully');
        } catch (error) {
            console.error('Failed to update mining config:', error);
            this.showError('Failed to update mining configuration');
        }
    }

    startStatsUpdate() {
        setInterval(() => this.loadMiningStats(), 30000); // Update every 30 seconds
    }

    updateUI() {
        this.updateMiningStatus();
        this.updateStatsDisplay();
        this.updatePoolInfoDisplay();
        this.updatePayoutHistoryDisplay();
    }

    updateMiningStatus() {
        const statusElement = document.getElementById('miningStatus');
        const startBtn = document.getElementById('startMiningBtn');
        const stopBtn = document.getElementById('stopMiningBtn');

        statusElement.textContent = this.isMining ? 'Mining Active' : 'Mining Inactive';
        statusElement.className = this.isMining ? 'status active' : 'status inactive';
        startBtn.disabled = this.isMining;
        stopBtn.disabled = !this.isMining;
    }

    updateStatsDisplay() {
        if (!this.currentStats) return;

        document.getElementById('hashRate').textContent = `${this.currentStats.hashRate} H/s`;
        document.getElementById('sharesFound').textContent = this.currentStats.sharesFound;
        document.getElementById('rejectedShares').textContent = this.currentStats.rejectedShares;
        document.getElementById('uptime').textContent = this.formatUptime(this.currentStats.uptime);
    }

    updatePoolInfoDisplay() {
        if (!this.poolInfo) return;

        document.getElementById('poolName').textContent = this.poolInfo.name;
        document.getElementById('poolUrl').textContent = this.poolInfo.url;
        document.getElementById('poolAlgorithm').textContent = this.poolInfo.algorithm;
        document.getElementById('poolDifficulty').textContent = this.poolInfo.difficulty;
        document.getElementById('poolWorkers').textContent = this.poolInfo.workers;
    }

    updatePayoutHistoryDisplay() {
        if (!this.payoutHistory) return;

        const historyElement = document.getElementById('payoutHistory');
        historyElement.innerHTML = this.payoutHistory.map(payout => `
            <div class="payout-item">
                <span class="amount">${payout.amount} BTC</span>
                <span class="date">${new Date(payout.date).toLocaleDateString()}</span>
                <span class="status">${payout.status}</span>
            </div>
        `).join('');
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
} 