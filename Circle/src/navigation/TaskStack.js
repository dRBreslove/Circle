import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TaskListScreen from '../screens/TaskListScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import TaskMapScreen from '../screens/TaskMapScreen';
import TaskPaymentScreen from '../screens/TaskPaymentScreen';

const Stack = createStackNavigator();

const TaskStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{
          title: 'Tasks',
        }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{
          title: 'Create Task',
        }}
      />
      <Stack.Screen
        name="TaskDetails"
        component={TaskDetailsScreen}
        options={{
          title: 'Task Details',
        }}
      />
      <Stack.Screen
        name="TaskMap"
        component={TaskMapScreen}
        options={{
          title: 'Task Map',
        }}
      />
      <Stack.Screen
        name="TaskPayment"
        component={TaskPaymentScreen}
        options={{
          title: 'Task Payment',
        }}
      />
    </Stack.Navigator>
  );
};

export default TaskStack; 