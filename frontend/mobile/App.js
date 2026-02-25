/**
 * Sentio - AI-Powered Chat Application
 * Main App Entry Point
 */
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: { backgroundColor: '#6C63FF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="💬" color={color} />,
          title: 'Sentio',
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="📊" color={color} />,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="👥" color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="⚙️" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ name }) {
  return <Text style={{ fontSize: 20 }}>{name}</Text>;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      setIsAuthenticated(!!token);
    } catch (e) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6C63FF' }}>
        <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 20 }}>Sentio</Text>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          </>
        )}
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: true, headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
