import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RouteKey from './RouteKey';
import {CreateUser, ChatScreen, LoginScreen} from '../Chat';
import UserListScreen from '../Chat/screens/UserListScreen';
import {RootStackParamList} from './type';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const StackNavigation = () => (
  <Stack.Navigator>
    <Stack.Screen
      options={{headerShown: false}}
      name={RouteKey.LoginScreen}
      component={LoginScreen}
    />
    <Stack.Screen name={RouteKey.CreateUser} component={CreateUser} />
    <Stack.Screen name={RouteKey.UserListScreen} component={UserListScreen} />
    <Stack.Screen name={RouteKey.ChatScreen} component={ChatScreen} />
  </Stack.Navigator>
);
