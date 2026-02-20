import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, FlatList, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useAuthStore } from '../../../stores/authStore'
import { useProfileStore } from '../../../stores/profileStore'
import { useDogsStore } from '../../../stores/dogsStore'
import { supabase } from '../../../lib/supabase'
import { Avatar } from '../../../components/ui/Avatar'
import { Button, Divider } from '../../../components/ui'
import { getCityNames, getNeighborhoods, getLocationCoords } from '../../../constants/locations'
import { DOG_BREEDS } from '../../../constants/breeds'
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

// ─── Owner Profile ───────────────────────────────────────

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
    return `${data.publicUrl}?t=${Date.now()}`
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let avatarUrl: string | undefined
      if (avatarUri) {
        const uploadedUrl = await uploadAvatar(avatarUri)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
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
      if (avatarUrl) {
        setAvatarUri(null)
      }
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
        <PickerModal
          title="Select City"
          data={cities}
          selected={city}
          onSelect={(item) => {
            setCity(item)
            setNeighborhood('')
            setShowCityPicker(false)
          }}
          onClose={() => setShowCityPicker(false)}
        />
      )}

      {showNeighborhoodPicker && (
        <PickerModal
          title="Select Neighborhood"
          data={neighborhoods as string[]}
          selected={neighborhood}
          onSelect={(item) => {
            setNeighborhood(item)
            setShowNeighborhoodPicker(false)
          }}
          onClose={() => setShowNeighborhoodPicker(false)}
        />
      )}
    </>
  )
}

// ─── Picker Modal ────────────────────────────────────────

function PickerModal({ title, data, selected, onSelect, onClose }: {
  readonly title: string
  readonly data: readonly string[]
  readonly selected: string
  readonly onSelect: (item: string) => void
  readonly onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? data.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
    : data

  return (
    <View style={styles.pickerModal}>
      <TouchableOpacity style={styles.pickerBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.pickerSheet}>
        <Text style={styles.pickerTitle}>{title}</Text>
        {data.length > 10 && (
          <TextInput
            style={pickerSearchStyles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={colors.textLight}
          />
        )}
        <FlatList
          data={filtered as string[]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => onSelect(item)}
            >
              <Text style={[styles.pickerItemText, item === selected && styles.pickerItemSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  )
}

const pickerSearchStyles = StyleSheet.create({
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
})

// ─── Dog Profile ─────────────────────────────────────────

type DogFormData = {
  readonly name: string
  readonly breed: string
  readonly gender: 'male' | 'female' | ''
  readonly age_category: 'puppy' | 'adult' | 'senior' | ''
  readonly is_neutered: boolean
}

const EMPTY_DOG_FORM: DogFormData = {
  name: '',
  breed: '',
  gender: '',
  age_category: '',
  is_neutered: false,
}

function dogToForm(dog: Dog): DogFormData {
  return {
    name: dog.name,
    breed: dog.breed ?? '',
    gender: dog.gender ?? '',
    age_category: dog.age_category ?? '',
    is_neutered: dog.is_neutered,
  }
}

function DogProfile() {
  const { myDogs, fetchMyDogs, addDog, updateDog, deleteDog, isLoading } = useDogsStore()
  const [editingDogId, setEditingDogId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchMyDogs()
  }, [fetchMyDogs])

  const handleStartEdit = (dog: Dog) => {
    setEditingDogId(dog.id)
    setShowAddForm(false)
  }

  const handleCancelEdit = () => {
    setEditingDogId(null)
  }

  const handleStartAdd = () => {
    setShowAddForm(true)
    setEditingDogId(null)
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
  }

  if (isLoading) {
    return (
      <View style={dogStyles.emptyContainer}>
        <Text style={dogStyles.emptyText}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {myDogs.map((dog) =>
        editingDogId === dog.id ? (
          <DogEditForm
            key={dog.id}
            dog={dog}
            onSave={async (data) => {
              await updateDog(dog.id, {
                name: data.name,
                breed: data.breed || undefined,
                gender: data.gender || undefined,
                age_category: data.age_category || undefined,
                is_neutered: data.is_neutered,
              })
              setEditingDogId(null)
            }}
            onCancel={handleCancelEdit}
            onDelete={async () => {
              await deleteDog(dog.id)
              setEditingDogId(null)
            }}
          />
        ) : (
          <DogCard key={dog.id} dog={dog} onEdit={() => handleStartEdit(dog)} />
        ),
      )}

      {showAddForm ? (
        <DogEditForm
          dog={null}
          onSave={async (data) => {
            await addDog({
              name: data.name,
              breed: data.breed || undefined,
              gender: data.gender || undefined,
              age_category: data.age_category || undefined,
              is_neutered: data.is_neutered,
            })
            setShowAddForm(false)
          }}
          onCancel={handleCancelAdd}
          onDelete={null}
        />
      ) : (
        <TouchableOpacity style={dogStyles.addButton} onPress={handleStartAdd} activeOpacity={0.7}>
          <Text style={dogStyles.addButtonIcon}>+</Text>
          <Text style={dogStyles.addButtonText}>Add a Dog</Text>
        </TouchableOpacity>
      )}

      {myDogs.length === 0 && !showAddForm && (
        <View style={dogStyles.emptyHint}>
          <Text style={dogStyles.emptyEmoji}>🐕</Text>
          <Text style={dogStyles.emptyText}>
            Tap "Add a Dog" to add your first dog profile
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

// ─── Dog Card (read-only) ────────────────────────────────

function DogCard({ dog, onEdit }: { readonly dog: Dog; readonly onEdit: () => void }) {
  return (
    <TouchableOpacity style={dogStyles.card} onPress={onEdit} activeOpacity={0.7}>
      <View style={dogStyles.cardHeader}>
        <Avatar uri={dog.photo_url} name={dog.name} size="lg" />
        <View style={dogStyles.cardInfo}>
          <Text style={dogStyles.dogName}>{dog.name}</Text>
          {dog.breed ? <Text style={dogStyles.dogBreed}>{dog.breed}</Text> : null}
        </View>
        <Text style={dogStyles.editHint}>Edit</Text>
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
    </TouchableOpacity>
  )
}

// ─── Dog Edit Form ───────────────────────────────────────

function DogEditForm({ dog, onSave, onCancel, onDelete }: {
  readonly dog: Dog | null
  readonly onSave: (data: DogFormData) => Promise<void>
  readonly onCancel: () => void
  readonly onDelete: (() => Promise<void>) | null
}) {
  const [form, setForm] = useState<DogFormData>(dog ? dogToForm(dog) : EMPTY_DOG_FORM)
  const [showBreedPicker, setShowBreedPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = <K extends keyof DogFormData>(field: K, value: DogFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Dog name is required')
      return
    }
    setIsSaving(true)
    try {
      await onSave(form)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (!onDelete) return

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete ${dog?.name ?? 'this dog'}? This cannot be undone.`)
      if (confirmed) {
        onDelete().catch(() => setError('Failed to delete.'))
      }
      return
    }

    Alert.alert(
      'Delete Dog',
      `Delete ${dog?.name ?? 'this dog'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete().catch(() => setError('Failed to delete.'))
          },
        },
      ],
    )
  }

  return (
    <View style={dogStyles.editCard}>
      <Text style={dogStyles.editTitle}>{dog ? 'Edit Dog' : 'New Dog'}</Text>

      {error ? (
        <View style={dogStyles.errorRow}>
          <Text style={dogStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Name *</Text>
        <TextInput
          style={dogStyles.textInput}
          value={form.name}
          onChangeText={(v) => updateField('name', v)}
          placeholder="Dog's name"
          placeholderTextColor={colors.textLight}
          autoCapitalize="words"
        />
      </View>

      <TouchableOpacity style={styles.fieldCard} onPress={() => setShowBreedPicker(true)}>
        <Text style={styles.fieldLabel}>Breed</Text>
        <Text style={[styles.pickerValue, !form.breed && styles.pickerPlaceholder]}>
          {form.breed || 'Select breed'}
        </Text>
      </TouchableOpacity>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={dogStyles.chipRow}>
          {(['male', 'female'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[dogStyles.selectChip, form.gender === g && dogStyles.selectChipActive]}
              onPress={() => updateField('gender', form.gender === g ? '' : g)}
              activeOpacity={0.7}
            >
              <Text style={[dogStyles.selectChipText, form.gender === g && dogStyles.selectChipTextActive]}>
                {g === 'male' ? '♂ Male' : '♀ Female'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Age</Text>
        <View style={dogStyles.chipRow}>
          {(['puppy', 'adult', 'senior'] as const).map((a) => (
            <TouchableOpacity
              key={a}
              style={[dogStyles.selectChip, form.age_category === a && dogStyles.selectChipActive]}
              onPress={() => updateField('age_category', form.age_category === a ? '' : a)}
              activeOpacity={0.7}
            >
              <Text style={[dogStyles.selectChipText, form.age_category === a && dogStyles.selectChipTextActive]}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.fieldCard}
        onPress={() => updateField('is_neutered', !form.is_neutered)}
        activeOpacity={0.7}
      >
        <View style={dogStyles.toggleRow}>
          <Text style={styles.fieldLabel}>Neutered / Spayed</Text>
          <View style={[dogStyles.toggle, form.is_neutered && dogStyles.toggleActive]}>
            <View style={[dogStyles.toggleKnob, form.is_neutered && dogStyles.toggleKnobActive]} />
          </View>
        </View>
      </TouchableOpacity>

      <View style={dogStyles.formActions}>
        <Button title={dog ? 'Save' : 'Add Dog'} onPress={handleSave} isLoading={isSaving} size="md" />
        <Button title="Cancel" onPress={onCancel} variant="ghost" size="md" />
        {onDelete ? (
          <>
            <Divider />
            <Button title="Delete Dog" onPress={handleDelete} variant="danger" size="sm" />
          </>
        ) : null}
      </View>

      {showBreedPicker && (
        <PickerModal
          title="Select Breed"
          data={DOG_BREEDS}
          selected={form.breed}
          onSelect={(item) => {
            updateField('breed', item)
            setShowBreedPicker(false)
          }}
          onClose={() => setShowBreedPicker(false)}
        />
      )}
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
  emptyHint: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
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
  editHint: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
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
  addButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  addButtonIcon: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    marginRight: spacing.sm,
  },
  addButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  editCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  editTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textInput: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  selectChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  selectChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  selectChipTextActive: {
    color: colors.primaryDark,
    fontWeight: fontWeight.semibold,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gray[300],
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    ...shadow.xs,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  formActions: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  errorRow: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
})

// ─── Main Screen ─────────────────────────────────────────

export function MyProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('owner')
  const { logout } = useAuthStore()

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?')
      if (confirmed) {
        logout().catch(() => {
          window.alert('Failed to log out. Please try again.')
        })
      }
      return
    }

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

// ─── Shared Styles ───────────────────────────────────────

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
  pickerModal: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'flex-end', zIndex: 100 },
  pickerBackdrop: { flex: 1 },
  pickerSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '60%' },
  pickerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  pickerItem: { paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerItemText: { fontSize: fontSize.md, color: colors.text },
  pickerItemSelected: { color: colors.primary, fontWeight: fontWeight.semibold },
})
