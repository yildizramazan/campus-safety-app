import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter, Href } from 'expo-router';
import * as Location from 'expo-location';
import { HeartPulse, ShieldAlert, Leaf, Search, Wrench, MapPin } from 'lucide-react-native';
import { useNotifications } from '@/contexts/notifications';
import { NotificationType } from '@/types';
import { NOTIFICATION_TYPES } from '@/constants/notifications';
import Colors from '@/constants/colors';

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
  const { notifications } = useNotifications();
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        await Location.requestForegroundPermissionsAsync();
      })();
    }
  }, []);

  const filteredNotifications = useMemo(() => {
    if (selectedType === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.type === selectedType);
  }, [notifications, selectedType]);

  const handleMarkerPress = (notificationId: string) => {
    router.push(`/notification/${notificationId}` as Href);
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
        testID="map-view"
      >
        {filteredNotifications.map((notification) => {
          const typeConfig = NOTIFICATION_TYPES.find(t => t.value === notification.type);
          return (
            <Marker
              key={notification.id}
              coordinate={{
                latitude: notification.location.latitude,
                longitude: notification.location.longitude,
              }}
              pinColor={typeConfig?.color}
              onPress={() => handleMarkerPress(notification.id)}
              testID={`marker-${notification.id}`}
            >
              <View style={[styles.marker, { backgroundColor: typeConfig?.color }]}>
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
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredNotifications.length}</Text>
          <Text style={styles.statLabel}>
            {selectedType === 'all' ? 'Total Incidents' : NOTIFICATION_TYPES.find(t => t.value === selectedType)?.label}
          </Text>
        </View>
      </View>
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
  markerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
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
    bottom: 16,
    left: 16,
    right: 16,
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
});
