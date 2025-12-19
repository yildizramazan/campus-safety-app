import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
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

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        // Simulate API call delay
        setTimeout(() => {
            setIsSubmitting(false);
            Alert.alert(
                'Check Your Email',
                'If an account exists for this email, we have sent password reset instructions.',
                [
                    {
                        text: 'Return to Login',
                        onPress: () => router.back(),
                    },
                ]
            );
        }, 1500);
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    testID="back-button"
                >
                    <ArrowLeft size={24} color={Colors.light.text} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Image source={require('@/assets/images/logo.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
                    </View>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.description}>
                        Enter your email address and we'll send you instructions to reset your password.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isSubmitting && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={isSubmitting}
                        testID="reset-button"
                    >
                        <Text style={styles.buttonText}>
                            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                        </Text>
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
    },
    backButton: {
        marginBottom: 24,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.card,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
    },
    inputIcon: {
        marginLeft: 16,
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: Colors.light.text,
    },
    button: {
        backgroundColor: Colors.light.tint,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
