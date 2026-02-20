import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Button, Divider } from '../../../components/ui'
import { DOG_BREEDS } from '../../../constants/breeds'
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../../constants/theme'
import { useDogsStore } from '../../../stores/dogsStore'
import type { Dog } from '../../../types'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { ProfileStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<ProfileStackParamList, 'DogProfile'>

type DogFormData = {
  readonly name: string
  readonly breed: string
  readonly gender: 'male' | 'female' | ''
  readonly age_category: 'puppy' | 'adult' | 'senior' | ''
  readonly is_neutered: boolean
}

const EMPTY_FORM: DogFormData = {
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

export function DogProfileScreen({ navigation, route }: Props) {
  const { dogId } = route.params
  const isNew = !dogId

  const { myDogs, addDog, updateDog, deleteDog, fetchMyDogs } = useDogsStore()
  const dog = dogId ? myDogs.find((d) => d.id === dogId) ?? null : null

  const [form, setForm] = useState<DogFormData>(dog ? dogToForm(dog) : EMPTY_FORM)
  const [showBreedPicker, setShowBreedPicker] = useState(false)
  const [breedSearch, setBreedSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dog && dogId) {
      fetchMyDogs()
    }
  }, [dog, dogId, fetchMyDogs])

  useEffect(() => {
    if (dog) {
      setForm(dogToForm(dog))
    }
  }, [dog])

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
      const payload = {
        name: form.name.trim(),
        breed: form.breed || undefined,
        gender: form.gender || undefined,
        age_category: form.age_category || undefined,
        is_neutered: form.is_neutered,
      }
      if (isNew) {
        await addDog(payload)
      } else if (dogId) {
        await updateDog(dogId, payload)
      }
      navigation.goBack()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (!dogId) return

    const doDelete = async () => {
      try {
        await deleteDog(dogId)
        navigation.goBack()
      } catch {
        setError('Failed to delete.')
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${dog?.name ?? 'this dog'}? This cannot be undone.`)) {
        doDelete()
      }
    } else {
      Alert.alert(
        'Delete Dog',
        `Delete ${dog?.name ?? 'this dog'}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      )
    }
  }

  const filteredBreeds = breedSearch
    ? DOG_BREEDS.filter((b) => b.toLowerCase().includes(breedSearch.toLowerCase()))
    : DOG_BREEDS

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{isNew ? 'Add Dog' : 'Edit Dog'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!isNew && dog && (
          <View style={styles.avatarSection}>
            <Avatar uri={dog.photo_url} name={dog.name} size="xl" />
          </View>
        )}

        {error ? (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Name *</Text>
          <TextInput
            style={styles.textInput}
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
          <View style={styles.chipRow}>
            {(['male', 'female'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, form.gender === g && styles.chipActive]}
                onPress={() => updateField('gender', form.gender === g ? '' : g)}
              >
                <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>
                  {g === 'male' ? '♂ Male' : '♀ Female'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Age</Text>
          <View style={styles.chipRow}>
            {(['puppy', 'adult', 'senior'] as const).map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, form.age_category === a && styles.chipActive]}
                onPress={() => updateField('age_category', form.age_category === a ? '' : a)}
              >
                <Text style={[styles.chipText, form.age_category === a && styles.chipTextActive]}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.fieldCard}
          onPress={() => updateField('is_neutered', !form.is_neutered)}
        >
          <View style={styles.toggleRow}>
            <Text style={styles.fieldLabel}>Neutered / Spayed</Text>
            <View style={[styles.toggle, form.is_neutered && styles.toggleActive]}>
              <View style={[styles.toggleKnob, form.is_neutered && styles.toggleKnobActive]} />
            </View>
          </View>
        </TouchableOpacity>

        <Button
          title={isNew ? 'Add Dog' : 'Save Changes'}
          onPress={handleSave}
          isLoading={isSaving}
          size="lg"
          style={styles.saveButton}
        />

        {!isNew && (
          <>
            <Divider />
            <Button
              title="Delete Dog"
              onPress={handleDelete}
              variant="danger"
              size="md"
              style={styles.deleteButton}
            />
          </>
        )}
      </ScrollView>

      {showBreedPicker && (
        <View style={styles.pickerModal}>
          <TouchableOpacity style={styles.pickerBackdrop} onPress={() => setShowBreedPicker(false)} activeOpacity={1} />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Breed</Text>
            <TextInput
              style={styles.pickerSearch}
              value={breedSearch}
              onChangeText={setBreedSearch}
              placeholder="Search breeds..."
              placeholderTextColor={colors.textLight}
            />
            <ScrollView style={styles.pickerList}>
              {filteredBreeds.map((breed) => (
                <TouchableOpacity
                  key={breed}
                  style={styles.pickerItem}
                  onPress={() => {
                    updateField('breed', breed)
                    setShowBreedPicker(false)
                    setBreedSearch('')
                  }}
                >
                  <Text style={[styles.pickerItemText, breed === form.breed && styles.pickerItemSelected]}>
                    {breed}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  placeholder: { width: 32 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.lg },
  errorRow: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: fontSize.sm, color: colors.error, fontWeight: fontWeight.medium },
  fieldCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: { fontSize: fontSize.md, color: colors.text },
  pickerValue: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  pickerPlaceholder: { color: colors.textLight },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipTextActive: { color: colors.primaryDark, fontWeight: fontWeight.semibold },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gray[300],
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    ...shadow.xs,
  },
  toggleKnobActive: { alignSelf: 'flex-end' },
  saveButton: { marginTop: spacing.md },
  deleteButton: { marginTop: spacing.md },
  pickerModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  pickerBackdrop: { flex: 1 },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pickerSearch: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  pickerList: { maxHeight: 300 },
  pickerItem: {
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerItemText: { fontSize: fontSize.md, color: colors.text },
  pickerItemSelected: { color: colors.primary, fontWeight: fontWeight.semibold },
})
