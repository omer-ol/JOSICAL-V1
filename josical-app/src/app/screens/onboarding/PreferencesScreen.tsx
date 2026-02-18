import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Slider from '@react-native-community/slider'
import { Button } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme'
import { useAuthStore } from '../../../stores/authStore'
import { useProfileStore } from '../../../stores/profileStore'
import type { OnboardingScreenProps } from '../../navigation/types'

type Props = OnboardingScreenProps<'Preferences'>

export function PreferencesScreen({ navigation }: Props) {
  const { setProfile } = useAuthStore()
  const { updatePreferences, completeOnboarding } = useProfileStore()
  const [radius, setRadius] = useState(2)
  const [isDiscoverable, setIsDiscoverable] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      await updatePreferences({ discovery_radius: radius, is_discoverable: isDiscoverable })
      const updated = await completeOnboarding()
      setProfile(updated)
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={[styles.progressStep, styles.progressStepActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepLabel}>Step 3 of 3</Text>
        <Text style={styles.title}>Your preferences</Text>
        <Text style={styles.subtitle}>Customize your discovery experience</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discovery Radius</Text>
          <Text style={styles.cardSubtitle}>How far should we look for dog owners near you?</Text>
          <View style={styles.radiusDisplay}>
            <Text style={styles.radiusValue}>{radius < 1 ? `${Math.round(radius * 1000)}m` : `${radius.toFixed(1)} km`}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={10}
            step={0.5}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>500m</Text>
            <Text style={styles.sliderLabel}>10 km</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.cardTitle}>Discoverable</Text>
              <Text style={styles.cardSubtitle}>Let other dog owners find you</Text>
            </View>
            <Switch
              value={isDiscoverable}
              onValueChange={setIsDiscoverable}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.readyCard}>
          <Text style={styles.readyEmoji}>🎉</Text>
          <Text style={styles.readyTitle}>You're all set!</Text>
          <Text style={styles.readySubtitle}>
            Your profile is ready. Start discovering dog owners in your neighborhood.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <Button title="Back" onPress={() => navigation.goBack()} variant="outline" fullWidth={false} style={styles.backButton} />
          <Button title="Let's go! 🐾" onPress={handleFinish} isLoading={isLoading} fullWidth={false} style={styles.finishButton} />
        </View>
      </ScrollView>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: 2 },
  cardSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  radiusDisplay: { alignItems: 'center', marginBottom: spacing.sm },
  radiusValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: colors.primary },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: fontSize.xs, color: colors.textLight },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preferenceInfo: { flex: 1 },
  readyCard: { backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  readyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  readyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, color: colors.primaryDark, marginBottom: spacing.xs },
  readySubtitle: { fontSize: fontSize.sm, color: colors.primaryDark, textAlign: 'center', lineHeight: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { paddingHorizontal: spacing.lg },
  finishButton: { paddingHorizontal: spacing.xl },
})
