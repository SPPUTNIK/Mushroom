import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import './src/utils/propTypes';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import IdentificationScreen from './src/screens/IdentificationScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import MapScreen from './src/screens/MapScreen';

// Import context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Identification: { imageUri: string };
  Collection: undefined;
  Login: undefined;
  SignUp: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {user ? (
        // Authenticated stack
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Mushroom Identifier' }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{ title: 'Take Photo' }}
          />
          <Stack.Screen 
            name="Identification" 
            component={IdentificationScreen}
            options={{ title: 'Mushroom Details' }}
          />
          <Stack.Screen 
            name="Collection" 
            component={CollectionScreen}
            options={{ title: 'My Collection' }}
          />
          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{ title: 'Mushroom Map' }}
          />
        </>
      ) : (
        // Auth stack
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
} 