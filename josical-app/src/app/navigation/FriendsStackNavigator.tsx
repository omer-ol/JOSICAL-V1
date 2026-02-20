import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { FriendsScreen } from '../screens/friends/FriendsScreen'
import { RequestsScreen } from '../screens/friends/RequestsScreen'
import { SuggestionsScreen } from '../screens/friends/SuggestionsScreen'
import { UserProfileScreen } from '../screens/discover/UserProfileScreen'
import type { FriendsStackParamList } from './types'

const Stack = createNativeStackNavigator<FriendsStackParamList>()

export function FriendsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FriendsList" component={FriendsScreen} />
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  )
}
