import { db } from '../config/database';
import stripe from 'stripe';

class StripeService {
  constructor() {
    this.stripe = stripe(process.env.STRIPE_SECRET_KEY);
    this.collection = db.collection('stripe_accounts');
  }

  async createConnectAccount(userId, userData) {
    try {
      // Create a Stripe Connect account for the user
      const account = await this.stripe.accounts.create({
        type: 'express',
        email: userData.email,
        business_profile: {
          name: userData.name,
          url: `https://circletaxi.co/user/${userId}`,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Store the Stripe account ID
      await this.collection.updateOne(
        { userId },
        { 
          $set: { 
            stripeAccountId: account.id,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      return account;
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw error;
    }
  }

  async createPaymentIntent(task) {
    try {
      const { creatorId, assigneeId, budget } = task;
      
      // Get Stripe account IDs
      const creatorAccount = await this.collection.findOne({ userId: creatorId });
      const assigneeAccount = await this.collection.findOne({ userId: assigneeId });

      if (!creatorAccount?.stripeAccountId || !assigneeAccount?.stripeAccountId) {
        throw new Error('Missing Stripe account information');
      }

      // Calculate platform fee (10%)
      const platformFee = Math.round(budget * 0.1);
      const transferAmount = budget - platformFee;

      // Create payment intent with transfer
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: budget * 100, // Convert to cents
        currency: 'usd',
        application_fee_amount: platformFee * 100,
        transfer_data: {
          destination: assigneeAccount.stripeAccountId,
          amount: transferAmount * 100,
        },
        metadata: {
          taskId: task.id,
          creatorId,
          assigneeId,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentIntentId) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
      return refund;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  async createAccountLink(accountId) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.APP_URL}/account/refresh`,
        return_url: `${process.env.APP_URL}/account/return`,
        type: 'account_onboarding',
      });
      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw error;
    }
  }
}

export default new StripeService(); 