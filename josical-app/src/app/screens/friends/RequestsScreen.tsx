import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card, Button } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme'
import { useFriendsStore } from '../../../stores/friendsStore'
import type { FriendRequest, UserProfile } from '../../../types'
import type { FriendsScreenProps } from '../../navigation/types'

type Tab = 'incoming' | 'outgoing'

type IncomingRequest = FriendRequest & { readonly from_user: UserProfile }

export function RequestsScreen({ navigation }: FriendsScreenProps<'Requests'>) {
  const [tab, setTab] = useState<Tab>('incoming')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const {
    incomingRequests, outgoingRequests,
    fetchIncomingRequests, fetchOutgoingRequests,
    acceptRequest, declineRequest, cancelRequest,
  } = useFriendsStore()

  const loadData = useCallback(async () => {
    await Promise.all([fetchIncomingRequests(), fetchOutgoingRequests()])
  }, [fetchIncomingRequests, fetchOutgoingRequests])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const handleAction = async (action: () => Promise<void>, id: string) => {
    setLoadingId(id)
    try {
      await action()
    } catch {
      // Handle silently
    } finally {
      setLoadingId(null)
    }
  }

  const renderIncomingRequest = ({ item }: { item: IncomingRequest }) => (
    <Card style={styles.requestCard} elevation="sm">
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate('UserProfile', { userId: item.from_user_id })}
      >
        <Avatar uri={item.from_user.avatar_url} name={item.from_user.name} size="md" />
        <View style={styles.cardInfo}>
          <Text style={styles.requestName} numberOfLines={1}>{item.from_user.name}</Text>
          {item.from_user.neighborhood || item.from_user.city ? (
            <Text style={styles.requestLocation} numberOfLines={1}>
              {[item.from_user.neighborhood, item.from_user.city].filter(Boolean).join(', ')}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <View style={styles.actionRow}>
        <Button
          title="Accept"
          size="sm"
          onPress={() => handleAction(() => acceptRequest(item.id), item.id)}
          isLoading={loadingId === item.id}
          style={styles.actionButton}
        />
        <Button
          title="Decline"
          variant="outline"
          size="sm"
          onPress={() => handleAction(() => declineRequest(item.id), item.id)}
          isLoading={loadingId === item.id}
          style={styles.actionButton}
        />
      </View>
    </Card>
  )

  const renderOutgoingRequest = ({ item }: { item: FriendRequest }) => (
    <Card style={styles.requestCard} elevation="sm">
      <View style={styles.cardContent}>
        <View style={styles.outgoingIcon}>
          <Ionicons name="arrow-forward-circle" size={24} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.requestName}>Request sent</Text>
          <Text style={styles.requestLocation}>
            Waiting for response...
          </Text>
        </View>
        <Button
          title="Cancel"
          variant="outline"
          size="sm"
          onPress={() => handleAction(() => cancelRequest(item.id), item.id)}
          isLoading={loadingId === item.id}
        />
      </View>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'incoming' && styles.activeTab]}
          onPress={() => setTab('incoming')}
        >
          <Text style={[styles.tabText, tab === 'incoming' && styles.activeTabText]}>
            Incoming{incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'outgoing' && styles.activeTab]}
          onPress={() => setTab('outgoing')}
        >
          <Text style={[styles.tabText, tab === 'outgoing' && styles.activeTabText]}>
            Outgoing{outgoingRequests.length > 0 ? ` (${outgoingRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'incoming' ? (
        <FlatList
          data={incomingRequests as IncomingRequest[]}
          keyExtractor={(item) => item.id}
          renderItem={renderIncomingRequest}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-open-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>No incoming requests</Text>
              <Text style={styles.emptySubtitle}>
                When someone sends you a friend request, it will appear here
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={outgoingRequests as FriendRequest[]}
          keyExtractor={(item) => item.id}
          renderItem={renderOutgoingRequest}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="paper-plane-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>No outgoing requests</Text>
              <Text style={styles.emptySubtitle}>
                Friend requests you send will appear here
              </Text>
            </View>
          }
        />
      )}
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
    paddingBottom: spacing.sm,
  },
  backButton: { padding: spacing.xs },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  placeholder: { width: 32 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.xs,
  },
  activeTab: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  requestCard: { marginBottom: spacing.md, padding: spacing.md },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  requestName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  requestLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: { flex: 1 },
  outgoingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
