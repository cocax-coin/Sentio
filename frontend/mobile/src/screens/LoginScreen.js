/**
 * Login Screen - Phone number input with OTP flow
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { requestOTP } from '../utils/api';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await requestOTP(cleaned);
      navigation.navigate('OTP', { phoneNumber: cleaned });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Sentio</Text>
          <Text style={styles.tagline}>AI-Powered Conversations</Text>
        </View>

        {/* Phone Input */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Enter your phone number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+1 234 567 8900"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            autoFocus
          />
          <Text style={styles.hint}>We'll send you a 6-digit verification code</Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP →</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6C63FF' },
  inner: { flex: 1, padding: 30, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logo: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  input: {
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  hint: { fontSize: 12, color: '#999', marginBottom: 20 },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  terms: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 30 },
});
