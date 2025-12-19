import Colors from '@/constants/colors';
import { NOTIFICATION_TYPES, STATUS_COLORS, STATUS_LABELS } from '@/constants/notifications';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from '@/contexts/notifications';
import { Notification, NotificationStatus, NotificationType } from '@/types';
import { Href, Stack, useRouter } from 'expo-router';
import { Filter, HeartPulse, Leaf, Search, SearchIcon, Settings, ShieldAlert, Wrench } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
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
  lost_found: SearchIcon,
  technical: Wrench,
};

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, emergencyAlerts, getFollowedNotifications } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus | 'all'>('all');
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredNotifications = useMemo(() => {
    let filtered = showFollowedOnly ? getFollowedNotifications() : notifications;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(n => n.status === selectedStatus);
    }

    return filtered;
  }, [notifications, searchQuery, selectedType, selectedStatus, showFollowedOnly, getFollowedNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
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

  const renderEmergencyAlert = (alert: any) => (
    <View key={alert.id} style={styles.emergencyCard}>
      <View style={styles.emergencyHeader}>
        <ShieldAlert size={24} color="#DC2626" />
        <Text style={styles.emergencyTitle}>EMERGENCY ALERT</Text>
      </View>
      <Text style={styles.emergencySubject}>{alert.title}</Text>
      <Text style={styles.emergencyMessage}>{alert.message}</Text>
      <Text style={styles.emergencyTime}>{getTimeAgo(alert.createdAt)}</Text>
    </View>
  );

  const renderNotificationCard = ({ item }: { item: Notification }) => {
    const typeConfig = NOTIFICATION_TYPES.find(t => t.value === item.type);
    const IconComponent = ICON_MAP[item.type];
    const isFollowed = user && item.followedBy.includes(user.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/notification/${item.id}` as Href)}
        testID={`notification-${item.id}`}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${typeConfig?.color}20` }]}>
            <IconComponent size={20} color={typeConfig?.color} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardType}>{typeConfig?.label}</Text>
            <Text style={styles.cardTime}>{getTimeAgo(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status]}20` }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardLocation}>{item.location.address || 'Campus Area'}</Text>
          {isFollowed && (
            <View style={styles.followingBadge}>
              <Text style={styles.followingText}>Following</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Emergency Alerts Section */}
      {emergencyAlerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {emergencyAlerts.map(alert => renderEmergencyAlert(alert))}
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
          testID="filter-button"
        >
          <Filter size={20} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType('all')}
            >
              <Text style={[styles.filterChipText, selectedType === 'all' && styles.filterChipTextActive]}>
                All Types
              </Text>
            </TouchableOpacity>
            {NOTIFICATION_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.filterChip,
                  selectedType === type.value && styles.filterChipActive,
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <Text style={[styles.filterChipText, selectedType === type.value && styles.filterChipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus('all')}
            >
              <Text style={[styles.filterChipText, selectedStatus === 'all' && styles.filterChipTextActive]}>
                All Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === 'open' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus('open')}
            >
              <Text style={[styles.filterChipText, selectedStatus === 'open' && styles.filterChipTextActive]}>
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                showFollowedOnly && styles.filterChipActive,
              ]}
              onPress={() => setShowFollowedOnly(!showFollowedOnly)}
            >
              <Text style={[styles.filterChipText, showFollowedOnly && styles.filterChipTextActive]}>
                Following
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Campus Safety',
          headerRight: () =>
            user?.role === 'admin' ? (
              <TouchableOpacity
                onPress={() => router.push('/admin' as Href)}
                style={styles.headerButton}
                testID="admin-button"
              >
                <Settings size={24} color={Colors.light.tint} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search or filters' : 'New reports will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerButton: {
    marginRight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  cardTime: {
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
    fontSize: 12,
    fontWeight: '600' as const,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cardLocation: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  followingBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  followingText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertsContainer: {
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F87171',
    borderLeftWidth: 6,
    borderLeftColor: '#DC2626',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  emergencySubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7F1D1D',
    marginBottom: 4,
  },
  emergencyMessage: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  emergencyTime: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'right',
  },
});
