import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { Button, Input } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../../constants/theme'
import { useAuthStore } from '../../../stores/authStore'
import { useProfileStore } from '../../../stores/profileStore'
import { getCityNames, getNeighborhoods, getLocationCoords } from '../../../constants/locations'
import { supabase } from '../../../lib/supabase'
import type { OnboardingScreenProps } from '../../navigation/types'

type Props = OnboardingScreenProps<'ProfileSetup'>

export function ProfileSetupScreen({ navigation }: Props) {
  const { profile, setProfile } = useAuthStore()
  const { updateProfile } = useProfileStore()
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [showNeighborhoodPicker, setShowNeighborhoodPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const cities = getCityNames()
  const neighborhoods = city ? getNeighborhoods(city) : []

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
    const path = `avatars/${user.id}.${ext}`
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

  const handleNext = async () => {
    setIsLoading(true)
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
      navigation.navigate('DogSetup')
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={[styles.progressStep, step === 1 && styles.progressStepActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepLabel}>Step 1 of 3</Text>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>Let neighbors know who you are</Text>

        <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>📷</Text>
              <Text style={styles.avatarPlaceholderLabel}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          label="Bio"
          placeholder="Tell people about you and your dog..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          maxLength={200}
          hint={`${bio.length}/200`}
          style={styles.bioInput}
        />

        <TouchableOpacity style={styles.picker} onPress={() => setShowCityPicker(true)}>
          <Text style={styles.pickerLabel}>City</Text>
          <Text style={[styles.pickerValue, !city && styles.pickerPlaceholder]}>
            {city || 'Select your city'}
          </Text>
        </TouchableOpacity>

        {city && (
          <TouchableOpacity style={styles.picker} onPress={() => setShowNeighborhoodPicker(true)}>
            <Text style={styles.pickerLabel}>Neighborhood</Text>
            <Text style={[styles.pickerValue, !neighborhood && styles.pickerPlaceholder]}>
              {neighborhood || 'Select neighborhood'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.buttonRow}>
          <Button title="Skip" onPress={() => navigation.navigate('DogSetup')} variant="ghost" fullWidth={false} style={styles.skipButton} />
          <Button title="Next →" onPress={handleNext} isLoading={isLoading} fullWidth={false} style={styles.nextButton} />
        </View>
      </ScrollView>

      {showCityPicker && (
        <View style={styles.pickerModal}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select City</Text>
            <FlatList
              data={cities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => {
                  setCity(item)
                  setNeighborhood('')
                  setShowCityPicker(false)
                }}>
                  <Text style={[styles.pickerItemText, item === city && styles.pickerItemSelected]}>{item}</Text>
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
                <TouchableOpacity style={styles.pickerItem} onPress={() => {
                  setNeighborhood(item)
                  setShowNeighborhoodPicker(false)
                }}>
                  <Text style={[styles.pickerItemText, item === neighborhood && styles.pickerItemSelected]}>{item}</Text>
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
  progressBar: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressStepActive: { backgroundColor: colors.primary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.lg },
  stepLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: colors.text, letterSpacing: -0.5, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl },
  avatarPicker: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    ...shadow.md,
  },
  avatarImage: { width: 100, height: 100 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: { fontSize: 28 },
  avatarPlaceholderLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  bioInput: { textAlignVertical: 'top', height: 90 },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pickerLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 2 },
  pickerValue: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  pickerPlaceholder: { color: colors.textLight },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  skipButton: { paddingHorizontal: spacing.lg },
  nextButton: { paddingHorizontal: spacing.xl },
  pickerModal: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '60%' },
  pickerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  pickerItem: { paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerItemText: { fontSize: fontSize.md, color: colors.text },
  pickerItemSelected: { color: colors.primary, fontWeight: fontWeight.semibold },
})
