import Colors from '@/constants/colors';
import { NOTIFICATION_TYPES } from '@/constants/notifications';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from '@/contexts/notifications';
import { updateUserProfileFields } from '@/services/database';
import { Href, useRouter } from 'expo-router';
import { Bell, Building, Edit, LogOut, Mail, Shield, User as UserIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, preferences, updatePreferences, updateProfile } = useAuth();
  const { getFollowedNotifications } = useNotifications();

  const followedNotifications = getFollowedNotifications();
  const followedCount = followedNotifications.length;
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const nameParts = user?.fullName.trim().split(' ').filter(Boolean) ?? [];
  const firstName = user?.firstName?.trim() || nameParts[0] || '';
  const lastName = user?.lastName?.trim() || nameParts.slice(1).join(' ');

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

  const handleOpenEditModal = () => {
    if (!user) return;
    // Pre-fill with current values, handling backward compatibility
    const currentFirstName = user.firstName?.trim() || firstName || '';
    const currentLastName = user.lastName?.trim() || lastName || '';
    setEditFirstName(currentFirstName);
    setEditLastName(currentLastName);
    setEditDepartment(user.department?.trim() || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validation
    const firstNameTrimmed = editFirstName.trim();
    const lastNameTrimmed = editLastName.trim();
    const departmentTrimmed = editDepartment.trim();

    if (!firstNameTrimmed || firstNameTrimmed.length < 2) {
      Alert.alert('Validation Error', 'First name must be at least 2 characters');
      return;
    }
    if (!lastNameTrimmed || lastNameTrimmed.length < 2) {
      Alert.alert('Validation Error', 'Last name must be at least 2 characters');
      return;
    }
    if (!departmentTrimmed) {
      Alert.alert('Validation Error', 'Department is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfileFields(user.id, {
        firstName: firstNameTrimmed,
        lastName: lastNameTrimmed,
        department: departmentTrimmed,
      });

      // Update local auth context
      const fullName = [firstNameTrimmed, lastNameTrimmed].filter(Boolean).join(' ');
      updateProfile({
        firstName: firstNameTrimmed,
        lastName: lastNameTrimmed,
        fullName,
        department: departmentTrimmed,
      });

      setShowEditModal(false);
      Alert.alert('Success', 'Your profile has been updated successfully.');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage =
        error?.message || 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <UserIcon size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          {user.role === 'admin' && (
            <View style={styles.roleBadge}>
              <Shield size={14} color="#7C3AED" />
              <Text style={[styles.roleText, { color: '#7C3AED' }]}>
                Administrator
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <TouchableOpacity
              onPress={handleOpenEditModal}
              style={styles.editButton}
              testID="edit-profile-button"
            >
              <Edit size={18} color={Colors.light.tint} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <UserIcon size={20} color={Colors.light.tint} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{firstName || '—'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <UserIcon size={20} color={Colors.light.tint} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Surname</Text>
                <Text style={styles.infoValue}>{lastName || '—'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

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
                <Shield size={20} color={Colors.light.tint} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </Text>
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

            <View style={styles.divider} />

            {NOTIFICATION_TYPES.map(type => (
              <View key={type.value} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{type.label}</Text>
                  <Text style={styles.settingDescription}>
                    Receive {type.label.toLowerCase()} notifications
                  </Text>
                </View>
                <Switch
                  value={preferences.typePreferences?.[type.value] ?? true}
                  onValueChange={(value) =>
                    updatePreferences({
                      ...preferences,
                      typePreferences: {
                        ...(preferences.typePreferences ?? {}),
                        [type.value]: value,
                      },
                    })
                  }
                  trackColor={{ false: '#E5E7EB', true: Colors.light.tint }}
                  thumbColor="#FFFFFF"
                  testID={`type-toggle-${type.value}`}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Followed Notifications</Text>
          <View style={styles.followedCard}>
            {followedNotifications.length === 0 ? (
              <Text style={styles.followedEmptyText}>No followed notifications yet.</Text>
            ) : (
              followedNotifications.map(notification => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.followedRow}
                  onPress={() => router.push(`/notification/${notification.id}` as Href)}
                  testID={`followed-${notification.id}`}
                >
                  <View style={styles.followedInfo}>
                    <Text style={styles.followedTitle} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    <Text style={styles.followedMeta}>
                      Status: {notification.status.replace('_', ' ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Account Information</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
                disabled={isSaving}
              >
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalForm}>
                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalLabel}>First Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter your first name"
                    placeholderTextColor="#9CA3AF"
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    autoCapitalize="words"
                    editable={!isSaving}
                    testID="edit-firstname-input"
                  />
                </View>

                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter your last name"
                    placeholderTextColor="#9CA3AF"
                    value={editLastName}
                    onChangeText={setEditLastName}
                    autoCapitalize="words"
                    editable={!isSaving}
                    testID="edit-lastname-input"
                  />
                </View>

                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalLabel}>Department *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Computer Engineering"
                    placeholderTextColor="#9CA3AF"
                    value={editDepartment}
                    onChangeText={setEditDepartment}
                    editable={!isSaving}
                    testID="edit-department-input"
                  />
                </View>

                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalLabel}>Email</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputDisabled]}
                    value={user?.email || ''}
                    editable={false}
                    testID="edit-email-input"
                  />
                  <Text style={styles.modalHint}>Email cannot be changed</Text>
                </View>

                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalLabel}>Role</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputDisabled]}
                    value={user?.role === 'admin' ? 'Administrator' : 'User'}
                    editable={false}
                    testID="edit-role-input"
                  />
                  <Text style={styles.modalHint}>Role cannot be changed</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEditModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, isSaving && styles.modalButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={isSaving}
                testID="save-profile-button"
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalButtonSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
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
  followedCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  followedRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  followedInfo: {
    gap: 4,
  },
  followedTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  followedMeta: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  followedEmptyText: {
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalForm: {
    padding: 20,
    gap: 20,
  },
  modalInputContainer: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  modalInput: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  modalInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  modalHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  modalButtonSave: {
    backgroundColor: Colors.light.tint,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
