/**
 * Settings Screen
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['auth_token', 'user_id']);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Features</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Smart Reply Suggestions</Text>
            <Text style={styles.settingDesc}>AI-powered reply recommendations</Text>
          </View>
          <Switch
            value={aiEnabled}
            onValueChange={setAiEnabled}
            trackColor={{ false: '#ddd', true: '#6C63FF' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Emotion Analysis</Text>
            <Text style={styles.settingDesc}>Analyze message sentiments</Text>
          </View>
          <Switch
            value={aiEnabled}
            onValueChange={setAiEnabled}
            trackColor={{ false: '#ddd', true: '#6C63FF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDesc}>Receive message notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#ddd', true: '#6C63FF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>🔒 End-to-End Encryption</Text>
          <Text style={styles.menuItemValue}>Enabled ✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>🛡️ Privacy Settings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 12, overflow: 'hidden' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', padding: 14, paddingBottom: 8, textTransform: 'uppercase' },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderTopWidth: 1, borderColor: '#f0f0f0',
  },
  settingLabel: { fontSize: 16, color: '#333' },
  settingDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderTopWidth: 1, borderColor: '#f0f0f0',
  },
  menuItemText: { fontSize: 16, color: '#333' },
  menuItemValue: { fontSize: 14, color: '#6C63FF' },
  menuArrow: { fontSize: 20, color: '#ccc' },
  logoutButton: {
    margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#FF6B6B',
  },
  logoutText: { fontSize: 16, color: '#FF6B6B', fontWeight: '600' },
});
