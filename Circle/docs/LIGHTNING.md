# Bitcoin Lightning Network Integration

## Overview

TaskTaxi.Co supports Bitcoin Lightning Network payments as an alternative to traditional credit card payments. This integration allows users to pay for tasks using Bitcoin through the Lightning Network, providing fast, secure, and low-cost transactions.

## Features

- Real-time BTC/USD exchange rates from multiple sources
- Automatic invoice generation and management
- QR code-based payment interface
- Transaction status monitoring
- Automatic refund processing
- Error handling and retry mechanisms
- Detailed transaction history

## Technical Implementation

### Prerequisites

1. Lightning Network Daemon (LND) node
2. Required environment variables:
   ```
   LND_SOCKET=your_lnd_socket
   LND_CERT_PATH=path_to_cert
   LND_MACAROON_PATH=path_to_macaroon
   LND_PROXY_URL=your_proxy_url
   ```

### Components

#### ExchangeRateService
- Fetches real-time BTC/USD rates from multiple exchanges
- Implements caching to reduce API calls
- Provides USD to BTC conversion utilities

#### LightningService
- Handles Lightning Network operations
- Manages invoice creation and payment processing
- Implements error handling and retry logic
- Maintains transaction history

### Database Schema

#### lightning_payments Collection
```javascript
{
  taskId: String,
  amount: Number,          // USD amount
  btcAmount: Number,      // Amount in satoshis
  btcRate: Number,        // BTC/USD rate at time of creation
  invoiceId: String,      // Lightning invoice ID
  paymentRequest: String, // Lightning payment request
  status: String,         // pending, completed, refunded, expired
  createdAt: Date,
  expiresAt: Date,
  completedAt: Date,
  refundedAt: Date,
  transactionId: String,
  transactionDetails: {
    fee: Number,
    feeRate: Number,
    hops: Number,
    confirmedAt: Date
  },
  refundDetails: {
    btcAmount: Number,
    btcRate: Number,
    usdAmount: Number
  },
  metadata: {
    taskTitle: String,
    creatorId: String,
    assigneeId: String,
    retryCount: Number
  },
  errorHistory: [{
    timestamp: Date,
    error: String,
    type: String,
    stack: String
  }]
}
```

## Error Handling

The system handles various types of errors:

1. **INVOICE_EXPIRED**: Invoice has passed its expiration time
2. **INSUFFICIENT_FUNDS**: Not enough funds to process payment
3. **NETWORK_ERROR**: Connection issues with Lightning Network
4. **INVALID_INVOICE**: Malformed or invalid invoice
5. **PAYMENT_FAILED**: Payment processing failed
6. **REFUND_FAILED**: Refund processing failed

### Retry Mechanism

- Automatic retries for failed operations
- Exponential backoff between retries
- Maximum retry count of 3 attempts
- Detailed error logging

## Security Considerations

1. **Private Keys**: Never store private keys in the application
2. **Certificates**: Use secure storage for LND certificates
3. **Macaroons**: Implement proper macaroon management
4. **Rate Limiting**: Implement API rate limiting
5. **Input Validation**: Validate all user inputs
6. **Error Messages**: Avoid exposing sensitive information in error messages

## Monitoring and Maintenance

### Health Checks

1. **Node Status**: Monitor LND node connectivity
2. **Balance**: Track available funds
3. **Channel Status**: Monitor channel health
4. **Error Rates**: Track error frequencies
5. **Transaction Times**: Monitor payment processing times

### Backup Procedures

1. **Database Backups**: Regular backups of payment records
2. **Node Backups**: Regular LND node backups
3. **Recovery Procedures**: Document recovery steps

## User Guide

### Making a Payment

1. Select "Bitcoin Lightning" as payment method
2. Review the payment amount in both USD and BTC
3. Scan the QR code with a Lightning wallet
4. Confirm the payment in your wallet
5. Wait for payment confirmation

### Receiving a Payment

1. Ensure your Lightning node has sufficient capacity
2. Monitor incoming payments
3. Check payment status in the app
4. Process refunds if necessary

### Troubleshooting

1. **Payment Not Confirmed**
   - Check network connectivity
   - Verify invoice expiration
   - Contact support if issues persist

2. **Failed Payment**
   - Check wallet balance
   - Verify network status
   - Try alternative payment method

3. **Refund Issues**
   - Verify payment status
   - Check refund eligibility
   - Contact support for assistance

## API Reference

### LightningService Methods

#### createInvoice(task)
```javascript
async createInvoice(task) {
  // Creates a Lightning invoice for the task
  // Returns: { id, paymentRequest, btcAmount }
}
```

#### payInvoice(paymentId)
```javascript
async payInvoice(paymentId) {
  // Processes payment for an invoice
  // Returns: { id, fee, feeRate, hops }
}
```

#### getPaymentStatus(paymentId)
```javascript
async getPaymentStatus(paymentId) {
  // Gets current payment status
  // Returns: 'pending' | 'completed' | 'refunded' | 'expired'
}
```

#### refundPayment(paymentId)
```javascript
async refundPayment(paymentId) {
  // Processes refund for a payment
  // Returns: { id, paymentRequest }
}
```

## Future Improvements

1. **Multi-currency Support**
   - Add support for other cryptocurrencies
   - Implement cross-currency payments

2. **Advanced Features**
   - Atomic swaps
   - Multi-hop payments
   - Channel management

3. **User Experience**
   - Better error messages
   - Payment progress indicators
   - Transaction history view

4. **Security**
   - Hardware wallet integration
   - Multi-signature support
   - Advanced authentication

## Support

For technical support or questions about the Lightning Network integration, please contact:
- Email: support@tasktaxi.co
- Documentation: https://docs.tasktaxi.co/lightning
- GitHub Issues: https://github.com/tasktaxi/lightning/issues 