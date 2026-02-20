import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card, LoadingSpinner, Button } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { useFriendsStore } from '../../../stores/friendsStore'
import type { UserProfile, Dog } from '../../../types'
import type { DiscoverScreenProps } from '../../navigation/types'

export function UserProfileScreen({ navigation, route }: DiscoverScreenProps<'UserProfile'>) {
  const { userId } = route.params
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [dogs, setDogs] = useState<readonly Dog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const { profile: myProfile } = useAuthStore()
  const {
    friends, outgoingRequests, incomingRequests, blockedUserIds,
    sendRequest, cancelRequest, acceptRequest, unfriend, blockUser,
    fetchFriends, fetchOutgoingRequests, fetchIncomingRequests,
  } = useFriendsStore()

  const isFriend = friends.some((f) => f.id === userId)
  const outgoingRequest = outgoingRequests.find((r) => r.to_user_id === userId)
  const incomingRequest = incomingRequests.find((r) => r.from_user_id === userId)
  const isBlocked = blockedUserIds.includes(userId)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [profileResult, dogsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('dogs').select('*').eq('owner_id', userId).order('created_at'),
      ])

      if (profileResult.error) throw profileResult.error
      setUserProfile(profileResult.data)
      setDogs(dogsResult.data ?? [])

      await Promise.all([fetchFriends(), fetchOutgoingRequests(), fetchIncomingRequests()])
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false)
    }
  }, [userId, fetchFriends, fetchOutgoingRequests, fetchIncomingRequests])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = async (action: () => Promise<void>) => {
    setActionLoading(true)
    try {
      await action()
    } catch {
      // Handle silently
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlock = () => {
    const doBlock = async () => {
      setActionLoading(true)
      try {
        await blockUser(userId)
        navigation.goBack()
      } catch {
        // Handle silently
      } finally {
        setActionLoading(false)
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Block ${userProfile?.name ?? 'this user'}? They won't be able to see your profile or send you requests.`)) {
        doBlock()
      }
    } else {
      Alert.alert(
        'Block User',
        `Block ${userProfile?.name ?? 'this user'}? They won't be able to see your profile or send you requests.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: doBlock },
        ]
      )
    }
  }

  if (isLoading || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBlock} style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Avatar uri={userProfile.avatar_url} name={userProfile.name} size="xl" />
          <Text style={styles.name}>{userProfile.name}</Text>
          {userProfile.bio ? (
            <Text style={styles.bio}>{userProfile.bio}</Text>
          ) : null}
          {userProfile.neighborhood || userProfile.city ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.locationText}>
                {[userProfile.neighborhood, userProfile.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionSection}>
          {isFriend ? (
            <View style={styles.actionRow}>
              <View style={styles.friendStatus}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.friendStatusText}>Friends</Text>
              </View>
              <Button
                title="Unfriend"
                variant="outline"
                size="sm"
                onPress={() => handleAction(() => unfriend(userId))}
                isLoading={actionLoading}
              />
            </View>
          ) : outgoingRequest ? (
            <Button
              title="Cancel Request"
              variant="outline"
              size="md"
              onPress={() => handleAction(() => cancelRequest(outgoingRequest.id))}
              isLoading={actionLoading}
              style={styles.fullButton}
            />
          ) : incomingRequest ? (
            <View style={styles.actionRow}>
              <Button
                title="Accept"
                size="md"
                onPress={() => handleAction(() => acceptRequest(incomingRequest.id))}
                isLoading={actionLoading}
                style={styles.flexButton}
              />
              <Button
                title="Decline"
                variant="outline"
                size="md"
                onPress={() => handleAction(() => useFriendsStore.getState().declineRequest(incomingRequest.id))}
                isLoading={actionLoading}
                style={styles.flexButton}
              />
            </View>
          ) : (
            <Button
              title="Add Friend"
              size="md"
              onPress={() => handleAction(() => sendRequest(userId))}
              isLoading={actionLoading}
              style={styles.fullButton}
            />
          )}
        </View>

        {dogs.length > 0 && (
          <View style={styles.dogsSection}>
            <Text style={styles.sectionTitle}>
              {userProfile.name.split(' ')[0]}&apos;s Dogs
            </Text>
            {dogs.map((dog) => (
              <Card key={dog.id} style={styles.dogCard} elevation="sm">
                <View style={styles.dogCardContent}>
                  <View style={styles.dogIcon}>
                    <Ionicons name="paw" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.dogInfo}>
                    <Text style={styles.dogName}>{dog.name}</Text>
                    <View style={styles.dogDetails}>
                      {dog.breed ? (
                        <Text style={styles.dogDetail}>{dog.breed}</Text>
                      ) : null}
                      {dog.gender ? (
                        <Text style={styles.dogDetail}>
                          {dog.gender === 'male' ? 'Male' : 'Female'}
                        </Text>
                      ) : null}
                      {dog.age_category ? (
                        <Text style={styles.dogDetail}>
                          {dog.age_category.charAt(0).toUpperCase() + dog.age_category.slice(1)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: { padding: spacing.xs },
  moreButton: { padding: spacing.xs },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  bio: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  locationText: { fontSize: fontSize.sm, color: colors.textSecondary },
  actionSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendStatusText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  fullButton: { width: '100%' },
  flexButton: { flex: 1 },
  dogsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  dogCard: { marginBottom: spacing.sm, padding: spacing.md },
  dogCardContent: { flexDirection: 'row', alignItems: 'center' },
  dogIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogInfo: { flex: 1, marginLeft: spacing.md },
  dogName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  dogDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 3,
  },
  dogDetail: { fontSize: fontSize.sm, color: colors.textSecondary },
})
