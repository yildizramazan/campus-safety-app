import Colors from '@/constants/colors';
import { NOTIFICATION_TYPES, STATUS_COLORS, STATUS_LABELS } from '@/constants/notifications';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from '@/contexts/notifications';
import { Notification, NotificationStatus } from '@/types';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  HeartPulse,
  Leaf,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Trash2,
  Wrench,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ICON_MAP = {
  health: HeartPulse,
  security: ShieldAlert,
  environmental: Leaf,
  lost_found: Search,
  technical: Wrench,
};

export default function AdminPanelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, updateNotificationStatus, deleteNotification, createEmergencyAlert, updateNotification } = useNotifications();

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyTitle, setEmergencyTitle] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Shield size={48} color="#D1D5DB" />
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>
            You need administrator privileges to access this panel
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleStatusChange = (notification: Notification, newStatus: NotificationStatus) => {
    Alert.alert(
      'Update Status',
      `Change status to ${STATUS_LABELS[newStatus]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            updateNotificationStatus(notification.id, newStatus);
            Alert.alert('Success', 'Status updated');
          },
        },
      ]
    );
  };

  const handleDelete = (notification: Notification) => {
    Alert.alert(
      'Delete Notification',
      `Are you sure you want to delete "${notification.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNotification(notification.id);
            Alert.alert('Success', 'Notification deleted');
          },
        },
      ]
    );
  };

  const handleSendEmergencyAlert = () => {
    if (!emergencyTitle.trim() || !emergencyMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      createEmergencyAlert(emergencyTitle.trim(), emergencyMessage.trim());
      setShowEmergencyModal(false);
      setEmergencyTitle('');
      setEmergencyMessage('');
      Alert.alert('Success', 'Emergency alert sent to all users');
    } catch {
      Alert.alert('Error', 'Failed to send emergency alert');
    }
  };

  const startEditing = (notification: Notification) => {
    setEditingNotification(notification);
    setEditTitle(notification.title);
    setEditDescription(notification.description);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingNotification) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert('Error', 'Title and description cannot be empty');
      return;
    }

    try {
      await updateNotification(editingNotification.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setShowEditModal(false);
      setEditingNotification(null);
      Alert.alert('Success', 'Notification updated');
    } catch {
      Alert.alert('Error', 'Failed to update notification');
    }
  };

  const stats = {
    total: notifications.length,
    open: notifications.filter(n => n.status === 'open').length,
    inReview: notifications.filter(n => n.status === 'in_review').length,
    resolved: notifications.filter(n => n.status === 'resolved').length,
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Shield size={32} color={Colors.light.tint} />
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage campus incidents</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: STATUS_COLORS.open }]}>
            <Text style={[styles.statNumber, { color: STATUS_COLORS.open }]}>{stats.open}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={[styles.statCard, { borderColor: STATUS_COLORS.in_review }]}>
            <Text style={[styles.statNumber, { color: STATUS_COLORS.in_review }]}>{stats.inReview}</Text>
            <Text style={styles.statLabel}>In Review</Text>
          </View>
          <View style={[styles.statCard, { borderColor: STATUS_COLORS.resolved }]}>
            <Text style={[styles.statNumber, { color: STATUS_COLORS.resolved }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => setShowEmergencyModal(true)}
          testID="emergency-alert-button"
        >
          <AlertTriangle size={20} color="#FFFFFF" />
          <Text style={styles.emergencyButtonText}>Send Emergency Alert</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Notifications</Text>
          {notifications.map(notification => {
            const typeConfig = NOTIFICATION_TYPES.find(t => t.value === notification.type);
            const IconComponent = ICON_MAP[notification.type];

            return (
              <View key={notification.id} style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <View style={[styles.notificationIcon, { backgroundColor: `${typeConfig?.color}20` }]}>
                    <IconComponent size={20} color={typeConfig?.color} />
                  </View>
                  <View style={styles.notificationHeaderText}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMeta}>
                      By {notification.createdByName} - {typeConfig?.label}
                      {'\n'}{notification.location?.address || 'No Location Provided'}
                      {notification.createdByDepartment ? `\nDept: ${notification.createdByDepartment}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[notification.status]}20` }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[notification.status] }]}>
                      {STATUS_LABELS[notification.status]}
                    </Text>
                  </View>
                </View>

                <Text style={styles.notificationDescription} numberOfLines={2}>
                  {notification.description}
                </Text>

                <View style={styles.notificationActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: `${STATUS_COLORS.open}15` }]}
                    onPress={() => handleStatusChange(notification, 'open')}
                  >
                    <Text style={[styles.actionButtonText, { color: STATUS_COLORS.open }]}>
                      Open
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: `${STATUS_COLORS.in_review}15` }]}
                    onPress={() => handleStatusChange(notification, 'in_review')}
                  >
                    <Text style={[styles.actionButtonText, { color: STATUS_COLORS.in_review }]}>
                      Review
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: `${STATUS_COLORS.resolved}15` }]}
                    onPress={() => handleStatusChange(notification, 'resolved')}
                  >
                    <Text style={[styles.actionButtonText, { color: STATUS_COLORS.resolved }]}>
                      Resolve
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => startEditing(notification)}
                  >
                    <Wrench size={16} color={Colors.light.tint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(notification)}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={showEmergencyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEmergencyModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={24} color="#DC2626" />
              <Text style={styles.modalTitle}>Emergency Alert</Text>
              <TouchableOpacity
                onPress={() => setShowEmergencyModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              This will send a notification to all users immediately.
            </Text>

            <View style={styles.modalForm}>
              <TextInput
                style={styles.modalInput}
                placeholder="Alert Title"
                placeholderTextColor="#9CA3AF"
                value={emergencyTitle}
                onChangeText={setEmergencyTitle}
                testID="emergency-title-input"
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Alert Message"
                placeholderTextColor="#9CA3AF"
                value={emergencyMessage}
                onChangeText={setEmergencyMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                testID="emergency-message-input"
              />
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendEmergencyAlert}
              testID="send-alert-button"
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Alert</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Wrench size={24} color={Colors.light.tint} />
              <Text style={styles.modalTitle}>Edit Notification</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <TextInput
                style={styles.modalInput}
                placeholder="Title"
                placeholderTextColor="#9CA3AF"
                value={editTitle}
                onChangeText={setEditTitle}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Description"
                placeholderTextColor="#9CA3AF"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: Colors.light.tint }]}
              onPress={handleSaveEdit}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Save Changes</Text>
            </TouchableOpacity>
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
    padding: 24,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#DC2626',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  notificationCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationHeaderText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  deleteButton: {
    flex: 0,
    backgroundColor: '#FEE2E2',
    minWidth: 44,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  modalForm: {
    gap: 12,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  modalTextArea: {
    minHeight: 100,
    maxHeight: 150,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
