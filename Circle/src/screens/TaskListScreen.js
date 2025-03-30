import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import TaskList from '../components/TaskList';
import TaskService from '../services/TaskService';

const TaskListScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadTasks = async (pageNum = 1, refresh = false) => {
    try {
      setIsLoading(true);
      const newTasks = await TaskService.getTasks(pageNum, pageSize);
      
      if (refresh) {
        setTasks(newTasks);
      } else {
        setTasks(prev => [...prev, ...newTasks]);
      }
      
      setHasMore(newTasks.length === pageSize);
      setPage(pageNum);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks(1, true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTasks(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadTasks(page + 1);
    }
  };

  const handleTaskPress = (task) => {
    navigation.navigate('TaskDetails', { task });
  };

  const handleCreateTask = () => {
    navigation.navigate('CreateTask');
  };

  const handleMapView = () => {
    navigation.navigate('TaskMap', { tasks });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMapView}
          >
            <MaterialIcons name="map" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCreateTask}
          >
            <MaterialIcons name="add" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      <TaskList
        tasks={tasks}
        onTaskPress={handleTaskPress}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        hasMore={hasMore}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
  },
});

export default TaskListScreen; 