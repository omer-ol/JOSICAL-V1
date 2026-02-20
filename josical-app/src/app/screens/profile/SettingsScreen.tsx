import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, Alert, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card, Button } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme'
import { useAuthStore } from '../../../stores/authStore'
import { useProfileStore } from '../../../stores/profileStore'
import { useFriendsStore } from '../../../stores/friendsStore'
import type { UserProfile } from '../../../types'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { ProfileStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>

export function SettingsScreen({ navigation }: Props) {
  const { profile, setProfile, logout } = useAuthStore()
  const { updatePreferences } = useProfileStore()
  const { blockedUserIds, fetchBlockedUsers, unblockUser } = useFriendsStore()
  const [blockedProfiles, setBlockedProfiles] = useState<readonly UserProfile[]>([])
  const [isDiscoverable, setIsDiscoverable] = useState(profile?.is_discoverable ?? true)
  const [discoveryRadius, setDiscoveryRadius] = useState(profile?.discovery_radius ?? 10)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchBlockedUsers()
  }, [fetchBlockedUsers])

  useEffect(() => {
    const loadBlockedProfiles = async () => {
      if (blockedUserIds.length === 0) {
        setBlockedProfiles([])
        return
      }
      const { supabase } = await import('../../../lib/supabase')
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', blockedUserIds as string[])
      setBlockedProfiles(data ?? [])
    }
    loadBlockedProfiles()
  }, [blockedUserIds])

  const handleToggleDiscoverable = async (value: boolean) => {
    setIsDiscoverable(value)
    setIsSaving(true)
    try {
      const updated = await updatePreferences({ is_discoverable: value })
      setProfile(updated)
    } catch {
      setIsDiscoverable(!value)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRadiusChange = async (newRadius: number) => {
    const oldRadius = discoveryRadius
    setDiscoveryRadius(newRadius)
    try {
      const updated = await updatePreferences({ discovery_radius: newRadius })
      setProfile(updated)
    } catch {
      setDiscoveryRadius(oldRadius)
    }
  }

  const handleUnblock = async (userId: string, name: string) => {
    const doUnblock = async () => {
      try {
        await unblockUser(userId)
      } catch {
        // Handle silently
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Unblock ${name}?`)) {
        doUnblock()
      }
    } else {
      Alert.alert('Unblock User', `Unblock ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: doUnblock },
      ])
    }
  }

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        logout()
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ])
    }
  }

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      window.alert('Please contact support to delete your account.')
    } else {
      Alert.alert(
        'Delete Account',
        'Please contact support to delete your account. This action cannot be undone.',
        [{ text: 'OK' }]
      )
    }
  }

  const radiusOptions = [5, 10, 15, 25, 50]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Discovery</Text>
        <Card style={styles.settingCard} elevation="sm">
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Visible to others</Text>
              <Text style={styles.settingDescription}>
                Allow other dog owners to find you on the Discover screen
              </Text>
            </View>
            <Switch
              value={isDiscoverable}
              onValueChange={handleToggleDiscoverable}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={colors.white}
              disabled={isSaving}
            />
          </View>
        </Card>

        <Card style={styles.settingCard} elevation="sm">
          <Text style={styles.settingLabel}>Discovery radius</Text>
          <Text style={styles.settingDescription}>
            How far to search for nearby dog owners
          </Text>
          <View style={styles.radiusRow}>
            {radiusOptions.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, discoveryRadius === r && styles.radiusChipActive]}
                onPress={() => handleRadiusChange(r)}
              >
                <Text style={[styles.radiusText, discoveryRadius === r && styles.radiusTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Blocked Users</Text>
        {blockedProfiles.length === 0 ? (
          <Card style={styles.settingCard} elevation="sm">
            <Text style={styles.emptyText}>No blocked users</Text>
          </Card>
        ) : (
          blockedProfiles.map((user) => (
            <Card key={user.id} style={styles.settingCard} elevation="sm">
              <View style={styles.blockedRow}>
                <Avatar uri={user.avatar_url} name={user.name} size="sm" />
                <Text style={styles.blockedName}>{user.name}</Text>
                <TouchableOpacity
                  style={styles.unblockButton}
                  onPress={() => handleUnblock(user.id, user.name)}
                >
                  <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.settingCard} elevation="sm">
          <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.menuTextDanger}>Log Out</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.settingCard} elevation="sm">
          <TouchableOpacity style={styles.menuRow} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
            <Text style={styles.menuTextDanger}>Delete Account</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.versionText}>JoSial v1.0.0</Text>
      </ScrollView>
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
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  settingCard: { marginBottom: spacing.sm, padding: spacing.md },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingInfo: { flex: 1, marginRight: spacing.md },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  radiusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  radiusChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radiusText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  radiusTextActive: {
    color: colors.primaryDark,
    fontWeight: fontWeight.semibold,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockedName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginLeft: spacing.md,
  },
  unblockButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unblockText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuTextDanger: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.error,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})
