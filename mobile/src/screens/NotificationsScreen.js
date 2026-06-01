import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Wrench, Calendar, CheckCircle, Info } from 'lucide-react-native';
import { technicianAPI } from '../api';
import { useTechnicianRealtime } from '../hooks/useTechnicianRealtime';
import {
  buildNotificationsFromTasks,
  markAllNotificationsRead,
  markNotificationRead,
} from '../utils/notifications';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (isRefresh = false) => {
    try {
      const response = await technicianAPI.getTasks();
      if (response.data.success) {
        const { repairs = [], bookings = [] } = response.data.data;
        const list = await buildNotificationsFromTasks(repairs, bookings);
        setNotifications(list);
      }
    } catch (err) {
      console.log('Load notifications error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useTechnicianRealtime({
    onRefresh: () => loadNotifications(true),
  });

  useFocusEffect(
    useCallback(() => {
      loadNotifications(false);
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(true);
  }, []);

  const markAllAsRead = async () => {
    await markAllNotificationsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handlePress = async (item) => {
    await markNotificationRead(item.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );

    if (item.refType === 'repair') {
      navigation.navigate('RepairDetail', {
        repairId: item.refId,
        repair: item.refData,
      });
    } else {
      navigation.navigate('MainTabs', { screen: 'BookingsTab' });
    }
  };

  const getIconConfig = (type) => {
    switch (type) {
      case 'assignment': return { Icon: Wrench, bg: '#2563EB', color: '#FFF' };
      case 'booking': return { Icon: Calendar, bg: '#BC4800', color: '#FFF' };
      case 'completed': return { Icon: CheckCircle, bg: '#059669', color: '#FFF' };
      case 'info': return { Icon: Info, bg: '#FEE2E2', color: '#DC2626' };
      default: return { Icon: Info, bg: '#E1E2ED', color: '#434655' };
    }
  };

  const renderNotificationCard = ({ item }) => {
    const { Icon, bg, color } = getIconConfig(item.type);

    return (
      <TouchableOpacity
        style={[styles.card, item.unread && styles.cardUnread]}
        activeOpacity={0.85}
        onPress={() => handlePress(item)}
      >
        {item.unread && <View style={styles.unreadDot} />}

        <View style={styles.cardContentRow}>
          <View style={[styles.iconContainer, { backgroundColor: bg }]}>
            <Icon color={color} size={20} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông Báo</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markReadText}>Đánh dấu tất cả đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
            <Text style={styles.emptyText}>
              Thông báo sẽ hiển thị khi có đơn sửa chữa hoặc lịch hẹn mới được phân công cho bạn.
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FAF8FF',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    color: '#191B23',
  },
  markReadText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#004AC6',
    marginBottom: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C3C6D7',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFF',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    zIndex: 1,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#191B23',
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#434655',
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#737686',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
