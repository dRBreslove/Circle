import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TaskCard = ({ task, onPress, onAccept }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'assigned':
        return '#4169E1';
      case 'in_progress':
        return '#32CD32';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#FF0000';
      default:
        return '#808080';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#FF0000';
      case 'medium':
        return '#FFA500';
      case 'low':
        return '#4CAF50';
      default:
        return '#808080';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{task.status}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {task.description}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MaterialIcons name="attach-money" size={16} color="#4CAF50" />
          <Text style={styles.detailText}>${task.budget}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={16} color="#4169E1" />
          <Text style={styles.detailText}>
            {new Date(task.deadline).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="flag" size={16} color={getPriorityColor(task.priority)} />
          <Text style={styles.detailText}>{task.priority}</Text>
        </View>
      </View>

      {task.status === 'pending' && (
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => onAccept(task)}
        >
          <Text style={styles.acceptButtonText}>Accept Task</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TaskCard; 