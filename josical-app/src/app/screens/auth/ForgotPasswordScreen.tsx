import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '../../../components/ui'
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme'
import { useAuthStore } from '../../../stores/authStore'
import type { AuthScreenProps } from '../../navigation/types'

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const { resetPassword } = useAuthStore()

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }
    setIsLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase())
      setIsSent(true)
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>📬</Text>
          <Text style={styles.title}>Check your inbox</Text>
          <Text style={styles.subtitle}>
            We sent a reset link to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Button title="Back to Login" onPress={() => navigation.navigate('Login')} size="lg" style={styles.button} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </Text>
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="done"
          onSubmitEditing={handleReset}
        />
        <Button title="Send Reset Link" onPress={handleReset} isLoading={isLoading} size="lg" style={styles.button} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  backButton: { paddingTop: spacing.md, marginBottom: spacing.xl },
  backText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
  content: { flex: 1, paddingTop: spacing.sm },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: spacing.lg },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },
  emailHighlight: { color: colors.text, fontWeight: fontWeight.semibold },
  button: { marginTop: spacing.sm },
})
