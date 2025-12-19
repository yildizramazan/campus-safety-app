import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from '@/contexts/notifications';
import { Stack } from 'expo-router';
import { Bell, Building, LogOut, Mail, Shield, User as UserIcon } from 'lucide-react-native';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const { user, logout, preferences, updatePreferences } = useAuth();
  const { getFollowedNotifications } = useNotifications();

  const followedCount = getFollowedNotifications().length;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Not authenticated</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Profile' }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <UserIcon size={48} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <View style={styles.roleBadge}>
            <Shield size={14} color={user.role === 'admin' ? '#7C3AED' : Colors.light.tint} />
            <Text style={[styles.roleText, { color: user.role === 'admin' ? '#7C3AED' : Colors.light.tint }]}>
              {user.role === 'admin' ? 'Administrator' : 'User'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Mail size={20} color={Colors.light.tint} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Building size={20} color={Colors.light.tint} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>{user.department}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Bell size={20} color={Colors.light.tint} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Following</Text>
                <Text style={styles.infoValue}>{followedCount} incidents</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications about followed incidents
                </Text>
              </View>
              <Switch
                value={preferences.pushEnabled}
                onValueChange={(value) =>
                  updatePreferences({ ...preferences, pushEnabled: value })
                }
                trackColor={{ false: '#E5E7EB', true: Colors.light.tint }}
                thumbColor="#FFFFFF"
                testID="push-toggle"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive email updates
                </Text>
              </View>
              <Switch
                value={preferences.emailEnabled}
                onValueChange={(value) =>
                  updatePreferences({ ...preferences, emailEnabled: value })
                }
                trackColor={{ false: '#E5E7EB', true: Colors.light.tint }}
                thumbColor="#FFFFFF"
                testID="email-toggle"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Emergency Alerts</Text>
                <Text style={styles.settingDescription}>
                  Critical campus-wide announcements
                </Text>
              </View>
              <Switch
                value={preferences.emergencyAlerts}
                onValueChange={(value) =>
                  updatePreferences({ ...preferences, emergencyAlerts: value })
                }
                trackColor={{ false: '#E5E7EB', true: Colors.light.tint }}
                thumbColor="#FFFFFF"
                testID="emergency-toggle"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            testID="logout-button"
          >
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.footerText}>
            Atatürk University Campus Safety
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  settingsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    padding: 20,
  },
});
