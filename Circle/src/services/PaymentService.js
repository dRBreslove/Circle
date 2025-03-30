import { db } from '../config/database';
import TaskService from './TaskService';
import StripeService from './StripeService';
import LightningService from './LightningService';

class PaymentService {
  constructor() {
    this.collection = db.collection('payments');
  }

  async processPayment(task, paymentMethod = 'stripe') {
    try {
      let payment;
      
      if (paymentMethod === 'lightning') {
        // Process Lightning payment
        payment = await LightningService.createInvoice(task);
      } else {
        // Process Stripe payment
        const paymentIntent = await StripeService.createPaymentIntent(task);
        payment = await this.createPaymentRecord(paymentIntent, task);
      }

      // Hold funds in escrow
      await this.holdFunds(payment.id, paymentMethod);
      
      // Process payment
      const result = await this.processPaymentIntent(payment.id, paymentMethod);
      
      return {
        success: true,
        transactionId: result.id,
        paymentMethod
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  async createPaymentRecord(paymentIntent, task) {
    try {
      const payment = {
        taskId: task.id,
        amount: task.budget,
        currency: 'USD',
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        paymentMethod: 'stripe',
        createdAt: new Date(),
        metadata: {
          taskTitle: task.title,
          creatorId: task.creatorId,
          assigneeId: task.assigneeId
        }
      };

      const result = await this.collection.insertOne(payment);
      return { ...payment, id: result.insertedId };
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }

  async holdFunds(paymentId, paymentMethod) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      
      if (paymentMethod === 'stripe') {
        // Confirm payment with Stripe
        await StripeService.confirmPayment(payment.stripePaymentIntentId);
      } else {
        // For Lightning, we don't need to hold funds as they're held in escrow by the network
        // Just update the status
      }
      
      // Update payment status
      await this.collection.updateOne(
        { _id: paymentId },
        { $set: { status: 'held' } }
      );
    } catch (error) {
      console.error('Error holding funds:', error);
      throw error;
    }
  }

  async processPaymentIntent(paymentId, paymentMethod) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      
      let status;
      if (paymentMethod === 'stripe') {
        status = await StripeService.getPaymentStatus(payment.stripePaymentIntentId);
      } else {
        status = await LightningService.getPaymentStatus(paymentId);
      }
      
      if (status === 'succeeded' || status === 'completed') {
        // Update payment status
        await this.collection.updateOne(
          { _id: paymentId },
          { 
            $set: { 
              status: 'completed',
              completedAt: new Date()
            }
          }
        );

        return {
          id: paymentId,
          success: true
        };
      } else {
        throw new Error(`Payment failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error processing payment intent:', error);
      throw error;
    }
  }

  async releasePayment(paymentId, paymentMethod) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      
      if (paymentMethod === 'stripe') {
        // Release funds through Stripe
        await StripeService.confirmPayment(payment.stripePaymentIntentId);
      } else {
        // For Lightning, we don't need to release funds as they're already transferred
        // Just update the status
      }
      
      // Update payment status
      const result = await this.collection.updateOne(
        { _id: paymentId },
        { 
          $set: { 
            status: 'released',
            releasedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error releasing payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentId, paymentMethod) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      
      if (paymentMethod === 'stripe') {
        // Process refund through Stripe
        await StripeService.refundPayment(payment.stripePaymentIntentId);
      } else {
        // Process refund through Lightning
        await LightningService.refundPayment(paymentId);
      }
      
      // Update payment status
      const result = await this.collection.updateOne(
        { _id: paymentId },
        { 
          $set: { 
            status: 'refunded',
            refundedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const payment = await this.collection.findOne({ _id: paymentId });
      return payment?.status;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }
}

export default new PaymentService(); 