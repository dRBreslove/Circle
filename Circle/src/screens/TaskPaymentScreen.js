import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import StripeConnectOnboarding from '../components/StripeConnectOnboarding';
import TaskPayment from '../components/TaskPayment';
import TaskService from '../services/TaskService';

const TaskPaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { taskId, userId, userData } = route.params;
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStripeAccount, setHasStripeAccount] = useState(false);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      const taskData = await TaskService.getTask(taskId);
      setTask(taskData);
      // Check if user has Stripe account
      setHasStripeAccount(!!taskData.assignee.stripeAccountId);
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task details. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeOnboardingComplete = (account) => {
    setHasStripeAccount(true);
  };

  const handlePaymentComplete = async () => {
    await loadTask();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      {!hasStripeAccount ? (
        <StripeConnectOnboarding
          userId={userId}
          userData={userData}
          onComplete={handleStripeOnboardingComplete}
        />
      ) : (
        <TaskPayment
          task={task}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default TaskPaymentScreen; 