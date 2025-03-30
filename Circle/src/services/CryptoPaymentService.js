import { db } from '../config/database';
import ExchangeRateService from './ExchangeRateService';
import LightningService from './LightningService';
import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

class CryptoPaymentService {
  constructor() {
    this.collection = db.collection('crypto_payments');
    this.supportedCurrencies = {
      BTC: {
        name: 'Bitcoin',
        network: 'Lightning',
        service: LightningService,
        decimals: 8,
        icon: 'currency-bitcoin',
      },
      ETH: {
        name: 'Ethereum',
        network: 'Ethereum',
        decimals: 18,
        icon: 'currency-eth',
      },
      SOL: {
        name: 'Solana',
        network: 'Solana',
        decimals: 9,
        icon: 'currency-sol',
      },
      USDC: {
        name: 'USD Coin',
        network: 'Ethereum',
        decimals: 6,
        icon: 'currency-usd',
      },
    };

    // Initialize providers
    this.ethProvider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
    this.solConnection = new Connection(process.env.SOL_RPC_URL);
  }

  async createPayment(task, currency) {
    try {
      const currencyConfig = this.supportedCurrencies[currency];
      if (!currencyConfig) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      // Get exchange rate
      const rate = await ExchangeRateService.getRate(currency);
      const cryptoAmount = this.convertUsdToCrypto(task.budget, rate, currencyConfig.decimals);

      let payment;
      switch (currency) {
        case 'BTC':
          payment = await LightningService.createInvoice(task);
          break;
        case 'ETH':
        case 'USDC':
          payment = await this.createEthPayment(task, currency, cryptoAmount);
          break;
        case 'SOL':
          payment = await this.createSolPayment(task, cryptoAmount);
          break;
        default:
          throw new Error(`Unsupported currency: ${currency}`);
      }

      // Store payment in database
      const paymentRecord = {
        taskId: task.id,
        amount: task.budget,
        cryptoAmount,
        currency,
        rate,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        paymentDetails: payment,
        metadata: {
          taskTitle: task.title,
          creatorId: task.creatorId,
          assigneeId: task.assigneeId,
        },
        errorHistory: [],
      };

      const result = await this.collection.insertOne(paymentRecord);
      return { ...paymentRecord, id: result.insertedId };
    } catch (error) {
      await this.logError(task.id, error);
      throw error;
    }
  }

  async createEthPayment(task, currency, amount) {
    const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, this.ethProvider);
    const contract = new ethers.Contract(
      currency === 'ETH' ? process.env.ETH_WRAPPED_ADDRESS : process.env.USDC_ADDRESS,
      currency === 'ETH' ? this.getWethAbi() : this.getUsdcAbi(),
      wallet
    );

    const tx = await contract.transfer(task.assignee.address, amount);
    return {
      txHash: tx.hash,
      from: wallet.address,
      to: task.assignee.address,
      amount,
      currency,
    };
  }

  async createSolPayment(task, amount) {
    const wallet = new ethers.Wallet(process.env.SOL_PRIVATE_KEY);
    const transaction = new Transaction().add(
      // Add transfer instruction
    );

    const signature = await this.solConnection.sendTransaction(transaction);
    return {
      signature,
      from: wallet.publicKey.toString(),
      to: task.assignee.solAddress,
      amount,
    };
  }

  async getPaymentStatus(paymentId) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      if (!payment) return null;

      // Check expiration
      if (new Date(payment.expiresAt) < new Date() && payment.status === 'pending') {
        await this.collection.updateOne(
          { _id: paymentId },
          { $set: { status: 'expired', expiredAt: new Date() } }
        );
        return 'expired';
      }

      // Get status based on currency
      let status;
      switch (payment.currency) {
        case 'BTC':
          status = await LightningService.getPaymentStatus(payment.paymentDetails.invoiceId);
          break;
        case 'ETH':
        case 'USDC':
          status = await this.getEthTransactionStatus(payment.paymentDetails.txHash);
          break;
        case 'SOL':
          status = await this.getSolTransactionStatus(payment.paymentDetails.signature);
          break;
      }

      // Update payment status if changed
      if (status === 'completed' && payment.status !== 'completed') {
        await this.collection.updateOne(
          { _id: paymentId },
          { 
            $set: { 
              status: 'completed',
              completedAt: new Date(),
            }
          }
        );
      }

      return payment.status;
    } catch (error) {
      await this.logError(paymentId, error);
      throw error;
    }
  }

  async getEthTransactionStatus(txHash) {
    const receipt = await this.ethProvider.getTransactionReceipt(txHash);
    return receipt ? 'completed' : 'pending';
  }

  async getSolTransactionStatus(signature) {
    const status = await this.solConnection.getSignatureStatus(signature);
    return status?.confirmationStatus === 'confirmed' ? 'completed' : 'pending';
  }

  async refundPayment(paymentId) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      if (!payment || payment.status !== 'completed') {
        throw new Error('Invalid payment for refund');
      }

      let refundDetails;
      switch (payment.currency) {
        case 'BTC':
          refundDetails = await LightningService.refundPayment(payment.paymentDetails.invoiceId);
          break;
        case 'ETH':
        case 'USDC':
          refundDetails = await this.createEthPayment(
            { ...payment, assignee: { address: payment.metadata.creatorId } },
            payment.currency,
            payment.cryptoAmount
          );
          break;
        case 'SOL':
          refundDetails = await this.createSolPayment(
            { ...payment, assignee: { solAddress: payment.metadata.creatorId } },
            payment.cryptoAmount
          );
          break;
      }

      await this.collection.updateOne(
        { _id: paymentId },
        { 
          $set: { 
            status: 'refunded',
            refundedAt: new Date(),
            refundDetails,
          }
        }
      );

      return refundDetails;
    } catch (error) {
      await this.logError(paymentId, error);
      throw error;
    }
  }

  convertUsdToCrypto(usdAmount, rate, decimals) {
    const amount = (usdAmount / rate) * Math.pow(10, decimals);
    return Math.round(amount);
  }

  async logError(paymentId, error) {
    try {
      await this.collection.updateOne(
        { _id: paymentId },
        {
          $push: {
            errorHistory: {
              timestamp: new Date(),
              error: error.message,
              type: error.type,
              stack: error.stack,
            }
          }
        }
      );
    } catch (logError) {
      console.error('Error logging error:', logError);
    }
  }

  getWethAbi() {
    return [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
    ];
  }

  getUsdcAbi() {
    return [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];
  }
}

export default new CryptoPaymentService(); 