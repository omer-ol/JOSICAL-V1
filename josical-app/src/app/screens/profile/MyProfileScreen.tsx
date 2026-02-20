import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useAuthStore } from '../../../stores/authStore'
import { useProfileStore } from '../../../stores/profileStore'
import { useDogsStore } from '../../../stores/dogsStore'
import { supabase } from '../../../lib/supabase'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui'
import { getCityNames, getNeighborhoods, getLocationCoords } from '../../../constants/locations'
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../../constants/theme'
import type { Dog } from '../../../types'

type ProfileTab = 'owner' | 'dog'

function TabSwitcher({ activeTab, onTabChange }: {
  readonly activeTab: ProfileTab
  readonly onTabChange: (tab: ProfileTab) => void
}) {
  return (
    <View style={tabStyles.container}>
      <TouchableOpacity
        style={[tabStyles.tab, activeTab === 'owner' && tabStyles.activeTab]}
        onPress={() => onTabChange('owner')}
        activeOpacity={0.7}
      >
        <Text style={[tabStyles.tabText, activeTab === 'owner' && tabStyles.activeTabText]}>
          Owner
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[tabStyles.tab, activeTab === 'dog' && tabStyles.activeTab]}
        onPress={() => onTabChange('dog')}
        activeOpacity={0.7}
      >
        <Text style={[tabStyles.tabText, activeTab === 'dog' && tabStyles.activeTabText]}>
          Dog
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: 3,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  tab: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xs,
  },
  activeTab: {
    backgroundColor: colors.surface,
    ...shadow.xs,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
})

function OwnerProfile() {
  const { profile, setProfile } = useAuthStore()
  const { updateProfile } = useProfileStore()

  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood ?? '')
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [showNeighborhoodPicker, setShowNeighborhoodPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const cities = getCityNames()
  const neighborhoods = city ? getNeighborhoods(city) : []

  const isDirty =
    avatarUri !== null ||
    bio !== (profile?.bio ?? '') ||
    city !== (profile?.city ?? '') ||
    neighborhood !== (profile?.neighborhood ?? '')

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const ext = uri.split('.').pop() ?? 'jpg'
    const path = `${user.id}.${ext}`
    const response = await fetch(uri)
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const { error } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
      contentType: `image/${ext}`,
      upsert: true,
    })
    if (error) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let avatarUrl: string | undefined
      if (avatarUri) {
        avatarUrl = (await uploadAvatar(avatarUri)) ?? undefined
      }
      const coords = city ? getLocationCoords(city) : null
      const updated = await updateProfile({
        bio: bio.trim() || undefined,
        city: city || undefined,
        neighborhood: neighborhood || undefined,
        ...(coords ?? {}),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      setProfile(updated)
      setAvatarUri(null)
      setBio(updated.bio ?? '')
      setCity(updated.city ?? '')
      setNeighborhood(updated.neighborhood ?? '')
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const displayUri = avatarUri ?? profile?.avatar_url ?? null

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar} activeOpacity={0.8}>
          <Avatar uri={displayUri} name={profile?.name} size="xxl" />
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{profile?.name ?? ''}</Text>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people about you and your dog..."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>

        <TouchableOpacity style={styles.fieldCard} onPress={() => setShowCityPicker(true)}>
          <Text style={styles.fieldLabel}>City</Text>
          <Text style={[styles.pickerValue, !city && styles.pickerPlaceholder]}>
            {city || 'Select your city'}
          </Text>
        </TouchableOpacity>

        {city !== '' && (
          <TouchableOpacity style={styles.fieldCard} onPress={() => setShowNeighborhoodPicker(true)}>
            <Text style={styles.fieldLabel}>Neighborhood</Text>
            <Text style={[styles.pickerValue, !neighborhood && styles.pickerPlaceholder]}>
              {neighborhood || 'Select neighborhood'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {isDirty && (
        <View style={styles.saveBar}>
          <Button title="Save changes" onPress={handleSave} isLoading={isSaving} fullWidth />
        </View>
      )}

      {showCityPicker && (
        <View style={styles.pickerModal}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select City</Text>
            <FlatList
              data={cities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setCity(item)
                    setNeighborhood('')
                    setShowCityPicker(false)
                  }}
                >
                  <Text style={[styles.pickerItemText, item === city && styles.pickerItemSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}

      {showNeighborhoodPicker && (
        <View style={styles.pickerModal}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Neighborhood</Text>
            <FlatList
              data={neighborhoods as string[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setNeighborhood(item)
                    setShowNeighborhoodPicker(false)
                  }}
                >
                  <Text style={[styles.pickerItemText, item === neighborhood && styles.pickerItemSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}
    </>
  )
}

function DogProfile() {
  const { myDogs, fetchMyDogs, isLoading } = useDogsStore()

  useEffect(() => {
    fetchMyDogs()
  }, [fetchMyDogs])

  if (isLoading) {
    return (
      <View style={dogStyles.emptyContainer}>
        <Text style={dogStyles.emptyText}>Loading...</Text>
      </View>
    )
  }

  if (myDogs.length === 0) {
    return (
      <View style={dogStyles.emptyContainer}>
        <Text style={dogStyles.emptyEmoji}>🐕</Text>
        <Text style={dogStyles.emptyTitle}>No dogs yet</Text>
        <Text style={dogStyles.emptyText}>
          Your dog profile will appear here after you add a dog during onboarding.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {myDogs.map((dog) => (
        <DogCard key={dog.id} dog={dog} />
      ))}
    </ScrollView>
  )
}

function DogCard({ dog }: { readonly dog: Dog }) {
  return (
    <View style={dogStyles.card}>
      <View style={dogStyles.cardHeader}>
        <Avatar uri={dog.photo_url} name={dog.name} size="lg" />
        <View style={dogStyles.cardInfo}>
          <Text style={dogStyles.dogName}>{dog.name}</Text>
          {dog.breed ? <Text style={dogStyles.dogBreed}>{dog.breed}</Text> : null}
        </View>
      </View>

      <View style={dogStyles.detailsRow}>
        {dog.gender ? (
          <View style={dogStyles.detailChip}>
            <Text style={dogStyles.detailText}>
              {dog.gender === 'male' ? '♂ Male' : '♀ Female'}
            </Text>
          </View>
        ) : null}
        {dog.age_category ? (
          <View style={dogStyles.detailChip}>
            <Text style={dogStyles.detailText}>
              {dog.age_category.charAt(0).toUpperCase() + dog.age_category.slice(1)}
            </Text>
          </View>
        ) : null}
        {dog.is_neutered ? (
          <View style={dogStyles.detailChip}>
            <Text style={dogStyles.detailText}>Neutered</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const dogStyles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.5,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  dogName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  dogBreed: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  detailChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  detailText: {
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    fontWeight: fontWeight.medium,
  },
})

export function MyProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('owner')
  const { logout } = useAuthStore()

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout().catch(() => {
              Alert.alert('Error', 'Failed to log out. Please try again.')
            })
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'owner' ? <OwnerProfile /> : <DogProfile />}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  logoutText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.error,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.md, alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: spacing.md, ...shadow.md },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  cameraIcon: { fontSize: 14 },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xl },
  fieldCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.xs },
  bioInput: { fontSize: fontSize.md, color: colors.text, minHeight: 70, textAlignVertical: 'top' },
  charCount: { fontSize: fontSize.xs, color: colors.textLight, textAlign: 'right', marginTop: spacing.xs },
  pickerValue: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  pickerPlaceholder: { color: colors.textLight },
  saveBar: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  pickerModal: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '60%' },
  pickerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  pickerItem: { paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerItemText: { fontSize: fontSize.md, color: colors.text },
  pickerItemSelected: { color: colors.primary, fontWeight: fontWeight.semibold },
})
