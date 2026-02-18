# MyProfileScreen — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the "Coming soon" placeholder in `MyProfileScreen` with a full inline-editable profile view that fixes the broken add-photo button.

**Architecture:** Single screen, pre-populated from `authStore.profile`. Local state tracks edits. A Save button appears only when fields differ from stored values (`isDirty`). Reuses `pickAvatar`/`uploadAvatar` logic and city/neighborhood picker UI from `ProfileSetupScreen`.

**Tech Stack:** React Native, Expo, `expo-image-picker`, `expo-image`, Zustand (`authStore`, `profileStore`), Supabase storage.

> **Note:** No jest/test infrastructure exists in this project. Verification steps are manual (Expo Go / simulator).

---

### Task 1: Rewrite MyProfileScreen — avatar section

**Files:**
- Modify: `josical-app/src/app/screens/profile/MyProfileScreen.tsx`

**Step 1: Replace the placeholder with scaffold + avatar**

Replace the entire file content with the following:

```tsx
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { useAuthStore } from '../../../stores/authStore'
import { useProfileStore } from '../../../stores/profileStore'
import { supabase } from '../../../lib/supabase'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../../constants/theme'

export function MyProfileScreen() {
  const { profile, setProfile } = useAuthStore()
  const { updateProfile } = useProfileStore()

  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = avatarUri !== null

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let avatarUrl: string | undefined
      if (avatarUri) {
        avatarUrl = (await uploadAvatar(avatarUri)) ?? undefined
      }
      const updated = await updateProfile({
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      setProfile(updated)
      setAvatarUri(null)
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
      </ScrollView>

      {isDirty && (
        <View style={styles.saveBar}>
          <Button title="Save changes" onPress={handleSave} isLoading={isSaving} fullWidth />
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
  saveBar: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
})
```

**Step 2: Verify avatar section renders**

Run the app in Expo Go or simulator. Navigate to the profile tab. You should see:
- The "My Profile" title
- Your avatar (photo if set, initials if not) at 120px with a 📷 badge
- Your name below it
- No Save button yet (nothing is dirty)

Tap the avatar → image picker should open → select a photo → avatar updates → Save button appears at bottom.

**Step 3: Commit**

```bash
git add josical-app/src/app/screens/profile/MyProfileScreen.tsx
git commit -m "feat: add avatar section to MyProfileScreen with working photo picker"
```

---

### Task 2: Add editable bio field

**Files:**
- Modify: `josical-app/src/app/screens/profile/MyProfileScreen.tsx`

**Step 1: Add bio state and isDirty logic**

After the `avatarUri` state declaration, add:

```tsx
const [bio, setBio] = useState(profile?.bio ?? '')
```

Update `isDirty`:
```tsx
const isDirty = avatarUri !== null || bio !== (profile?.bio ?? '')
```

**Step 2: Add bio to handleSave**

Inside `handleSave`, update the `updateProfile` call:

```tsx
const updated = await updateProfile({
  bio: bio.trim() || undefined,
  ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
})
setProfile(updated)
setAvatarUri(null)
setBio(updated.bio ?? '')
```

**Step 3: Add bio input to JSX**

After the `<Text style={styles.name}>` line, add:

```tsx
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
```

Add `TextInput` to the React Native import at the top.

**Step 4: Add styles**

Add to `StyleSheet.create`:

```tsx
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
```

**Step 5: Verify**

In the app: bio field shows current bio value. Edit it → Save button appears. Tap Save → bio updates in Supabase and UI.

**Step 6: Commit**

```bash
git add josical-app/src/app/screens/profile/MyProfileScreen.tsx
git commit -m "feat: add editable bio field to MyProfileScreen"
```

---

### Task 3: Add city + neighborhood pickers

**Files:**
- Modify: `josical-app/src/app/screens/profile/MyProfileScreen.tsx`

**Step 1: Add city/neighborhood state**

After bio state, add:

```tsx
const [city, setCity] = useState(profile?.city ?? '')
const [neighborhood, setNeighborhood] = useState(profile?.neighborhood ?? '')
const [showCityPicker, setShowCityPicker] = useState(false)
const [showNeighborhoodPicker, setShowNeighborhoodPicker] = useState(false)
```

Add import at top:
```tsx
import { getCityNames, getNeighborhoods, getLocationCoords } from '../../../constants/locations'
import { FlatList } from 'react-native'
```

Add computed values:
```tsx
const cities = getCityNames()
const neighborhoods = city ? getNeighborhoods(city) : []
```

**Step 2: Update isDirty**

```tsx
const isDirty =
  avatarUri !== null ||
  bio !== (profile?.bio ?? '') ||
  city !== (profile?.city ?? '') ||
  neighborhood !== (profile?.neighborhood ?? '')
```

**Step 3: Update handleSave**

```tsx
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
```

**Step 4: Add picker UI in JSX**

After the bio field card, add:

```tsx
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
```

At the bottom of the SafeAreaView (before the closing tag), add the picker modals:

```tsx
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
```

**Step 5: Add picker styles**

```tsx
pickerValue: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
pickerPlaceholder: { color: colors.textLight },
pickerModal: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
pickerSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '60%' },
pickerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
pickerItem: { paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
pickerItemText: { fontSize: fontSize.md, color: colors.text },
pickerItemSelected: { color: colors.primary, fontWeight: fontWeight.semibold },
```

**Step 6: Verify**

In the app: city field shows current city. Tap → bottom sheet with city list. Select a city → neighborhood picker appears. Change either → Save button appears. Save → updates persist.

**Step 7: Commit**

```bash
git add josical-app/src/app/screens/profile/MyProfileScreen.tsx
git commit -m "feat: add city and neighborhood pickers to MyProfileScreen"
```

---

### Task 4: Final verification + close issue

**Step 1: Full end-to-end check**

1. Open app, go to profile tab
2. Tap avatar → image picker opens ✓
3. Select photo → avatar updates, Save button appears ✓
4. Edit bio → Save button stays visible ✓
5. Select city + neighborhood ✓
6. Tap Save → spinner shows → data persists after app reload ✓
7. Make no changes → Save button is hidden ✓

**Step 2: Close GitHub issue**

```bash
gh issue close 1 --comment "Fixed: MyProfileScreen now supports photo picking, bio editing, and city/neighborhood selection with inline save."
```
