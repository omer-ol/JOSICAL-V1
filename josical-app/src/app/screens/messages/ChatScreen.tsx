import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useChatStore } from '../../../stores/chatStore'
import { useAuthStore } from '../../../stores/authStore'
import { supabase } from '../../../lib/supabase'
import { Avatar } from '../../../components/ui'
import { colors, fontSize, fontWeight, spacing, borderRadius, shadow } from '../../../constants/theme'
import type { MessagesScreenProps } from '../../navigation/types'
import type { Message } from '../../../types'

type Props = MessagesScreenProps<'Chat'>

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function shouldShowDateSeparator(messages: readonly Message[], index: number): boolean {
  if (index === 0) return true
  const current = new Date(messages[index].created_at).toDateString()
  const previous = new Date(messages[index - 1].created_at).toDateString()
  return current !== previous
}

export function ChatScreen({ route, navigation }: Props) {
  const { conversationId, friendName, friendAvatar } = route.params
  const {
    messages,
    isLoadingMessages,
    fetchMessages,
    sendMessage,
    markAsRead,
    subscribeToMessages,
    setActiveConversation,
    clearMessages,
  } = useChatStore()
  const session = useAuthStore((s) => s.session)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    setActiveConversation(conversationId)
    fetchMessages(conversationId)
    markAsRead(conversationId)

    const channel = subscribeToMessages(conversationId)

    return () => {
      supabase.removeChannel(channel)
      setActiveConversation(null)
      clearMessages()
    }
  }, [conversationId])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isSending) return

    setInputText('')
    setIsSending(true)
    try {
      await sendMessage(conversationId, text, 'text')
      markAsRead(conversationId)
    } catch (error) {
      setInputText(text)
    } finally {
      setIsSending(false)
    }
  }, [inputText, isSending, conversationId, sendMessage, markAsRead])

  const handleImagePick = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    })

    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = uri.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${conversationId}_${Date.now()}.${ext}`
    const response = await fetch(uri)
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('dogs')
      .upload(path, arrayBuffer, { contentType: `image/${ext}` })

    if (uploadError) return

    const { data: urlData } = supabase.storage.from('dogs').getPublicUrl(path)
    await sendMessage(conversationId, urlData.publicUrl, 'image')
  }, [conversationId, sendMessage])

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === session?.user.id
    const showDate = shouldShowDateSeparator(messages, index)

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.created_at)}
            </Text>
          </View>
        )}
        <View style={[styles.messageRow, isOwn ? styles.ownRow : styles.otherRow]}>
          {!isOwn && (
            <Avatar uri={friendAvatar} name={friendName} size="xs" />
          )}
          <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
            {item.type === 'image' ? (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={isOwn ? colors.message.sentText : colors.textSecondary} />
                <Text style={[styles.imageText, isOwn && styles.ownMessageText]}>Photo</Text>
              </View>
            ) : (
              <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                {item.content}
              </Text>
            )}
            <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
              {formatMessageTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    )
  }, [session, messages, friendAvatar, friendName])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Avatar uri={friendAvatar} name={friendName} size="sm" />
        <Text style={styles.headerName} numberOfLines={1}>{friendName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false })
            }}
          />
        )}

        <View style={styles.inputContainer}>
          <Pressable onPress={handleImagePick} hitSlop={8} style={styles.attachButton}>
            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isSending ? colors.white : colors.gray[400]}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  headerName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateSeparatorText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  ownRow: {
    justifyContent: 'flex-end',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  ownBubble: {
    backgroundColor: colors.message.sent,
    borderBottomRightRadius: borderRadius.xs,
  },
  otherBubble: {
    backgroundColor: colors.message.received,
    borderBottomLeftRadius: borderRadius.xs,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.message.receivedText,
    lineHeight: fontSize.md * 1.4,
  },
  ownMessageText: {
    color: colors.message.sentText,
  },
  messageTime: {
    fontSize: fontSize.xs - 1,
    color: colors.textSecondary,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  imagePlaceholder: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  imageText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  attachButton: {
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
})
