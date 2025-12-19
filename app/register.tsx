import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/auth';
import { useRouter } from 'expo-router';
// import { Shield } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName || !department) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const result = await register(email, password, firstName, lastName, department);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Registration Failed', result.error || 'An error occurred');
    } else if (result.message) {
      Alert.alert('Notice', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image source={require('@/assets/images/logo.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Campus Safety Network</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              testID="firstname-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Surname</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your surname"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              testID="lastname-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              testID="email-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Department</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Computer Engineering"
              placeholderTextColor="#9CA3AF"
              value={department}
              onChangeText={setDepartment}
              testID="department-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              testID="password-input"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            testID="register-button"
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
            testID="back-to-login"
          >
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  linkButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
