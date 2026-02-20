import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { HomeStackNavigator } from './HomeStackNavigator'
import { DiscoverStackNavigator } from './DiscoverStackNavigator'
import { ConversationsScreen } from '../screens/messages/ConversationsScreen'
import { FriendsStackNavigator } from './FriendsStackNavigator'
import { ProfileStackNavigator } from './ProfileStackNavigator'
import { colors, fontSize } from '../../constants/theme'
import type { MainTabParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()

type IconName = keyof typeof Ionicons.glyphMap

const TAB_ICONS: Record<keyof MainTabParamList, { focused: IconName; default: IconName }> = {
  Home: { focused: 'home', default: 'home-outline' },
  Discover: { focused: 'compass', default: 'compass-outline' },
  Messages: { focused: 'chatbubbles', default: 'chatbubbles-outline' },
  Friends: { focused: 'people', default: 'people-outline' },
  Profile: { focused: 'person-circle', default: 'person-circle-outline' },
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof MainTabParamList]
          const iconName = focused ? icons.focused : icons.default
          return <Ionicons name={iconName} size={focused ? size + 1 : size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '500',
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Discover" component={DiscoverStackNavigator} />
      <Tab.Screen name="Messages" component={ConversationsScreen} />
      <Tab.Screen name="Friends" component={FriendsStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  )
}
