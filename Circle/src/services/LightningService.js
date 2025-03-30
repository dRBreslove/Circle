import { db } from '../config/database';
import { createInvoice, payInvoice, getInvoiceStatus } from 'lightning';
import { lnd } from '../config/lightning';
import ExchangeRateService from './ExchangeRateService';

class LightningService {
  constructor() {
    this.collection = db.collection('lightning_payments');
    this.errorTypes = {
      INVOICE_EXPIRED: 'INVOICE_EXPIRED',
      INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
      NETWORK_ERROR: 'NETWORK_ERROR',
      INVALID_INVOICE: 'INVALID_INVOICE',
      PAYMENT_FAILED: 'PAYMENT_FAILED',
      REFUND_FAILED: 'REFUND_FAILED',
    };
  }

  async createInvoice(task) {
    try {
      // Get real-time BTC/USD rate
      const btcRate = await ExchangeRateService.getBtcUsdRate();
      const btcAmount = ExchangeRateService.convertUsdToBtc(task.budget);

      // Create Lightning invoice with retry logic
      let invoice;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          invoice = await createInvoice({
            lnd,
            tokens: btcAmount,
            description: `Payment for task: ${task.title}`,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
          });
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw this.handleError(error, 'createInvoice');
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Store invoice in database with additional metadata
      const payment = {
        taskId: task.id,
        amount: task.budget,
        btcAmount,
        btcRate,
        invoiceId: invoice.id,
        paymentRequest: invoice.request,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: invoice.expires_at,
        metadata: {
          taskTitle: task.title,
          creatorId: task.creatorId,
          assigneeId: task.assigneeId,
          retryCount,
        },
        errorHistory: [],
      };

      const result = await this.collection.insertOne(payment);
      return { ...payment, id: result.insertedId };
    } catch (error) {
      const handledError = this.handleError(error, 'createInvoice');
      await this.logError(task.id, handledError);
      throw handledError;
    }
  }

  async payInvoice(paymentId) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check if invoice is expired
      if (new Date(payment.expiresAt) < new Date()) {
        throw new Error(this.errorTypes.INVOICE_EXPIRED);
      }

      // Pay the invoice with retry logic
      let result;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          result = await payInvoice({
            lnd,
            request: payment.paymentRequest,
          });
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw this.handleError(error, 'payInvoice');
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Update payment status with transaction details
      await this.collection.updateOne(
        { _id: paymentId },
        { 
          $set: { 
            status: 'completed',
            completedAt: new Date(),
            transactionId: result.id,
            transactionDetails: {
              fee: result.fee,
              feeRate: result.fee_rate,
              hops: result.hops,
            },
            metadata: {
              ...payment.metadata,
              retryCount,
            }
          }
        }
      );

      return result;
    } catch (error) {
      const handledError = this.handleError(error, 'payInvoice');
      await this.logError(paymentId, handledError);
      throw handledError;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      if (!payment) return null;

      // Check if invoice is expired
      if (new Date(payment.expiresAt) < new Date() && payment.status === 'pending') {
        await this.collection.updateOne(
          { _id: paymentId },
          { 
            $set: { 
              status: 'expired',
              expiredAt: new Date()
            }
          }
        );
        return 'expired';
      }

      // Get invoice status from Lightning node
      const status = await getInvoiceStatus({
        lnd,
        id: payment.invoiceId,
      });

      // Update payment status if changed
      if (status.is_confirmed && payment.status !== 'completed') {
        await this.collection.updateOne(
          { _id: paymentId },
          { 
            $set: { 
              status: 'completed',
              completedAt: new Date(),
              transactionDetails: {
                ...payment.transactionDetails,
                confirmedAt: new Date(),
              }
            }
          }
        );
      }

      return payment.status;
    } catch (error) {
      const handledError = this.handleError(error, 'getPaymentStatus');
      await this.logError(paymentId, handledError);
      throw handledError;
    }
  }

  async refundPayment(paymentId) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      // Get current BTC rate for refund
      const btcRate = await ExchangeRateService.getBtcUsdRate();
      
      // Create a new invoice for the refund
      const refundInvoice = await createInvoice({
        lnd,
        tokens: payment.btcAmount,
        description: `Refund for task: ${payment.metadata.taskTitle}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Update payment status with refund details
      await this.collection.updateOne(
        { _id: paymentId },
        { 
          $set: { 
            status: 'refunded',
            refundedAt: new Date(),
            refundInvoiceId: refundInvoice.id,
            refundPaymentRequest: refundInvoice.request,
            refundDetails: {
              btcAmount: payment.btcAmount,
              btcRate,
              usdAmount: payment.amount,
            }
          }
        }
      );

      return refundInvoice;
    } catch (error) {
      const handledError = this.handleError(error, 'refundPayment');
      await this.logError(paymentId, handledError);
      throw handledError;
    }
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

  handleError(error, operation) {
    // Map common Lightning Network errors to our error types
    if (error.message.includes('insufficient funds')) {
      return new Error(this.errorTypes.INSUFFICIENT_FUNDS);
    }
    if (error.message.includes('network error')) {
      return new Error(this.errorTypes.NETWORK_ERROR);
    }
    if (error.message.includes('invalid invoice')) {
      return new Error(this.errorTypes.INVALID_INVOICE);
    }
    if (error.message.includes('payment failed')) {
      return new Error(this.errorTypes.PAYMENT_FAILED);
    }
    if (error.message.includes('refund failed')) {
      return new Error(this.errorTypes.REFUND_FAILED);
    }

    // Add operation context to error
    error.operation = operation;
    return error;
  }
}

export default new LightningService(); 