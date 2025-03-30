import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import TaskDetails from '../components/TaskDetails';
import TaskProgress from '../components/TaskProgress';
import TaskService from '../services/TaskService';
import PaymentService from '../services/PaymentService';
import TaskMap from '../components/TaskMap';

const TaskDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { taskId, userId } = route.params;
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'progress'

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      const taskData = await TaskService.getTask(taskId);
      setTask(taskData);
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task details. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTask = async () => {
    try {
      const updatedTask = await TaskService.acceptTask(task.id);
      setTask(updatedTask);
      Alert.alert('Success', 'Task accepted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept task. Please try again.');
    }
  };

  const handleCompleteTask = async () => {
    try {
      const updatedTask = await TaskService.completeTask(task.id);
      setTask(updatedTask);
      await PaymentService.processPayment(task.id);
      Alert.alert('Success', 'Task completed and payment processed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const handleCancelTask = async () => {
    try {
      const updatedTask = await TaskService.cancelTask(task.id);
      setTask(updatedTask);
      Alert.alert('Success', 'Task cancelled successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel task. Please try again.');
    }
  };

  const handleUpdateProgress = async (progress) => {
    try {
      const updatedTask = await TaskService.updateTaskProgress(task.id, progress);
      setTask(updatedTask);
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress. Please try again.');
    }
  };

  const handleAddComment = async (comment) => {
    try {
      const updatedTask = await TaskService.addTaskComment(task.id, comment);
      setTask(updatedTask);
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  const handlePaymentPress = () => {
    navigation.navigate('TaskPayment', {
      taskId,
      userId,
      userData: {
        name: task.assignee.name,
        email: task.assignee.email,
      },
    });
  };

  const renderTabButton = (tabName, label) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabName && styles.tabButtonActive
      ]}
      onPress={() => setActiveTab(tabName)}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tabName && styles.tabButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.status}>{task.status}</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('details', 'Details')}
        {renderTabButton('progress', 'Progress')}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'details' ? (
          <TaskDetails
            task={task}
            onAcceptTask={handleAcceptTask}
            onCompleteTask={handleCompleteTask}
            onCancelTask={handleCancelTask}
          />
        ) : (
          <TaskProgress
            task={task}
            onUpdateProgress={handleUpdateProgress}
            onAddComment={handleAddComment}
          />
        )}
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <TaskMap location={task.location} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assignee</Text>
        <Text style={styles.assignee}>{task.assignee.name}</Text>
      </View>

      {task.status === 'completed' && (
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={handlePaymentPress}
        >
          <MaterialIcons name="payment" size={24} color="#FFFFFF" />
          <Text style={styles.paymentButtonText}>Process Payment</Text>
        </TouchableOpacity>
      )}
    </View>
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
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#666',
  },
  tabButtonTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  budget: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  assignee: {
    fontSize: 16,
    color: '#666',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 24,
    borderRadius: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TaskDetailsScreen; 