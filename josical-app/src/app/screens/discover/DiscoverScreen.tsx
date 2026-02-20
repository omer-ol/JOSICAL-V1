import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card, LoadingSpinner } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { useFriendsStore } from '../../../stores/friendsStore'
import type { UserProfile, Dog } from '../../../types'
import type { DiscoverScreenProps } from '../../navigation/types'

type DiscoverUser = UserProfile & {
  readonly dogs: readonly Dog[]
}

export function DiscoverScreen({ navigation }: DiscoverScreenProps<'DiscoverScreen'>) {
  const [users, setUsers] = useState<readonly DiscoverUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<readonly DiscoverUser[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { profile } = useAuthStore()
  const { friends, outgoingRequests, blockedUserIds, fetchFriends, fetchOutgoingRequests, fetchBlockedUsers, sendRequest } = useFriendsStore()

  const friendIds = friends.map((f) => f.id)
  const pendingToUserIds = outgoingRequests.map((r) => r.to_user_id)

  const fetchUsers = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_discoverable', true)
        .order('name')

      if (error) throw error

      const profiles = data ?? []
      const visibleProfiles = profiles.filter(
        (p) => !blockedUserIds.includes(p.id)
      )

      const usersWithDogs: DiscoverUser[] = await Promise.all(
        visibleProfiles.map(async (p) => {
          const { data: dogs } = await supabase
            .from('dogs')
            .select('*')
            .eq('owner_id', p.id)
          return { ...p, dogs: dogs ?? [] }
        })
      )

      setUsers(usersWithDogs)
    } catch (error) {
      // Silently handle — user sees empty state
    }
  }, [blockedUserIds])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([fetchFriends(), fetchOutgoingRequests(), fetchBlockedUsers(), fetchUsers()])
    setIsLoading(false)
  }, [fetchFriends, fetchOutgoingRequests, fetchBlockedUsers, fetchUsers])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users)
      return
    }
    const q = search.toLowerCase()
    setFilteredUsers(
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.city?.toLowerCase().includes(q) ||
          u.neighborhood?.toLowerCase().includes(q) ||
          u.dogs.some((d) => d.name.toLowerCase().includes(q) || d.breed?.toLowerCase().includes(q))
      )
    )
  }, [search, users])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchFriends(), fetchOutgoingRequests(), fetchBlockedUsers(), fetchUsers()])
    setIsRefreshing(false)
  }

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest(userId)
    } catch {
      // Request may already exist
    }
  }

  const getRelationship = (userId: string): 'friend' | 'pending' | 'none' => {
    if (friendIds.includes(userId)) return 'friend'
    if (pendingToUserIds.includes(userId)) return 'pending'
    return 'none'
  }

  const renderUserCard = ({ item }: { item: DiscoverUser }) => {
    const relationship = getRelationship(item.id)
    const dogNames = item.dogs.map((d) => d.name).join(', ')

    return (
      <Card
        style={styles.userCard}
        elevation="sm"
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <View style={styles.cardContent}>
          <Avatar uri={item.avatar_url} name={item.name} size="lg" />
          <View style={styles.cardInfo}>
            <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
            {item.neighborhood || item.city ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {[item.neighborhood, item.city].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
            {dogNames ? (
              <View style={styles.dogRow}>
                <Ionicons name="paw-outline" size={13} color={colors.primary} />
                <Text style={styles.dogText} numberOfLines={1}>{dogNames}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.actionArea}>
            {relationship === 'friend' ? (
              <View style={styles.friendBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.friendBadgeText}>Friends</Text>
              </View>
            ) : relationship === 'pending' ? (
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleSendRequest(item.id)}
              >
                <Ionicons name="person-add-outline" size={16} color={colors.white} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find dog owners near you</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, location, or dog..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="compass-outline" size={56} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>
              {search ? 'No results found' : 'No users to discover yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? 'Try a different search term'
                : 'Check back later as more people join JoSial'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: 12,
  },
  clearButton: { padding: spacing.xs },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  userCard: { marginBottom: spacing.md, padding: spacing.md },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  locationText: { fontSize: fontSize.sm, color: colors.textSecondary },
  dogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  dogText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
  actionArea: { marginLeft: spacing.sm },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  friendBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.success,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
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
  },
})
