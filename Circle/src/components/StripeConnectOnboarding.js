import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import StripeService from '../services/StripeService';

const StripeConnectOnboarding = ({ userId, userData, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [accountLink, setAccountLink] = useState(null);

  useEffect(() => {
    checkStripeAccount();
  }, [userId]);

  const checkStripeAccount = async () => {
    try {
      const account = await StripeService.createConnectAccount(userId, userData);
      if (account.details_submitted) {
        onComplete(account);
      } else {
        const link = await StripeService.createAccountLink(account.id);
        setAccountLink(link.url);
      }
    } catch (error) {
      console.error('Error checking Stripe account:', error);
      Alert.alert('Error', 'Failed to set up payment account. Please try again.');
    }
  };

  const handleStartOnboarding = async () => {
    try {
      setIsLoading(true);
      if (accountLink) {
        await Linking.openURL(accountLink);
      }
    } catch (error) {
      console.error('Error opening account link:', error);
      Alert.alert('Error', 'Failed to open payment setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-balance-wallet" size={48} color="#4CAF50" />
        <Text style={styles.title}>Set Up Payments</Text>
        <Text style={styles.subtitle}>
          To receive payments for completed tasks, you need to set up your payment account.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          We use Stripe to process payments securely. You'll need to:
        </Text>
        <View style={styles.steps}>
          <View style={styles.step}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.stepText}>Provide your bank account details</Text>
          </View>
          <View style={styles.step}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.stepText}>Verify your identity</Text>
          </View>
          <View style={styles.step}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.stepText}>Set up your payment preferences</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleStartOnboarding}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Setting up...' : 'Start Setup'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
  },
  steps: {
    marginTop: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StripeConnectOnboarding; 