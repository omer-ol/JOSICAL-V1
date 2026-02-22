import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFriendsStore } from '../../../stores/friendsStore'
import { useChatStore } from '../../../stores/chatStore'
import { Avatar } from '../../../components/ui'
import { useDebounce } from '../../../hooks/useDebounce'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../../constants/theme'
import type { MessagesScreenProps } from '../../navigation/types'
import type { UserProfile } from '../../../types'

type Props = MessagesScreenProps<'NewConversation'>

export function NewConversationScreen({ navigation }: Props) {
  const { friends, fetchFriends } = useFriendsStore()
  const { findOrCreateConversation } = useChatStore()
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    fetchFriends()
  }, [])

  const filteredFriends = debouncedSearch.length >= 2
    ? friends.filter((f) =>
        f.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : friends

  const handleSelectFriend = useCallback(async (friend: UserProfile) => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const conversationId = await findOrCreateConversation(friend.id)
      navigation.replace('Chat', {
        conversationId,
        friendName: friend.name,
        friendAvatar: friend.avatar_url ?? undefined,
      })
    } catch (error) {
      setIsCreating(false)
    }
  }, [isCreating, findOrCreateConversation, navigation])

  const renderFriend = useCallback(({ item }: { item: UserProfile }) => (
    <Pressable
      style={({ pressed }) => [styles.friendRow, pressed && styles.pressed]}
      onPress={() => handleSelectFriend(item)}
      disabled={isCreating}
    >
      <Avatar uri={item.avatar_url} name={item.name} size="md" />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        {item.neighborhood && (
          <Text style={styles.friendLocation}>{item.neighborhood}, {item.city}</Text>
        )}
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
    </Pressable>
  ), [handleSelectFriend, isCreating])

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color={colors.gray[300]} />
      <Text style={styles.emptyText}>
        {debouncedSearch.length >= 2
          ? 'No friends match your search'
          : 'Add friends to start chatting'}
      </Text>
    </View>
  ), [debouncedSearch])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search friends..."
          placeholderTextColor={colors.textLight}
          autoFocus
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredFriends.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 28,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: 0,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pressed: {
    backgroundColor: colors.backgroundSecondary,
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  friendLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
})
