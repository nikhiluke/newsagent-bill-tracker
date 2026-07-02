import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Newspaper } from 'lucide-react-native';
import { useAppState } from '../hooks/useAppState';
import { theme } from '../theme';

export default function AgencyRegistrationScreen() {
  const { updateProfile, navigateTo } = useAppState();
  const [agencyName, setAgencyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!agencyName || !ownerName || !mobileNumber || pin.length !== 4) {
      setError('All fields are required and PIN must be 4 digits');
      return;
    }
    try {
      await updateProfile({
        businessName: agencyName,
        ownerName: ownerName,
        phone: mobileNumber,
        passPin: parseInt(pin),
        address: '', // address can be added later
      });
      // After registration, navigate to dashboard
      navigateTo('dashboard');
    } catch (e) {
      console.error(e);
      setError('Failed to create agency');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={64}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.iconBox}>
              <Newspaper size={34} color="#ffffff" />
            </View>
            <Text style={styles.title}>Create Agency</Text>
            <Text style={styles.subtitle}>Setup your newspaper distribution agency</Text>
          </View>
          {error ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Agency Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter agency name"
                placeholderTextColor={theme.colors.textMuted}
                value={agencyName}
                onChangeText={t => { setAgencyName(t); setError(''); }}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Owner Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter owner name"
                placeholderTextColor={theme.colors.textMuted}
                value={ownerName}
                onChangeText={t => { setOwnerName(t); setError(''); }}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter 10‑digit number"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={t => { setMobileNumber(t.replace(/\D/g, '')); setError(''); }}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>4‑Digit PIN</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter PIN"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                value={pin}
                onChangeText={t => { setPin(t.replace(/\D/g, '')); setError(''); }}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} activeOpacity={0.8}>
            <Text style={styles.submitBtnText}>Create Agency</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    fontWeight: '500',
  },
  errorAlert: {
    backgroundColor: theme.colors.dangerLight,
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 11,
    color: theme.colors.dangerDark,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
    height: '100%',
    padding: 0,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
