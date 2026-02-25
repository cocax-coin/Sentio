/**
 * Profile Setup Screen - After first login
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from '../utils/api';

const MOODS = ['😊 Happy', '😌 Calm', '🤔 Thoughtful', '😴 Tired', '💪 Motivated', '😎 Confident'];

export default function ProfileSetupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      await updateProfile({ name: name.trim(), bio, mood: selectedMood }, token);
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself</Text>

      {/* Avatar Placeholder */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : '?'}</Text>
        </View>
        <TouchableOpacity style={styles.changePhoto}>
          <Text style={styles.changePhotoText}>📷 Add Photo</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#aaa"
        maxLength={50}
      />

      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={setBio}
        placeholder="About me (optional)"
        placeholderTextColor="#aaa"
        multiline
        maxLength={200}
      />

      <Text style={styles.moodLabel}>Current Mood</Text>
      <View style={styles.moodGrid}>
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[styles.moodChip, selectedMood === mood && styles.moodChipSelected]}
            onPress={() => setSelectedMood(mood)}
          >
            <Text style={[styles.moodText, selectedMood === mood && styles.moodTextSelected]}>
              {mood}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Let's Go! 🚀</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 25, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 30 },
  avatarContainer: { alignItems: 'center', marginBottom: 25 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 42, fontWeight: 'bold', color: '#fff' },
  changePhoto: { marginTop: 10 },
  changePhotoText: { color: '#6C63FF', fontSize: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15,
    fontSize: 16, color: '#333', marginBottom: 15,
    borderWidth: 1, borderColor: '#eee',
  },
  bioInput: { height: 80, textAlignVertical: 'top' },
  moodLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  moodChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
  },
  moodChipSelected: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  moodText: { fontSize: 14, color: '#666' },
  moodTextSelected: { color: '#fff' },
  button: {
    backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
