import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import TaskForm from '../components/TaskForm';
import TaskService from '../services/TaskService';

const CreateTaskScreen = ({ navigation }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (taskData) => {
    try {
      setIsSubmitting(true);
      const newTask = await TaskService.createTask(taskData);
      Alert.alert(
        'Success',
        'Task created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('TaskDetails', { task: newTask })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TaskForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
});

export default CreateTaskScreen; 