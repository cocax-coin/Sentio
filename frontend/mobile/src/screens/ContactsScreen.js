/**
 * Contacts Screen
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ContactsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>👥</Text>
      <Text style={styles.title}>Contacts</Text>
      <Text style={styles.subtitle}>Your contacts will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  icon: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#999', marginTop: 8 },
});
