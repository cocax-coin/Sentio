/**
 * OTP Verification Screen
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyOTP, requestOTP } from '../utils/api';

export default function OTPScreen({ navigation, route }) {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(phoneNumber, code);
      await AsyncStorage.setItem('auth_token', response.access_token);
      await AsyncStorage.setItem('user_id', String(response.user_id));

      if (response.is_new_user) {
        navigation.replace('ProfileSetup');
      } else {
        navigation.replace('Main');
      }
    } catch (error) {
      Alert.alert('Invalid OTP', 'The code you entered is incorrect or expired');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await requestOTP(phoneNumber);
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('OTP Sent', 'A new verification code has been sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify Phone</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}{phoneNumber}
        </Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={[styles.otpInput, digit && styles.otpInputFilled]}
            value={digit}
            onChangeText={(v) => handleOTPChange(v, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify →</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
        <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6C63FF', padding: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 10 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  otpInput: {
    width: 50, height: 60, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#fff',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  otpInputFilled: { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: '#fff' },
  button: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#6C63FF', fontSize: 18, fontWeight: 'bold' },
  resend: { textAlign: 'center', color: '#fff', fontSize: 16 },
  resendDisabled: { opacity: 0.5 },
});
