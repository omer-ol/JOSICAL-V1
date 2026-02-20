import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, spacing, fontSize, fontWeight, borderRadius, hitSlop } from '../../constants/theme'

type ErrorBannerProps = {
  readonly message: string | null
  readonly onDismiss?: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={hitSlop}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
    flex: 1,
    marginRight: spacing.sm,
  },
  dismiss: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: fontWeight.bold,
  },
})
