import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input, Divider, GoogleSignInButton, ErrorBanner } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme'
import { registerSchema } from '../../../lib/validation'
import { useGoogleAuth, getGoogleIdToken } from '../../../lib/googleAuth'
import { useAuthStore } from '../../../stores/authStore'
import type { AuthScreenProps } from '../../navigation/types'

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { register, loginWithGoogle, isLoading } = useAuthStore()
  const { request, response, promptAsync } = useGoogleAuth()

  useEffect(() => {
    const idToken = getGoogleIdToken(response)
    if (!idToken) return

    setGoogleLoading(true)
    setAuthError(null)
    loginWithGoogle(idToken)
      .catch(() => {
        setAuthError('Could not complete Google sign-in. Please try again.')
      })
      .finally(() => setGoogleLoading(false))
  }, [response, loginWithGoogle])

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setAuthError(null)
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleRegister = async () => {
    setAuthError(null)
    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    try {
      await register(result.data.name, result.data.email, result.data.password)
    } catch (error) {
      if (error instanceof Error && error.message === 'CONFIRMATION_REQUIRED') {
        setConfirmationSent(true)
        return
      }
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      setAuthError(message)
    }
  }

  const handleGoogleSignIn = () => {
    setAuthError(null)
    promptAsync()
  }

  if (confirmationSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationEmoji}>📧</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.confirmationText}>
            We sent a confirmation link to {form.email}. Please check your inbox and click the link to activate your account.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join the JoSial community</Text>

          <ErrorBanner message={authError} onDismiss={() => setAuthError(null)} />

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            isLoading={googleLoading}
            disabled={!request}
          />

          <Divider label="or" />

          <Input
            label="Full Name"
            placeholder="Your name"
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            error={errors.password}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            }
          />
          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            error={errors.confirmPassword}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <View style={styles.terms}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <Button
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            size="lg"
            style={styles.registerButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  backButton: { marginBottom: spacing.xl },
  backText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl },
  showHide: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  terms: { marginBottom: spacing.lg },
  termsText: { fontSize: fontSize.sm, color: colors.textLight, lineHeight: 20 },
  termsLink: { color: colors.primary, fontWeight: fontWeight.semibold },
  registerButton: { marginBottom: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: fontSize.md, color: colors.textSecondary },
  footerLink: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
  confirmationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  confirmationEmoji: { fontSize: 56, marginBottom: spacing.lg },
  confirmationText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
})
