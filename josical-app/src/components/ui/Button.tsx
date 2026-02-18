import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { colors, borderRadius, fontSize, fontWeight, spacing, shadow } from '../../constants/theme'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  readonly title: string
  readonly onPress: () => void
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly isLoading?: boolean
  readonly disabled?: boolean
  readonly style?: ViewStyle
  readonly fullWidth?: boolean
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.text, sizeTextStyles[size], textVariantStyles[variant]]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
})

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    minHeight: 36,
  },
  md: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minHeight: 50,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    minHeight: 56,
    ...shadow.sm,
  },
}

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
}

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.white },
  secondary: { color: colors.primaryDark },
  outline: { color: colors.primary },
  ghost: { color: colors.primary },
  danger: { color: colors.white },
}
