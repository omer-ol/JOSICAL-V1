import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fontSize } from '../../constants/theme'

type DividerProps = {
  readonly label?: string
}

export function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <View style={styles.rowContainer}>
        <View style={styles.line} />
        <Text style={styles.label}>{label}</Text>
        <View style={styles.line} />
      </View>
    )
  }
  return <View style={styles.simpleLine} />
}

const styles = StyleSheet.create({
  simpleLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginHorizontal: spacing.sm,
  },
})
