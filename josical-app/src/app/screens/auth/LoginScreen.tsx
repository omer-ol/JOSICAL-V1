import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input, Divider, GoogleSignInButton, ErrorBanner } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme'
import { loginSchema } from '../../../lib/validation'
import { useGoogleAuth, getGoogleIdToken } from '../../../lib/googleAuth'
import { useAuthStore } from '../../../stores/authStore'
import type { AuthScreenProps } from '../../navigation/types'

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, loginWithGoogle, isLoading } = useAuthStore()
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

  const handleLogin = async () => {
    setAuthError(null)
    const result = loginSchema.safeParse(form)
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
      await login(result.data.email, result.data.password)
    } catch {
      setAuthError('Incorrect email or password. Please try again.')
    }
  }

  const handleGoogleSignIn = () => {
    setAuthError(null)
    promptAsync()
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Good to see you again</Text>

          <ErrorBanner message={authError} onDismiss={() => setAuthError(null)} />

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            isLoading={googleLoading}
            disabled={!request}
          />

          <Divider label="or" />

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
            placeholder="Your password"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            error={errors.password}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Log In"
            onPress={handleLogin}
            isLoading={isLoading}
            size="lg"
            style={styles.loginButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to JoSial? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create account</Text>
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
  forgotRow: { alignItems: 'flex-end', marginTop: -spacing.xs, marginBottom: spacing.lg },
  forgotText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  loginButton: { marginBottom: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: fontSize.md, color: colors.textSecondary },
  footerLink: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
})
