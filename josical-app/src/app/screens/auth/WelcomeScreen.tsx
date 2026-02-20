import React, { useEffect, useState } from 'react'
import { View, Text, Image, StyleSheet, Dimensions, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Button, Divider, GoogleSignInButton } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme'
import { useGoogleAuth, getGoogleIdToken } from '../../../lib/googleAuth'
import { useAuthStore } from '../../../stores/authStore'
import type { AuthScreenProps } from '../../navigation/types'

const { height } = Dimensions.get('window')

export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const { loginWithGoogle } = useAuthStore()
  const { request, response, promptAsync } = useGoogleAuth()

  useEffect(() => {
    const idToken = getGoogleIdToken(response)
    if (!idToken) return

    setGoogleLoading(true)
    loginWithGoogle(idToken)
      .catch(() => {
        Alert.alert('Sign-in Failed', 'Could not complete Google sign-in. Please try again.')
      })
      .finally(() => setGoogleLoading(false))
  }, [response, loginWithGoogle])

  const handleGoogleSignIn = () => {
    promptAsync()
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#FFF8EC', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.headline}>Your dog's social{'\n'}community awaits</Text>

        <Text style={styles.subtitle}>
          Discover dog owners near you.{'\n'}
          Make friends. Build connections.
        </Text>

        <View style={styles.pillsRow}>
          {['🐾 Discover Neighbors', '💬 Chat & Connect', '🐕 Dog Profiles'].map((tag) => (
            <View key={tag} style={styles.pill}>
              <Text style={styles.pillText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('Register')}
          size="lg"
        />

        <Divider label="or" />

        <GoogleSignInButton
          onPress={handleGoogleSignIn}
          isLoading={googleLoading}
          disabled={!request}
        />

        <Button
          title="I already have an account"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
          size="md"
          style={styles.loginButton}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.04,
  },
  logoContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
  },
  headline: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    textAlign: 'center',
    lineHeight: fontSize.xxxl * 1.2,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.6,
    marginBottom: spacing.xl,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    marginHorizontal: 3,
    marginVertical: 3,
  },
  pillText: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontWeight: fontWeight.medium,
  },
  buttons: {
    paddingBottom: spacing.xl,
  },
  loginButton: {
    marginTop: spacing.xs,
  },
})
