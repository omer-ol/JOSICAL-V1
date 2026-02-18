import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, fontSize, fontWeight } from '../../../constants/theme'

export function FriendsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.text}>FriendsScreen</Text>
        <Text style={styles.sub}>Coming soon</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  sub: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 8 },
})
