import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { Button, Input } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../../constants/theme'
import { useDogsStore } from '../../../stores/dogsStore'
import { searchBreeds } from '../../../constants/breeds'
import { supabase } from '../../../lib/supabase'
import type { OnboardingScreenProps } from '../../navigation/types'

type Props = OnboardingScreenProps<'DogSetup'>

type DogForm = {
  name: string
  breed: string
  photoUri: string | null
  gender: 'male' | 'female' | null
  age_category: 'puppy' | 'adult' | 'senior' | null
  is_neutered: boolean
}

const emptyDog = (): DogForm => ({
  name: '', breed: '', photoUri: null,
  gender: null, age_category: null, is_neutered: false,
})

export function DogSetupScreen({ navigation }: Props) {
  const { addDog } = useDogsStore()
  const [dogs, setDogs] = useState<DogForm[]>([emptyDog()])
  const [breedQuery, setBreedQuery] = useState<string>('')
  const [activeDogIndex, setActiveDogIndex] = useState(0)
  const [showBreedSearch, setShowBreedSearch] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const currentDog = dogs[activeDogIndex]!
  const breedResults = searchBreeds(breedQuery)

  const updateCurrentDog = (updates: Partial<DogForm>) => {
    setDogs((prev) => prev.map((d, i) => i === activeDogIndex ? { ...d, ...updates } : d))
  }

  const pickDogPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      updateCurrentDog({ photoUri: result.assets[0].uri })
    }
  }

  const uploadDogPhoto = async (uri: string, dogIndex: number): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const ext = uri.split('.').pop() ?? 'jpg'
    const path = `dogs/${user.id}_${dogIndex}_${Date.now()}.${ext}`
    const response = await fetch(uri)
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const { error } = await supabase.storage.from('dogs').upload(path, arrayBuffer, {
      contentType: `image/${ext}`, upsert: true,
    })
    if (error) return null
    const { data } = supabase.storage.from('dogs').getPublicUrl(path)
    return data.publicUrl
  }

  const handleNext = async () => {
    if (!currentDog.name.trim()) {
      Alert.alert('Required', "Please enter your dog's name")
      return
    }
    setIsLoading(true)
    try {
      for (let i = 0; i < dogs.length; i++) {
        const dog = dogs[i]!
        if (!dog.name.trim()) continue
        let photoUrl: string | undefined
        if (dog.photoUri) {
          photoUrl = (await uploadDogPhoto(dog.photoUri, i)) ?? undefined
        }
        await addDog({
          name: dog.name.trim(),
          breed: dog.breed || undefined,
          gender: dog.gender ?? undefined,
          age_category: dog.age_category ?? undefined,
          is_neutered: dog.is_neutered,
          ...(photoUrl ? { photo_url: photoUrl } : {}),
        })
      }
      navigation.navigate('Preferences')
    } catch (error) {
      Alert.alert('Error', 'Failed to save dog info. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={[styles.progressStep, step <= 2 && styles.progressStepActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepLabel}>Step 2 of 3</Text>
        <Text style={styles.title}>Your dog</Text>
        <Text style={styles.subtitle}>Tell us about your furry friend</Text>

        {dogs.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dogTabs}>
            {dogs.map((dog, i) => (
              <TouchableOpacity key={i} style={[styles.dogTab, i === activeDogIndex && styles.dogTabActive]} onPress={() => setActiveDogIndex(i)}>
                <Text style={[styles.dogTabText, i === activeDogIndex && styles.dogTabTextActive]}>
                  {dog.name || `Dog ${i + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.photoPicker} onPress={pickDogPhoto}>
          {currentDog.photoUri ? (
            <Image source={{ uri: currentDog.photoUri }} style={styles.dogPhoto} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>🐕</Text>
              <Text style={styles.photoLabel}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          label="Dog's Name *"
          placeholder="What's your dog's name?"
          value={currentDog.name}
          onChangeText={(v) => updateCurrentDog({ name: v })}
          autoCapitalize="words"
        />

        <TouchableOpacity style={styles.picker} onPress={() => setShowBreedSearch(true)}>
          <Text style={styles.pickerLabel}>Breed</Text>
          <Text style={[styles.pickerValue, !currentDog.breed && styles.pickerPlaceholder]}>
            {currentDog.breed || 'Select breed (optional)'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.toggleRow}>
          {(['male', 'female'] as const).map((g) => (
            <TouchableOpacity key={g} style={[styles.toggleBtn, currentDog.gender === g && styles.toggleBtnActive]} onPress={() => updateCurrentDog({ gender: g })}>
              <Text style={[styles.toggleText, currentDog.gender === g && styles.toggleTextActive]}>
                {g === 'male' ? '♂ Male' : '♀ Female'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Age</Text>
        <View style={styles.toggleRow}>
          {(['puppy', 'adult', 'senior'] as const).map((a) => (
            <TouchableOpacity key={a} style={[styles.toggleBtn, currentDog.age_category === a && styles.toggleBtnActive]} onPress={() => updateCurrentDog({ age_category: a })}>
              <Text style={[styles.toggleText, currentDog.age_category === a && styles.toggleTextActive]}>
                {a === 'puppy' ? '🐾 Puppy' : a === 'adult' ? '🦴 Adult' : '🌟 Senior'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.neuterRow} onPress={() => updateCurrentDog({ is_neutered: !currentDog.is_neutered })}>
          <View style={[styles.checkbox, currentDog.is_neutered && styles.checkboxChecked]}>
            {currentDog.is_neutered && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.neuterLabel}>Neutered / Spayed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addDogBtn} onPress={() => {
          setDogs((prev) => [...prev, emptyDog()])
          setActiveDogIndex(dogs.length)
        }}>
          <Text style={styles.addDogText}>+ Add Another Dog</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <Button title="Back" onPress={() => navigation.goBack()} variant="outline" fullWidth={false} style={styles.backButton} />
          <Button title="Next →" onPress={handleNext} isLoading={isLoading} fullWidth={false} style={styles.nextButton} />
        </View>
      </ScrollView>

      {showBreedSearch && (
        <View style={styles.pickerModal}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Search Breed</Text>
            <TextInput
              style={styles.breedSearchInput}
              placeholder="Type to search..."
              value={breedQuery}
              onChangeText={setBreedQuery}
              autoFocus
            />
            <FlatList
              data={breedResults as string[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => {
                  updateCurrentDog({ breed: item })
                  setShowBreedSearch(false)
                  setBreedQuery('')
                }}>
                  <Text style={styles.pickerItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                breedQuery.length >= 2
                  ? <Text style={styles.noResults}>No breeds found</Text>
                  : <Text style={styles.noResults}>Type at least 2 characters</Text>
              }
            />
            <TouchableOpacity style={styles.closeBreed} onPress={() => { setShowBreedSearch(false); setBreedQuery('') }}>
              <Text style={styles.closeBreedText}>Cancel</Text>
            </TouchableOpacity>
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
  dogTabs: { marginBottom: spacing.md },
  dogTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.backgroundSecondary, marginRight: spacing.xs },
  dogTabActive: { backgroundColor: colors.primary },
  dogTabText: { fontSize: fontSize.sm, color: colors.textSecondary },
  dogTabTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  photoPicker: { alignSelf: 'center', width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: spacing.xl, ...shadow.md },
  dogPhoto: { width: 100, height: 100 },
  photoPlaceholder: { width: 100, height: 100, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderRadius: 50, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  photoEmoji: { fontSize: 32 },
  photoLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  picker: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1.5, borderColor: colors.border },
  pickerLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 2 },
  pickerValue: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  pickerPlaceholder: { color: colors.textLight },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.sm },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.backgroundSecondary, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  toggleText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  toggleTextActive: { color: colors.primaryDark, fontWeight: fontWeight.semibold },
  neuterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: fontWeight.bold },
  neuterLabel: { fontSize: fontSize.md, color: colors.text },
  addDogBtn: { alignSelf: 'flex-start', paddingVertical: spacing.xs, marginBottom: spacing.xl },
  addDogText: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { paddingHorizontal: spacing.lg },
  nextButton: { paddingHorizontal: spacing.xl },
  pickerModal: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '70%' },
  pickerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  breedSearchInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md, marginBottom: spacing.sm },
  pickerItem: { paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerItemText: { fontSize: fontSize.md, color: colors.text },
  noResults: { textAlign: 'center', color: colors.textLight, paddingVertical: spacing.lg },
  closeBreed: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm },
  closeBreedText: { color: colors.textSecondary, fontSize: fontSize.md },
})
