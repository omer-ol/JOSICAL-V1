import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useAuthStore } from '../../../stores/authStore'
import { useProfileStore } from '../../../stores/profileStore'
import { supabase } from '../../../lib/supabase'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui'
import { getCityNames, getNeighborhoods, getLocationCoords } from '../../../constants/locations'
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../../constants/theme'

export function MyProfileScreen() {
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Profile</Text>

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar} activeOpacity={0.8}>
          <Avatar uri={displayUri} name={profile?.name} size="xxl" />
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{profile?.name ?? ''}</Text>

        {/* Bio */}
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

        {/* City */}
        <TouchableOpacity style={styles.fieldCard} onPress={() => setShowCityPicker(true)}>
          <Text style={styles.fieldLabel}>City</Text>
          <Text style={[styles.pickerValue, !city && styles.pickerPlaceholder]}>
            {city || 'Select your city'}
          </Text>
        </TouchableOpacity>

        {/* Neighborhood */}
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

      {/* City Picker Modal */}
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

      {/* Neighborhood Picker Modal */}
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.lg, alignItems: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: colors.text, letterSpacing: -0.5, marginBottom: spacing.xl, alignSelf: 'flex-start' },
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
