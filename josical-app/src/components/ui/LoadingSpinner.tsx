import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { colors } from '../../constants/theme'

type LoadingSpinnerProps = {
  readonly fullScreen?: boolean
  readonly size?: 'small' | 'large'
}

export function LoadingSpinner({ fullScreen = false, size = 'large' }: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
