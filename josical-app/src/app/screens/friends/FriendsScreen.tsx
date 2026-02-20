import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card, Badge } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme'
import { useFriendsStore } from '../../../stores/friendsStore'
import type { UserProfile } from '../../../types'
import type { FriendsScreenProps } from '../../navigation/types'

export function FriendsScreen({ navigation }: FriendsScreenProps<'FriendsList'>) {
  const [search, setSearch] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    friends, incomingRequests,
    fetchFriends, fetchIncomingRequests, fetchOutgoingRequests,
  } = useFriendsStore()

  const loadData = useCallback(async () => {
    await Promise.all([fetchFriends(), fetchIncomingRequests(), fetchOutgoingRequests()])
  }, [fetchFriends, fetchIncomingRequests, fetchOutgoingRequests])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData()
    })
    return unsubscribe
  }, [navigation, loadData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const filteredFriends = search.trim()
    ? friends.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.city?.toLowerCase().includes(search.toLowerCase()) ||
        f.neighborhood?.toLowerCase().includes(search.toLowerCase())
      )
    : friends

  const renderFriendCard = ({ item }: { item: UserProfile }) => (
    <Card
      style={styles.friendCard}
      elevation="sm"
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <View style={styles.cardContent}>
        <Avatar uri={item.avatar_url} name={item.name} size="md" />
        <View style={styles.cardInfo}>
          <Text style={styles.friendName} numberOfLines={1}>{item.name}</Text>
          {item.neighborhood || item.city ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {[item.neighborhood, item.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray[300]} />
      </View>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Requests')}
          >
            <View>
              <Ionicons name="mail-outline" size={24} color={colors.text} />
              {incomingRequests.length > 0 && (
                <Badge count={incomingRequests.length} />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Suggestions')}
          >
            <Ionicons name="person-add-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredFriends as UserProfile[]}
        keyExtractor={(item) => item.id}
        renderItem={renderFriendCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={56} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>
              {search ? 'No friends match your search' : 'No friends yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? 'Try a different search term'
                : 'Head over to Discover to find dog owners near you!'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: spacing.md },
  headerButton: { padding: spacing.xs },
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
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  friendCard: { marginBottom: spacing.sm, padding: spacing.md },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  friendName: {
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
