import Colors from '@/constants/colors';
import { NOTIFICATION_TYPES, STATUS_COLORS, STATUS_LABELS } from '@/constants/notifications';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from '@/contexts/notifications';
import { Notification, NotificationType } from '@/types';
import * as Location from 'expo-location';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, HeartPulse, Leaf, MapPin, RefreshCw, Search, ShieldAlert, Wrench, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const ICON_MAP = {
  health: HeartPulse,
  security: ShieldAlert,
  environmental: Leaf,
  lost_found: Search,
  technical: Wrench,
};

const ATAUNI_LOCATION = {
  latitude: 39.9042,
  longitude: 41.2678,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function MapScreen() {
  const router = useRouter();
  const { preferences } = useAuth();
  const { notifications, refreshNotifications, loading } = useNotifications();
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        await Location.requestForegroundPermissionsAsync();
      })();
    }
  }, []);

  const filteredNotifications = useMemo(() => {
    const enabledTypes = preferences.typePreferences ?? {};
    const visible = notifications.filter(n => enabledTypes[n.type] !== false);
    if (selectedType === 'all') {
      return visible;
    }
    return visible.filter(n => n.type === selectedType);
  }, [notifications, preferences.typePreferences, selectedType]);

  const handleMarkerPress = (notification: Notification) => {
    setSelectedNotification(notification);
  };

  const handleMapPress = () => {
    setSelectedNotification(null);
  };

  const navigateToDetails = (id: string) => {
    router.push(`/notification/${id}` as Href);
    setSelectedNotification(null);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={ATAUNI_LOCATION}
        showsUserLocation={Platform.OS !== 'web'}
        showsMyLocationButton={Platform.OS !== 'web'}
        showsCompass
        onPress={handleMapPress}
        testID="map-view"
      >
        {filteredNotifications.map((notification) => {
          const typeConfig = NOTIFICATION_TYPES.find(t => t.value === notification.type);
          const isSelected = selectedNotification?.id === notification.id;

          return (
            <Marker
              key={notification.id}
              coordinate={{
                latitude: notification.location.latitude,
                longitude: notification.location.longitude,
              }}
              pinColor={typeConfig?.color}
              onPress={(e) => {
                e.stopPropagation(); // Prevent map press
                handleMarkerPress(notification);
              }}
              testID={`marker-${notification.id}`}
            >
              <View style={[
                styles.marker,
                { backgroundColor: typeConfig?.color },
                isSelected && styles.markerSelected
              ]}>
                <View style={styles.markerInner}>
                  {(() => {
                    const IconComponent = ICON_MAP[notification.type];
                    return <IconComponent size={16} color="#FFFFFF" />;
                  })()}
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Header Controls */}
      <View style={styles.headerControls}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshNotifications}
          disabled={loading}
        >
          <RefreshCw size={20} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedType === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedType('all')}
        >
          <MapPin size={16} color={selectedType === 'all' ? '#FFFFFF' : Colors.light.tint} />
          <Text style={[styles.filterChipText, selectedType === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {NOTIFICATION_TYPES.map(type => {
          const IconComponent = ICON_MAP[type.value];
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterChip,
                selectedType === type.value && styles.filterChipActive,
                { borderColor: type.color },
              ]}
              onPress={() => setSelectedType(type.value)}
            >
              <IconComponent
                size={16}
                color={selectedType === type.value ? '#FFFFFF' : type.color}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.statsContainer}>
        {!selectedNotification && (
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredNotifications.length}</Text>
            <Text style={styles.statLabel}>
              {selectedType === 'all' ? 'Total Incidents' : NOTIFICATION_TYPES.find(t => t.value === selectedType)?.label}
            </Text>
          </View>
        )}
      </View>

      {/* Pin Information Card */}
      {selectedNotification && (
        <View style={styles.infoCardContainer}>
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => navigateToDetails(selectedNotification.id)}
            activeOpacity={0.9}
          >
            <View style={styles.infoHeaders}>
              <View style={styles.infoTopRow}>
                {(() => {
                  const typeConfig = NOTIFICATION_TYPES.find(t => t.value === selectedNotification.type);
                  const IconComponent = ICON_MAP[selectedNotification.type];
                  return (
                    <View style={[styles.infoIcon, { backgroundColor: `${typeConfig?.color}20` }]}>
                      <IconComponent size={20} color={typeConfig?.color} />
                    </View>
                  );
                })()}
                <View style={styles.infoMeta}>
                  <Text style={styles.infoType}>
                    {NOTIFICATION_TYPES.find(t => t.value === selectedNotification.type)?.label}
                  </Text>
                  <Text style={styles.infoTime}>{getTimeAgo(selectedNotification.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[selectedNotification.status]}20` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[selectedNotification.status] }]}>
                    {STATUS_LABELS[selectedNotification.status]}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedNotification(null)}
              >
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.infoTitle} numberOfLines={1}>
              {selectedNotification.title}
            </Text>
            <Text style={styles.infoDescription} numberOfLines={2}>
              {selectedNotification.description}
            </Text>

            <View style={styles.infoFooter}>
              <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <ArrowRight size={16} color={Colors.light.tint} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
    borderColor: Colors.light.tint,
  },
  markerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 10,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 70,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.tint,
    marginTop: 2,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    position: 'absolute',
    bottom: 30, // Higher up to avoid tab bar
    left: 16,
    right: 16,
    zIndex: 1, // Below info card
  },
  statCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600' as const,
  },

  // Info Card Styles
  infoCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoHeaders: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoMeta: {
    flex: 1,
  },
  infoType: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  infoTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
});

