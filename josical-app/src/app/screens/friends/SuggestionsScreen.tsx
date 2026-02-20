import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { useFriendsStore } from '../../../stores/friendsStore'
import type { UserProfile } from '../../../types'
import type { FriendsScreenProps } from '../../navigation/types'

export function SuggestionsScreen({ navigation }: FriendsScreenProps<'Suggestions'>) {
  const [suggestions, setSuggestions] = useState<readonly UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sendingIds, setSendingIds] = useState<readonly string[]>([])

  const { profile } = useAuthStore()
  const {
    friends, outgoingRequests, blockedUserIds,
    fetchFriends, fetchOutgoingRequests, fetchBlockedUsers,
    sendRequest,
  } = useFriendsStore()

  const friendIds = friends.map((f) => f.id)
  const pendingToUserIds = outgoingRequests.map((r) => r.to_user_id)

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_discoverable', true)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error

      const excludeIds = new Set([...friendIds, ...pendingToUserIds, ...blockedUserIds])
      const filtered = (data ?? []).filter((p) => !excludeIds.has(p.id))
      setSuggestions(filtered)
    } catch {
      // Handle silently
    }
  }, [friendIds, pendingToUserIds, blockedUserIds])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([fetchFriends(), fetchOutgoingRequests(), fetchBlockedUsers()])
    await fetchSuggestions()
    setIsLoading(false)
  }, [fetchFriends, fetchOutgoingRequests, fetchBlockedUsers, fetchSuggestions])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const handleSendRequest = async (userId: string) => {
    setSendingIds((prev) => [...prev, userId])
    try {
      await sendRequest(userId)
      setSuggestions((prev) => prev.filter((s) => s.id !== userId))
    } catch {
      // Handle silently
    } finally {
      setSendingIds((prev) => prev.filter((id) => id !== userId))
    }
  }

  const renderSuggestion = ({ item }: { item: UserProfile }) => (
    <Card
      style={styles.suggestionCard}
      elevation="sm"
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <View style={styles.cardContent}>
        <Avatar uri={item.avatar_url} name={item.name} size="md" />
        <View style={styles.cardInfo}>
          <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
          {item.neighborhood || item.city ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {[item.neighborhood, item.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleSendRequest(item.id)}
          disabled={sendingIds.includes(item.id)}
        >
          <Ionicons
            name="person-add-outline"
            size={18}
            color={sendingIds.includes(item.id) ? colors.gray[300] : colors.primary}
          />
        </TouchableOpacity>
      </View>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Suggestions</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>People you might want to connect with</Text>

      <FlatList
        data={suggestions as UserProfile[]}
        keyExtractor={(item) => item.id}
        renderItem={renderSuggestion}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>No suggestions right now</Text>
              <Text style={styles.emptySubtitle}>
                Check back later as more people join JoSial
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  backButton: { padding: spacing.xs },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  placeholder: { width: 32 },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  suggestionCard: { marginBottom: spacing.sm, padding: spacing.md },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  suggestionName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  locationText: { fontSize: fontSize.sm, color: colors.textSecondary },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
})
