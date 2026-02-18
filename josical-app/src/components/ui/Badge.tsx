import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontSize, borderRadius } from '../../constants/theme'

type BadgeProps = {
  readonly count: number
  readonly max?: number
}

export function Badge({ count, max = 99 }: BadgeProps) {
  if (count <= 0) return null
  const label = count > max ? `${max}+` : String(count)

  return (
    <View style={[styles.badge, label.length > 1 && styles.badgeWide]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeWide: {
    paddingHorizontal: 5,
  },
  text: {
    color: colors.white,
    fontSize: fontSize.xs - 1,
    fontWeight: '700',
    lineHeight: 16,
  },
})
