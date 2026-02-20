import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MyProfileScreen } from '../screens/profile/MyProfileScreen'
import { SettingsScreen } from '../screens/profile/SettingsScreen'
import { DogProfileScreen } from '../screens/profile/DogProfileScreen'
import type { ProfileStackParamList } from './types'

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="DogProfile" component={DogProfileScreen} />
    </Stack.Navigator>
  )
}
