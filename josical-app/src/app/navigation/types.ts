import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
}

export type OnboardingStackParamList = {
  ProfileSetup: undefined
  DogSetup: undefined
  Preferences: undefined
}

export type MainTabParamList = {
  Home: undefined
  Discover: undefined
  Messages: undefined
  Friends: undefined
  Profile: undefined
}

export type DiscoverStackParamList = {
  DiscoverScreen: undefined
  UserProfile: { userId: string }
}

export type MessagesStackParamList = {
  ConversationsList: undefined
  Chat: { conversationId: string; friendName: string; friendAvatar?: string }
  NewConversation: undefined
}

export type FriendsStackParamList = {
  FriendsList: undefined
  Requests: undefined
  Suggestions: undefined
  UserProfile: { userId: string }
}

export type ProfileStackParamList = {
  MyProfile: undefined
  EditProfile: undefined
  DogProfile: { dogId?: string }
  Settings: undefined
  BlockedUsers: undefined
}

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>

export type MainTabProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>

export type DiscoverScreenProps<T extends keyof DiscoverStackParamList> =
  NativeStackScreenProps<DiscoverStackParamList, T>

export type FriendsScreenProps<T extends keyof FriendsStackParamList> =
  NativeStackScreenProps<FriendsStackParamList, T>

export type HomeStackParamList = {
  HomeScreen: undefined
  UserProfile: { userId: string }
}

export type HomeScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>
