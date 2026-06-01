import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { Home, Wrench, Calendar, User } from 'lucide-react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RepairDetailScreen from './src/screens/RepairDetailScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchRepairScreen from './src/screens/SearchRepairScreen';

import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import AppInfoScreen from './src/screens/AppInfoScreen';
import {
  clearAuthSession,
  isAuthServerMismatch,
  setOnLoginSuccess,
  setOnSessionExpired,
} from './src/api/authSession';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderTopWidth: 1,
          borderTopColor: '#F0F0FB',
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: '#004AC6',
        tabBarInactiveTintColor: '#737686',
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      {/* Đơn hàng (thay thế cho Trang chủ) */}
      <Tab.Screen 
        name="OrdersTab" 
        component={DashboardScreen} 
        options={{
          tabBarLabel: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => <Wrench color={color} size={24} />,
        }}
      />
      <Tab.Screen 
        name="BookingsTab" 
        component={BookingsScreen} 
        options={{
          tabBarLabel: 'Lịch hẹn',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={24} />,
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color, size }) => <User color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    setOnSessionExpired(() => setUserToken(null));
    setOnLoginSuccess((token) => setUserToken(token));

    const bootstrapAsync = async () => {
      let token;
      try {
        if (await isAuthServerMismatch()) {
          await clearAuthSession();
        }
        token = await AsyncStorage.getItem('userToken');
      } catch (e) {
        // Restoring token failed
      }
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();
    return () => {
      setOnSessionExpired(null);
      setOnLoginSuccess(null);
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8FF' }}>
        <ActivityIndicator size="large" color="#004AC6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={userToken ? 'authenticated' : 'guest'}
        screenOptions={{ headerShown: false }}
        initialRouteName={userToken ? 'MainTabs' : 'Login'}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="RepairDetail" component={RepairDetailScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="SearchRepair" component={SearchRepairScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="AppInfo" component={AppInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
