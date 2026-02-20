import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../screens/home/HomeScreen'
import { UserProfileScreen } from '../screens/discover/UserProfileScreen'
import type { HomeStackParamList } from './types'

const Stack = createNativeStackNavigator<HomeStackParamList>()

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  )
}
