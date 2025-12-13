import { NotificationType } from '@/types';

export const NOTIFICATION_TYPES: { value: NotificationType; label: string; icon: string; color: string }[] = [
  { value: 'health', label: 'Health', icon: 'heart-pulse', color: '#EF4444' },
  { value: 'security', label: 'Security', icon: 'shield-alert', color: '#F59E0B' },
  { value: 'environmental', label: 'Environmental', icon: 'leaf', color: '#10B981' },
  { value: 'lost_found', label: 'Lost & Found', icon: 'search', color: '#3B82F6' },
  { value: 'technical', label: 'Technical', icon: 'wrench', color: '#8B5CF6' },
];

export const STATUS_COLORS = {
  open: '#EF4444',
  in_review: '#F59E0B',
  resolved: '#10B981',
};

export const STATUS_LABELS = {
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
};
