import Colors from '@/constants/colors';
import { NOTIFICATION_TYPES, STATUS_COLORS, STATUS_LABELS } from '@/constants/notifications';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from '@/contexts/notifications';
import { getNotificationLocalImage } from '@/services/localImages';
import { NotificationStatus } from '@/types';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Clock, Heart, HeartPulse, Leaf, MapPin, Search, ShieldAlert, User as UserIcon, Wrench } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const ICON_MAP = {
  health: HeartPulse,
  security: ShieldAlert,
  environmental: Leaf,
  lost_found: Search,
  technical: Wrench,
};

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getNotificationById, toggleFollow, updateNotificationStatus } = useNotifications();

  const notification = getNotificationById(id as string);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (notification?.id) {
      getNotificationLocalImage(notification.id)
        .then(uri => {
          setLocalImageUri(uri);
        })
        .catch(error => {
          console.error('Error loading local image:', error);
          setLocalImageUri(null);
        });
    }
  }, [notification?.id]);

  if (!notification) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Notification not found</Text>
      </View>
    );
  }

  const typeConfig = NOTIFICATION_TYPES.find(t => t.value === notification.type);
  const IconComponent = ICON_MAP[notification.type];
  const isFollowed = user && notification.followedBy.includes(user.id);
  const isAdmin = user?.role === 'admin';
  const minimapRegion = {
    latitude: notification.location.latitude,
    longitude: notification.location.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const handleToggleFollow = () => {
    toggleFollow(notification.id);
  };

  const handleStatusChange = (status: NotificationStatus) => {
    Alert.alert(
      'Update Status',
      `Change status to ${STATUS_LABELS[status]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            updateNotificationStatus(notification.id, status);
            Alert.alert('Success', 'Status updated successfully');
          },
        },
      ]
    );
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notification Details' }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.typeHeader, { backgroundColor: `${typeConfig?.color}20` }]}>
          <View style={[styles.typeIcon, { backgroundColor: typeConfig?.color }]}>
            <IconComponent size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.typeLabel}>{typeConfig?.label}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[notification.status]}20` }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[notification.status] }]}>
                {STATUS_LABELS[notification.status]}
              </Text>
            </View>
            <Text style={styles.timeText}>{getTimeAgo(notification.createdAt)}</Text>
          </View>

          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.description}>{notification.description}</Text>

          {/* Show local image if available, otherwise show Firestore photoUrl (for backward compatibility) */}
          {(localImageUri || notification.photoUrl) && (
            <Image
              source={{ uri: localImageUri || notification.photoUrl || '' }}
              style={styles.evidenceImage}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <MapPin size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              {notification.location.address || `${notification.location.latitude.toFixed(6)}, ${notification.location.longitude.toFixed(6)}`}
            </Text>
          </View>
          <View style={styles.minimapContainer}>
            <MapView
              style={styles.minimap}
              initialRegion={minimapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              pointerEvents="none"
            >
              <Marker
                coordinate={{
                  latitude: notification.location.latitude,
                  longitude: notification.location.longitude,
                }}
              />
            </MapView>
          </View>

          <View style={styles.infoRow}>
            <UserIcon size={20} color="#6B7280" />
            <Text style={styles.infoText}>Reported by {notification.createdByName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Created: {new Date(notification.createdAt).toLocaleString()}
            </Text>
          </View>

          {notification.updatedAt !== notification.createdAt && (
            <View style={styles.infoRow}>
              <Clock size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                Updated: {new Date(notification.updatedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>
            <View style={styles.adminActions}>
              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: `${STATUS_COLORS.open}20` }]}
                onPress={() => handleStatusChange('open')}
              >
                <Text style={[styles.adminButtonText, { color: STATUS_COLORS.open }]}>
                  Mark as Open
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: `${STATUS_COLORS.in_review}20` }]}
                onPress={() => handleStatusChange('in_review')}
              >
                <Text style={[styles.adminButtonText, { color: STATUS_COLORS.in_review }]}>
                  In Review
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: `${STATUS_COLORS.resolved}20` }]}
                onPress={() => handleStatusChange('resolved')}
              >
                <Text style={[styles.adminButtonText, { color: STATUS_COLORS.resolved }]}>
                  Resolve
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.followButton, isFollowed && styles.followButtonActive]}
          onPress={handleToggleFollow}
        >
          <Heart
            size={20}
            color={isFollowed ? '#FFFFFF' : Colors.light.tint}
            fill={isFollowed ? '#FFFFFF' : 'none'}
          />
          <Text style={[styles.followButtonText, isFollowed && styles.followButtonTextActive]}>
            {isFollowed ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
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
  typeHeader: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  typeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  minimapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  minimap: {
    width: '100%',
    height: 140,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  adminActions: {
    gap: 12,
  },
  adminButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  followButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  followButtonTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
});
