import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { colors } from '../../constants/theme'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

type AvatarProps = {
  readonly uri?: string | null
  readonly name?: string
  readonly size?: AvatarSize
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 88,
  xxl: 120,
}

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 44,
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const dimension = SIZE_MAP[size]
  const style = { width: dimension, height: dimension, borderRadius: dimension / 2 }

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, style]}
        contentFit="cover"
        transition={200}
      />
    )
  }

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <View style={[styles.fallback, style]}>
      <Text style={[styles.initials, { fontSize: FONT_SIZE_MAP[size] }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray[200],
  },
  fallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
})
