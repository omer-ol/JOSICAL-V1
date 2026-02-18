import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen'
import { DogSetupScreen } from '../screens/onboarding/DogSetupScreen'
import { PreferencesScreen } from '../screens/onboarding/PreferencesScreen'
import type { OnboardingStackParamList } from './types'

const Stack = createNativeStackNavigator<OnboardingStackParamList>()

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: false }}>
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="DogSetup" component={DogSetupScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
    </Stack.Navigator>
  )
}
