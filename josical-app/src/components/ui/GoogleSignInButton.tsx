import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import { colors, borderRadius, fontSize, fontWeight, spacing, shadow } from '../../constants/theme'

type GoogleSignInButtonProps = {
  readonly onPress: () => void
  readonly isLoading?: boolean
  readonly disabled?: boolean
  readonly style?: ViewStyle
}

function GoogleLogo() {
  return (
    <View style={logoStyles.container}>
      <Text style={logoStyles.text}>G</Text>
    </View>
  )
}

const logoStyles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  text: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    color: '#4285F4',
  },
})

export function GoogleSignInButton({
  onPress,
  isLoading = false,
  disabled = false,
  style,
}: GoogleSignInButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <View style={styles.content}>
          <GoogleLogo />
          <Text style={styles.text}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 56,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadow.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  disabled: {
    opacity: 0.5,
  },
})
