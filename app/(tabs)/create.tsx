import Colors from '@/constants/colors';
import { NOTIFICATION_TYPES } from '@/constants/notifications';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from '@/contexts/notifications';
import { NotificationType } from '@/types';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Check, HeartPulse, Leaf, MapPin, Search, ShieldAlert, Wrench } from 'lucide-react-native';
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
import MapView, { Marker, Region } from 'react-native-maps';

const ICON_MAP = {
  health: HeartPulse,
  security: ShieldAlert,
  environmental: Leaf,
  lost_found: Search,
  technical: Wrench,
};

const DEFAULT_REGION: Region = {
  latitude: 39.9042,
  longitude: 41.2678,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function CreateNotificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  const [selectedType, setSelectedType] = useState<NotificationType>('health');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [mapSelection, setMapSelection] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);

  const handleGetLocation = async () => {
    try {
      setIsLoadingLocation(true);

      if (Platform.OS === 'web') {
        setLocation({
          latitude: 39.9042,
          longitude: 41.2678,
          address: 'Atatürk University Campus',
        });
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to report an incident');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        const [address] = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address ? `${address.street || ''}, ${address.city || ''}`.trim() : undefined,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const openMapPicker = () => {
    const baseLocation = location ?? DEFAULT_REGION;
    setMapSelection({
      latitude: baseLocation.latitude,
      longitude: baseLocation.longitude,
    });
    setMapRegion({
      latitude: baseLocation.latitude,
      longitude: baseLocation.longitude,
      latitudeDelta: DEFAULT_REGION.latitudeDelta,
      longitudeDelta: DEFAULT_REGION.longitudeDelta,
    });
    setIsMapPickerOpen(true);
  };

  const handleConfirmMapLocation = async () => {
    if (!mapSelection) {
      Alert.alert('Select a Location', 'Tap on the map to choose a location.');
      return;
    }

    let address: string | undefined;
    if (Platform.OS !== 'web') {
      try {
        const [result] = await Location.reverseGeocodeAsync({
          latitude: mapSelection.latitude,
          longitude: mapSelection.longitude,
        });
        if (result) {
          address = `${result.street || ''}, ${result.city || ''}`.trim();
        }
      } catch (error) {
        console.warn('Reverse geocode failed:', error);
      }
    }

    setLocation({
      latitude: mapSelection.latitude,
      longitude: mapSelection.longitude,
      ...(address ? { address } : {}),
    });
    setIsMapPickerOpen(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    if (!location) {
      Alert.alert('Validation Error', 'Please select a location');
      return;
    }

    try {
      setIsSubmitting(true);
      if (!user) {
        throw new Error('User not authenticated');
      }

      const addressClean = location.address?.trim();
      const locationPayload = addressClean
        ? { ...location, address: addressClean }
        : { latitude: location.latitude, longitude: location.longitude };

      await createNotification({
        type: selectedType,
        title: title.trim(),
        description: description.trim(),
        location: locationPayload,
      });

      Alert.alert(
        'Success',
        'Your report has been submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setDescription('');
              setLocation(null);
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Type</Text>
          <View style={styles.typeGrid}>
            {NOTIFICATION_TYPES.map(type => {
              const IconComponent = ICON_MAP[type.value];
              const isSelected = selectedType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    isSelected && styles.typeCardActive,
                    { borderColor: type.color },
                  ]}
                  onPress={() => setSelectedType(type.value)}
                  testID={`type-${type.value}`}
                >
                  <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
                    <IconComponent size={24} color={type.color} />
                  </View>
                  <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]}>
                    {type.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: type.color }]}>
                      <Check size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of the incident"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            testID="title-input"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide detailed information about the incident"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
            testID="description-input"
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleGetLocation}
            disabled={isLoadingLocation}
            testID="location-button"
          >
            <MapPin size={20} color={Colors.light.tint} />
            <Text style={styles.locationButtonText}>
              {isLoadingLocation
                ? 'Getting location...'
                : location
                  ? location.address || 'Location captured'
                  : 'Get Current Location'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapPickerButton}
            onPress={openMapPicker}
            testID="map-picker-button"
          >
            <Text style={styles.mapPickerText}>Pick on Map</Text>
          </TouchableOpacity>
          {location && (
            <Text style={styles.coordinates}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          testID="submit-button"
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isMapPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsMapPickerOpen(false)}
      >
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalContent}>
            <MapView
              style={styles.mapView}
              initialRegion={mapRegion}
              onPress={(event) => setMapSelection(event.nativeEvent.coordinate)}
              onRegionChangeComplete={setMapRegion}
            >
              {mapSelection && <Marker coordinate={mapSelection} />}
            </MapView>
            <View style={styles.mapActions}>
              <TouchableOpacity
                style={styles.mapActionButton}
                onPress={() => setIsMapPickerOpen(false)}
              >
                <Text style={styles.mapActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapActionButton, styles.mapActionPrimary]}
                onPress={handleConfirmMapLocation}
              >
                <Text style={[styles.mapActionText, styles.mapActionTextPrimary]}>
                  Use Location
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    position: 'relative',
  },
  typeCardActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: Colors.light.tint,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  textArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
  },
  locationButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  coordinates: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  mapPickerButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  mapPickerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mapModalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '70%',
  },
  mapView: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
  },
  mapActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  mapActionPrimary: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  mapActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  mapActionTextPrimary: {
    color: '#FFFFFF',
  },
});
