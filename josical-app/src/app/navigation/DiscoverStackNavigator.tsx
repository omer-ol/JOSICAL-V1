import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { DiscoverScreen } from '../screens/discover/DiscoverScreen'
import { UserProfileScreen } from '../screens/discover/UserProfileScreen'
import type { DiscoverStackParamList } from './types'

const Stack = createNativeStackNavigator<DiscoverStackParamList>()

export function DiscoverStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  )
}
