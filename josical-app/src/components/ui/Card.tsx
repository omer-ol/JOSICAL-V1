import React, { type ReactNode } from 'react'
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native'
import { colors, borderRadius, shadow } from '../../constants/theme'

type CardProps = {
  readonly children: ReactNode
  readonly style?: ViewStyle
  readonly onPress?: () => void
  readonly elevation?: 'sm' | 'md' | 'lg'
}

export function Card({ children, style, onPress, elevation = 'sm' }: CardProps) {
  const cardStyle = [styles.card, shadowStyles[elevation], style]

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.92}>
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={cardStyle}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
})

const shadowStyles = {
  sm: shadow.sm,
  md: shadow.md,
  lg: shadow.lg,
}
