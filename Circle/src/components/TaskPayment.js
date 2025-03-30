import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PaymentService from '../services/PaymentService';
import QRCode from 'react-native-qrcode-svg';

const TaskPayment = ({ task, onPaymentComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [lightningInvoice, setLightningInvoice] = useState(null);

  useEffect(() => {
    checkPaymentStatus();
  }, [task.id]);

  const checkPaymentStatus = async () => {
    try {
      const status = await PaymentService.getPaymentStatus(task.id);
      setPaymentStatus(status);
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const result = await PaymentService.processPayment(task, paymentMethod);
      if (result.paymentMethod === 'lightning') {
        setLightningInvoice(result.lightningInvoice);
      }
      await checkPaymentStatus();
      onPaymentComplete();
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    try {
      setIsLoading(true);
      await PaymentService.releasePayment(task.id, paymentMethod);
      await checkPaymentStatus();
      onPaymentComplete();
    } catch (error) {
      console.error('Error releasing payment:', error);
      Alert.alert('Error', 'Failed to release payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundPayment = async () => {
    try {
      setIsLoading(true);
      await PaymentService.refundPayment(task.id, paymentMethod);
      await checkPaymentStatus();
      onPaymentComplete();
    } catch (error) {
      console.error('Error refunding payment:', error);
      Alert.alert('Error', 'Failed to refund payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentMethodSelector = () => (
    <View style={styles.paymentMethodContainer}>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.paymentMethodButtons}>
        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            paymentMethod === 'stripe' && styles.paymentMethodButtonActive
          ]}
          onPress={() => setPaymentMethod('stripe')}
        >
          <MaterialIcons name="credit-card" size={24} color={paymentMethod === 'stripe' ? '#FFFFFF' : '#666'} />
          <Text style={[
            styles.paymentMethodButtonText,
            paymentMethod === 'stripe' && styles.paymentMethodButtonTextActive
          ]}>
            Credit Card
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            paymentMethod === 'lightning' && styles.paymentMethodButtonActive
          ]}
          onPress={() => setPaymentMethod('lightning')}
        >
          <MaterialIcons name="currency-bitcoin" size={24} color={paymentMethod === 'lightning' ? '#FFFFFF' : '#666'} />
          <Text style={[
            styles.paymentMethodButtonText,
            paymentMethod === 'lightning' && styles.paymentMethodButtonTextActive
          ]}>
            Bitcoin Lightning
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLightningInvoice = () => {
    if (!lightningInvoice) return null;

    return (
      <View style={styles.lightningInvoiceContainer}>
        <Text style={styles.sectionTitle}>Lightning Invoice</Text>
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={lightningInvoice.paymentRequest}
            size={200}
          />
        </View>
        <Text style={styles.invoiceText}>
          Scan this QR code with your Lightning wallet to pay
        </Text>
        <Text style={styles.invoiceAmount}>
          {lightningInvoice.btcAmount} sats
        </Text>
      </View>
    );
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'pending':
        return (
          <View style={styles.statusContainer}>
            <MaterialIcons name="schedule" size={24} color="#FFA000" />
            <Text style={styles.statusText}>Payment Pending</Text>
          </View>
        );
      case 'held':
        return (
          <View style={styles.statusContainer}>
            <MaterialIcons name="lock" size={24} color="#2196F3" />
            <Text style={styles.statusText}>Payment Held in Escrow</Text>
          </View>
        );
      case 'completed':
        return (
          <View style={styles.statusContainer}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.statusText}>Payment Completed</Text>
          </View>
        );
      case 'refunded':
        return (
          <View style={styles.statusContainer}>
            <MaterialIcons name="refresh" size={24} color="#F44336" />
            <Text style={styles.statusText}>Payment Refunded</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderPaymentActions = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      );
    }

    switch (paymentStatus) {
      case 'pending':
        return (
          <>
            {renderPaymentMethodSelector()}
            {paymentMethod === 'lightning' && renderLightningInvoice()}
            <TouchableOpacity
              style={styles.button}
              onPress={handlePayment}
            >
              <Text style={styles.buttonText}>
                {paymentMethod === 'lightning' ? 'Generate Invoice' : 'Pay Now'}
              </Text>
            </TouchableOpacity>
          </>
        );
      case 'held':
        return (
          <TouchableOpacity
            style={styles.button}
            onPress={handleReleasePayment}
          >
            <Text style={styles.buttonText}>Release Payment</Text>
          </TouchableOpacity>
        );
      case 'completed':
        return (
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>Payment has been completed</Text>
          </View>
        );
      case 'refunded':
        return (
          <TouchableOpacity
            style={[styles.button, styles.refundButton]}
            onPress={handlePayment}
          >
            <Text style={styles.buttonText}>Pay Again</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Task Payment</Text>
        <Text style={styles.amount}>${task.budget.toFixed(2)}</Text>
      </View>

      {renderPaymentStatus()}

      <View style={styles.details}>
        <Text style={styles.label}>Task ID:</Text>
        <Text style={styles.value}>{task.id}</Text>
        
        <Text style={styles.label}>Created:</Text>
        <Text style={styles.value}>
          {new Date(task.createdAt).toLocaleDateString()}
        </Text>

        <Text style={styles.label}>Assignee:</Text>
        <Text style={styles.value}>{task.assignee.name}</Text>
      </View>

      {renderPaymentActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  details: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  paymentMethodContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  paymentMethodButtonText: {
    fontSize: 16,
    color: '#666',
  },
  paymentMethodButtonTextActive: {
    color: '#FFFFFF',
  },
  lightningInvoiceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
  },
  invoiceText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refundButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  completedContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 16,
  },
});

export default TaskPayment; 