import React, { useState } from 'react'
import { View, TextInput, Text, StyleSheet, TouchableOpacity, type TextInputProps } from 'react-native'
import { colors, borderRadius, fontSize, spacing, fontWeight } from '../../constants/theme'

type InputProps = TextInputProps & {
  readonly label?: string
  readonly error?: string
  readonly hint?: string
  readonly rightElement?: React.ReactNode
}

export function Input({ label, error, hint, rightElement, style, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        error ? styles.inputWrapperError : undefined,
      ]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textLight}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 50,
  },
  rightElement: {
    paddingRight: spacing.md,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: 2,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginLeft: 2,
  },
})
