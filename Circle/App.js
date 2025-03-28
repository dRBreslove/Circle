import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import FaceScanScreen from './screens/FaceScanScreen';
import CircleScreen from './screens/CircleScreen';
import PosSysScreen from './screens/PosSysScreen';
import VRViewScreen from './screens/VRViewScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Circle' }}
          />
          <Stack.Screen 
            name="FaceScan" 
            component={FaceScanScreen} 
            options={{ title: 'Scan Face' }}
          />
          <Stack.Screen 
            name="Circle" 
            component={CircleScreen} 
            options={{ title: 'Your Circle' }}
          />
          <Stack.Screen 
            name="PosSys" 
            component={PosSysScreen} 
            options={{ title: 'Position System' }}
          />
          <Stack.Screen 
            name="VRView" 
            component={VRViewScreen} 
            options={{ title: 'VR View' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
} 