export type UserProfile = {
  readonly id: string
  readonly name: string
  readonly bio: string | null
  readonly avatar_url: string | null
  readonly city: string | null
  readonly neighborhood: string | null
  readonly lat: number | null
  readonly lng: number | null
  readonly discovery_radius: number
  readonly is_discoverable: boolean
  readonly onboarding_completed: boolean
  readonly created_at: string
  readonly updated_at: string
}

export type Dog = {
  readonly id: string
  readonly owner_id: string
  readonly name: string
  readonly breed: string | null
  readonly photo_url: string | null
  readonly gender: 'male' | 'female' | null
  readonly age_category: 'puppy' | 'adult' | 'senior' | null
  readonly is_neutered: boolean
  readonly created_at: string
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export type FriendRequest = {
  readonly id: string
  readonly from_user_id: string
  readonly to_user_id: string
  readonly status: FriendRequestStatus
  readonly created_at: string
}

export type Friendship = {
  readonly user_id: string
  readonly friend_id: string
  readonly created_at: string
}

export type BlockedUser = {
  readonly blocker_id: string
  readonly blocked_id: string
  readonly created_at: string
}

export type Conversation = {
  readonly id: string
  readonly created_at: string
  readonly updated_at: string
}

export type ConversationParticipant = {
  readonly conversation_id: string
  readonly user_id: string
  readonly last_read_at: string | null
}

export type MessageType = 'text' | 'image' | 'location'

export type Message = {
  readonly id: string
  readonly conversation_id: string
  readonly sender_id: string
  readonly type: MessageType
  readonly content: string
  readonly created_at: string
}

export type Notification = {
  readonly id: string
  readonly user_id: string
  readonly type: string
  readonly title: string
  readonly body: string | null
  readonly data: Record<string, unknown>
  readonly is_read: boolean
  readonly created_at: string
}

export type ActivityEventType =
  | 'friend_accepted'
  | 'friend_request'
  | 'new_neighbor'
  | 'dog_added'
  | 'welcome'

export type ActivityEvent = {
  readonly id: string
  readonly user_id: string
  readonly type: ActivityEventType
  readonly data: Record<string, unknown>
  readonly created_at: string
}

export type PushToken = {
  readonly id: string
  readonly user_id: string
  readonly token: string
  readonly created_at: string
}
