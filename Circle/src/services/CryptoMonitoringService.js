import { db } from '../config/database';
import CryptoPaymentService from './CryptoPaymentService';
import ExchangeRateService from './ExchangeRateService';
import { ethers } from 'ethers';
import { Connection } from '@solana/web3.js';

class CryptoMonitoringService {
  constructor() {
    this.collection = db.collection('crypto_monitoring');
    this.ethProvider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
    this.solConnection = new Connection(process.env.SOL_RPC_URL);
  }

  async checkSystemHealth() {
    try {
      const health = {
        timestamp: new Date(),
        status: 'healthy',
        issues: [],
        metrics: {},
      };

      // Check exchange rates
      const rates = await ExchangeRateService.getAllRates();
      health.metrics.exchangeRates = rates;

      // Check node connections
      const nodeStatus = await this.checkNodeConnections();
      health.metrics.nodeStatus = nodeStatus;

      // Check wallet balances
      const balances = await this.checkWalletBalances();
      health.metrics.walletBalances = balances;

      // Check recent transactions
      const transactions = await this.checkRecentTransactions();
      health.metrics.recentTransactions = transactions;

      // Check error rates
      const errorRates = await this.checkErrorRates();
      health.metrics.errorRates = errorRates;

      // Update health status
      if (health.issues.length > 0) {
        health.status = 'degraded';
      }

      // Store health check results
      await this.collection.insertOne(health);

      return health;
    } catch (error) {
      console.error('Error checking system health:', error);
      throw error;
    }
  }

  async checkNodeConnections() {
    const status = {
      ethereum: false,
      solana: false,
      lightning: false,
    };

    try {
      // Check Ethereum node
      const ethBlock = await this.ethProvider.getBlockNumber();
      status.ethereum = true;
    } catch (error) {
      console.error('Ethereum node connection error:', error);
    }

    try {
      // Check Solana node
      const solSlot = await this.solConnection.getSlot();
      status.solana = true;
    } catch (error) {
      console.error('Solana node connection error:', error);
    }

    try {
      // Check Lightning node
      const lndInfo = await CryptoPaymentService.getLndInfo();
      status.lightning = true;
    } catch (error) {
      console.error('Lightning node connection error:', error);
    }

    return status;
  }

  async checkWalletBalances() {
    const balances = {
      ethereum: {},
      solana: {},
      lightning: {},
    };

    try {
      // Check Ethereum wallet balances
      const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, this.ethProvider);
      balances.ethereum = {
        address: ethWallet.address,
        eth: await this.ethProvider.getBalance(ethWallet.address),
        usdc: await this.getUsdcBalance(ethWallet.address),
      };
    } catch (error) {
      console.error('Error checking Ethereum balances:', error);
    }

    try {
      // Check Solana wallet balance
      const solWallet = new ethers.Wallet(process.env.SOL_PRIVATE_KEY);
      balances.solana = {
        address: solWallet.publicKey.toString(),
        sol: await this.solConnection.getBalance(solWallet.publicKey),
      };
    } catch (error) {
      console.error('Error checking Solana balance:', error);
    }

    try {
      // Check Lightning node balance
      balances.lightning = await CryptoPaymentService.getLndBalance();
    } catch (error) {
      console.error('Error checking Lightning balance:', error);
    }

    return balances;
  }

  async checkRecentTransactions() {
    const transactions = {
      ethereum: [],
      solana: [],
      lightning: [],
    };

    try {
      // Get recent Ethereum transactions
      const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, this.ethProvider);
      const ethHistory = await this.ethProvider.getHistory(ethWallet.address);
      transactions.ethereum = ethHistory.slice(0, 10);
    } catch (error) {
      console.error('Error fetching Ethereum transactions:', error);
    }

    try {
      // Get recent Solana transactions
      const solWallet = new ethers.Wallet(process.env.SOL_PRIVATE_KEY);
      const solHistory = await this.solConnection.getSignaturesForAddress(solWallet.publicKey);
      transactions.solana = solHistory.slice(0, 10);
    } catch (error) {
      console.error('Error fetching Solana transactions:', error);
    }

    try {
      // Get recent Lightning transactions
      transactions.lightning = await CryptoPaymentService.getRecentLightningTransactions();
    } catch (error) {
      console.error('Error fetching Lightning transactions:', error);
    }

    return transactions;
  }

  async checkErrorRates() {
    const errorRates = {
      ethereum: 0,
      solana: 0,
      lightning: 0,
      total: 0,
    };

    try {
      // Get recent errors from database
      const recentErrors = await this.collection
        .find({
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          type: 'error',
        })
        .toArray();

      // Calculate error rates by network
      recentErrors.forEach(error => {
        if (error.network) {
          errorRates[error.network]++;
        }
        errorRates.total++;
      });
    } catch (error) {
      console.error('Error calculating error rates:', error);
    }

    return errorRates;
  }

  async getUsdcBalance(address) {
    try {
      const contract = new ethers.Contract(
        process.env.USDC_ADDRESS,
        ['function balanceOf(address) view returns (uint256)'],
        this.ethProvider
      );
      return await contract.balanceOf(address);
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return null;
    }
  }

  async generateReport(startDate, endDate) {
    try {
      const report = {
        period: {
          start: startDate,
          end: endDate,
        },
        summary: {},
        details: {},
      };

      // Get transaction summary
      const transactions = await this.collection
        .find({
          timestamp: { $gte: startDate, $lte: endDate },
          type: 'transaction',
        })
        .toArray();

      // Calculate summary statistics
      report.summary = {
        totalTransactions: transactions.length,
        totalVolume: transactions.reduce((sum, tx) => sum + tx.amount, 0),
        successRate: transactions.filter(tx => tx.status === 'completed').length / transactions.length,
        averageProcessingTime: this.calculateAverageProcessingTime(transactions),
      };

      // Get detailed metrics
      report.details = {
        byCurrency: this.groupTransactionsByCurrency(transactions),
        byStatus: this.groupTransactionsByStatus(transactions),
        errorAnalysis: await this.analyzeErrors(startDate, endDate),
      };

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  calculateAverageProcessingTime(transactions) {
    const completedTransactions = transactions.filter(tx => tx.status === 'completed');
    if (completedTransactions.length === 0) return 0;

    const totalTime = completedTransactions.reduce((sum, tx) => {
      const processingTime = tx.completedAt - tx.createdAt;
      return sum + processingTime;
    }, 0);

    return totalTime / completedTransactions.length;
  }

  groupTransactionsByCurrency(transactions) {
    return transactions.reduce((acc, tx) => {
      if (!acc[tx.currency]) {
        acc[tx.currency] = {
          count: 0,
          volume: 0,
          successRate: 0,
        };
      }
      acc[tx.currency].count++;
      acc[tx.currency].volume += tx.amount;
      if (tx.status === 'completed') {
        acc[tx.currency].successRate++;
      }
      return acc;
    }, {});
  }

  groupTransactionsByStatus(transactions) {
    return transactions.reduce((acc, tx) => {
      if (!acc[tx.status]) {
        acc[tx.status] = 0;
      }
      acc[tx.status]++;
      return acc;
    }, {});
  }

  async analyzeErrors(startDate, endDate) {
    const errors = await this.collection
      .find({
        timestamp: { $gte: startDate, $lte: endDate },
        type: 'error',
      })
      .toArray();

    return {
      totalErrors: errors.length,
      byType: this.groupErrorsByType(errors),
      byNetwork: this.groupErrorsByNetwork(errors),
      commonIssues: this.identifyCommonIssues(errors),
    };
  }

  groupErrorsByType(errors) {
    return errors.reduce((acc, error) => {
      if (!acc[error.type]) {
        acc[error.type] = 0;
      }
      acc[error.type]++;
      return acc;
    }, {});
  }

  groupErrorsByNetwork(errors) {
    return errors.reduce((acc, error) => {
      if (!acc[error.network]) {
        acc[error.network] = 0;
      }
      acc[error.network]++;
      return acc;
    }, {});
  }

  identifyCommonIssues(errors) {
    const issueCounts = errors.reduce((acc, error) => {
      const issue = error.message.split(':')[0];
      if (!acc[issue]) {
        acc[issue] = 0;
      }
      acc[issue]++;
      return acc;
    }, {});

    return Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }
}

export default new CryptoMonitoringService(); 