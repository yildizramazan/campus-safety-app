import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from '@/contexts/notifications';
import { EmergencyAlert } from '@/types';
import { Stack } from 'expo-router';
import { AlertTriangle, Clock, Trash2, User as UserIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AlertsScreen() {
  const { emergencyAlerts, getFollowedNotifications, deleteEmergencyAlert } = useNotifications();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const followedNotifications = getFollowedNotifications();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Alert',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmergencyAlert(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete alert');
            }
          }
        }
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

  const renderEmergencyAlert = ({ item }: { item: EmergencyAlert }) => (
    <View style={styles.emergencyCard} testID={`emergency-${item.id}`}>
      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyIcon}>
          <AlertTriangle size={24} color="#FFFFFF" />
        </View>
        <View style={styles.emergencyHeaderText}>
          <Text style={styles.emergencyBadge}>EMERGENCY ALERT</Text>
          <Text style={styles.emergencyTime}>{getTimeAgo(item.createdAt)}</Text>
        </View>
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Trash2 size={20} color="#991B1B" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.emergencyTitle}>{item.title}</Text>
      <Text style={styles.emergencyMessage}>{item.message}</Text>
      <View style={styles.emergencyFooter}>
        <Clock size={14} color="#7F1D1D" />
        <Text style={styles.emergencyFooterText}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderFollowedNotification = ({ item }: { item: any }) => (
    <View style={styles.notificationCard} testID={`followed-${item.id}`}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <UserIcon size={16} color={Colors.light.tint} />
        </View>
        <Text style={styles.notificationTitle} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      <Text style={styles.notificationStatus}>
        Status: <Text style={styles.notificationStatusValue}>{item.status}</Text>
      </Text>
      <Text style={styles.notificationTime}>{getTimeAgo(item.updatedAt)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notifications & Alerts' }} />

      <FlatList
        data={[...emergencyAlerts, ...followedNotifications]}
        renderItem={({ item, index }) => {
          if (index < emergencyAlerts.length) {
            return renderEmergencyAlert({ item: item as EmergencyAlert });
          }
          return renderFollowedNotification({ item });
        }}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        ListHeaderComponent={
          <>
            {emergencyAlerts.length > 0 && (
              <View style={styles.sectionHeader}>
                <AlertTriangle size={20} color={Colors.light.error} />
                <Text style={styles.sectionTitle}>Emergency Alerts</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertTriangle size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No alerts or notifications</Text>
            <Text style={styles.emptySubtext}>
              Follow incidents to receive updates here
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => {
          const hasEmergencyAlerts = emergencyAlerts.length > 0;
          return hasEmergencyAlerts ? <View style={styles.separator} /> : null;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FCA5A5',
    gap: 12,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyHeaderText: {
    flex: 1,
  },
  emergencyBadge: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  emergencyTime: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#991B1B',
  },
  emergencyMessage: {
    fontSize: 16,
    color: '#7F1D1D',
    lineHeight: 24,
  },
  emergencyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FCA5A5',
  },
  emergencyFooterText: {
    fontSize: 12,
    color: '#7F1D1D',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
  },
  notificationCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  notificationStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationStatusValue: {
    fontWeight: '600' as const,
    color: Colors.light.tint,
    textTransform: 'capitalize',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    marginLeft: 8,
  },
});
