import React, { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useChatStore } from '../../../stores/chatStore'
import { useAuthStore } from '../../../stores/authStore'
import { Avatar } from '../../../components/ui'
import { colors, fontSize, fontWeight, spacing, shadow, borderRadius } from '../../../constants/theme'
import type { MessagesStackParamList } from '../../navigation/types'

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList>

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60))
    return mins <= 0 ? 'Now' : `${mins}m`
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h`
  }
  if (diffHours < 48) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function truncateMessage(content: string, maxLength = 50): string {
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength)}...`
}

export function ConversationsScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { conversations, isLoadingConversations, fetchConversations, subscribeToConversations } = useChatStore()
  const session = useAuthStore((s) => s.session)

  useEffect(() => {
    if (session) {
      fetchConversations()
      const channel = subscribeToConversations()
      return () => {
        supabaseCleanup(channel)
      }
    }
  }, [session])

  const handleRefresh = useCallback(() => {
    fetchConversations()
  }, [fetchConversations])

  const handleConversationPress = useCallback((item: typeof conversations[number]) => {
    navigation.navigate('Chat', {
      conversationId: item.id,
      friendName: item.participant.name,
      friendAvatar: item.participant.avatar_url ?? undefined,
    })
  }, [navigation])

  const handleNewConversation = useCallback(() => {
    navigation.navigate('NewConversation')
  }, [navigation])

  const renderConversation = useCallback(({ item }: { item: typeof conversations[number] }) => {
    const preview = item.lastMessage
      ? item.lastMessage.type === 'image'
        ? 'Sent a photo'
        : truncateMessage(item.lastMessage.content)
      : 'No messages yet'

    const timestamp = item.lastMessage
      ? formatTimestamp(item.lastMessage.created_at)
      : ''

    return (
      <Pressable
        style={({ pressed }) => [styles.conversationRow, pressed && styles.pressed]}
        onPress={() => handleConversationPress(item)}
      >
        <Avatar
          uri={item.participant.avatar_url}
          name={item.participant.name}
          size="md"
        />
        <View style={styles.conversationContent}>
          <View style={styles.topRow}>
            <Text
              style={[styles.name, item.unreadCount > 0 && styles.unreadName]}
              numberOfLines={1}
            >
              {item.participant.name}
            </Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text
              style={[styles.preview, item.unreadCount > 0 && styles.unreadPreview]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    )
  }, [handleConversationPress])

  const renderEmpty = useCallback(() => {
    if (isLoadingConversations) return null
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.gray[300]} />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>Start chatting with your friends!</Text>
        <Pressable style={styles.startButton} onPress={handleNewConversation}>
          <Text style={styles.startButtonText}>Start a conversation</Text>
        </Pressable>
      </View>
    )
  }, [isLoadingConversations, handleNewConversation])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable onPress={handleNewConversation} hitSlop={8}>
          <Ionicons name="create-outline" size={26} color={colors.primary} />
        </Pressable>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingConversations}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  )
}

function supabaseCleanup(channel: any) {
  const { supabase } = require('../../../lib/supabase')
  supabase.removeChannel(channel)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  conversationRow: {
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
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadName: {
    fontWeight: fontWeight.bold,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadPreview: {
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
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
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  startButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadow.sm,
  },
  startButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
})
