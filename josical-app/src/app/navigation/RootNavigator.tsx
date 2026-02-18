import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { AuthNavigator } from './AuthNavigator'
import { OnboardingNavigator } from './OnboardingNavigator'
import { MainTabNavigator } from './MainTabNavigator'
import { LoadingSpinner } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'

export function RootNavigator() {
  const { session, profile, isInitialized, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return <LoadingSpinner fullScreen />
  }

  const getNavigator = () => {
    if (!session) return <AuthNavigator />
    if (!profile || !profile.onboarding_completed) return <OnboardingNavigator />
    return <MainTabNavigator />
  }

  return <NavigationContainer>{getNavigator()}</NavigationContainer>
}
