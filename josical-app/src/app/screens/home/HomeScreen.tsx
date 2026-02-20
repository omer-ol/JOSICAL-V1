import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { useDogsStore } from '../../../stores/dogsStore'
import { useFriendsStore } from '../../../stores/friendsStore'
import type { Dog, ActivityEvent } from '../../../types'
import type { HomeScreenProps } from '../../navigation/types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  friend_accepted: { icon: 'people', color: colors.success },
  friend_request: { icon: 'person-add', color: colors.primary },
  new_neighbor: { icon: 'location', color: '#6C63FF' },
  dog_added: { icon: 'paw', color: colors.primary },
  welcome: { icon: 'heart', color: '#FF6B6B' },
}

export function HomeScreen({ navigation }: HomeScreenProps<'HomeScreen'>) {
  const [activities, setActivities] = useState<readonly ActivityEvent[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { profile } = useAuthStore()
  const { myDogs, fetchMyDogs } = useDogsStore()
  const { friends, incomingRequests, fetchFriends, fetchIncomingRequests } = useFriendsStore()

  const firstName = profile?.name?.split(' ')[0] ?? 'there'

  const fetchActivities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('activity_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setActivities(data ?? [])
    } catch {
      // Handle silently
    }
  }, [])

  const loadData = useCallback(async () => {
    await Promise.all([fetchMyDogs(), fetchFriends(), fetchIncomingRequests(), fetchActivities()])
  }, [fetchMyDogs, fetchFriends, fetchIncomingRequests, fetchActivities])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const renderDogCard = ({ item }: { item: Dog }) => (
    <Card style={styles.dogCard} elevation="sm">
      <View style={styles.dogCardInner}>
        <View style={styles.dogIconCircle}>
          <Ionicons name="paw" size={28} color={colors.primary} />
        </View>
        <Text style={styles.dogCardName} numberOfLines={1}>{item.name}</Text>
        {item.breed ? (
          <Text style={styles.dogCardBreed} numberOfLines={1}>{item.breed}</Text>
        ) : null}
      </View>
    </Card>
  )

  const getActivityMessage = (event: ActivityEvent): string => {
    const data = event.data as Record<string, string>
    switch (event.type) {
      case 'friend_accepted':
        return `${data.friend_name ?? 'Someone'} accepted your friend request`
      case 'friend_request':
        return `${data.from_name ?? 'Someone'} sent you a friend request`
      case 'new_neighbor':
        return `${data.name ?? 'A new dog owner'} joined your area`
      case 'dog_added':
        return `${data.owner_name ?? 'Someone'} added a new dog: ${data.dog_name ?? ''}`
      case 'welcome':
        return 'Welcome to JoSial! Start by discovering dog owners near you.'
      default:
        return 'Something happened'
    }
  }

  const formatTimeAgo = (dateStr: string): string => {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diff = now - then
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{firstName}</Text>
            </View>
            <Avatar uri={profile?.avatar_url} name={profile?.name} size="lg" />
          </View>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard} elevation="sm">
            <Ionicons name="people" size={22} color={colors.primary} />
            <Text style={styles.statNumber}>{friends.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </Card>
          <Card style={styles.statCard} elevation="sm">
            <Ionicons name="paw" size={22} color={colors.primary} />
            <Text style={styles.statNumber}>{myDogs.length}</Text>
            <Text style={styles.statLabel}>Dogs</Text>
          </Card>
          <Card style={styles.statCard} elevation="sm">
            <Ionicons name="mail" size={22} color={incomingRequests.length > 0 ? colors.error : colors.primary} />
            <Text style={styles.statNumber}>{incomingRequests.length}</Text>
            <Text style={styles.statLabel}>Requests</Text>
          </Card>
        </View>

        {myDogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Dogs</Text>
            <FlatList
              data={myDogs as Dog[]}
              keyExtractor={(item) => item.id}
              renderItem={renderDogCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dogList}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activities.length === 0 ? (
            <Card style={styles.emptyActivity} elevation="sm">
              <Ionicons name="sparkles-outline" size={32} color={colors.gray[300]} />
              <Text style={styles.emptyActivityTitle}>No activity yet</Text>
              <Text style={styles.emptyActivitySub}>
                Start by discovering dog owners near you!
              </Text>
            </Card>
          ) : (
            activities.map((event) => {
              const config = ACTIVITY_ICONS[event.type] ?? { icon: 'notifications', color: colors.textSecondary }
              return (
                <Card key={event.id} style={styles.activityCard} elevation="sm">
                  <View style={styles.activityContent}>
                    <View style={[styles.activityIcon, { backgroundColor: config.color + '15' }]}>
                      <Ionicons name={config.icon as any} size={18} color={config.color} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityMessage}>{getActivityMessage(event)}</Text>
                      <Text style={styles.activityTime}>{formatTimeAgo(event.created_at)}</Text>
                    </View>
                  </View>
                </Card>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  greetingSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: { flex: 1 },
  greeting: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  name: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  section: {
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  dogList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dogCard: {
    width: 120,
    padding: spacing.md,
    alignItems: 'center',
  },
  dogCardInner: { alignItems: 'center' },
  dogIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  dogCardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  dogCardBreed: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyActivity: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyActivityTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyActivitySub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  activityCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  activityContent: { flexDirection: 'row', alignItems: 'center' },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: { flex: 1, marginLeft: spacing.md },
  activityMessage: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 3,
  },
})
