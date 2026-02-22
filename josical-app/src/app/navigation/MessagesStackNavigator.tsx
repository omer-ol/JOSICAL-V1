import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ConversationsScreen } from '../screens/messages/ConversationsScreen'
import { ChatScreen } from '../screens/messages/ChatScreen'
import { NewConversationScreen } from '../screens/messages/NewConversationScreen'
import type { MessagesStackParamList } from './types'

const Stack = createNativeStackNavigator<MessagesStackParamList>()

export function MessagesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConversationsList" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="NewConversation" component={NewConversationScreen} />
    </Stack.Navigator>
  )
}
