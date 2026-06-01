import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Dimensions, SafeAreaView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Wrench, Calendar, CheckCircle, User, CalendarDays, LogOut, ChevronRight, Bell, Search } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { technicianAPI } from '../api';
import { clearAuthSession } from '../api/authSession';
import { initSocket } from '../api/socket';
import ToastNotification from '../components/ToastNotification';
import {
  getRepairStatusInfo,
  isTerminalRepairStatus,
  isActiveBookingStatus,
} from '../constants/statusMaps';
import {
  buildNotificationsFromTasks,
  countUnreadNotifications,
} from '../utils/notifications';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [data, setData] = useState({ repairs: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState({ visible: false, type: 'info', title: '', message: '' });

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const showToast = (type, title, message) => {
    setToast({ visible: true, type, title, message });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const fetchData = async (isRefresh = false) => {
    try {
      const response = await technicianAPI.getTasks();
      if (response.data.success) {
        const newData = response.data.data;
        // Show toast when refreshing and there's data
        if (isRefresh && newData.repairs?.length > 0) {
          showToast(
            'assignment',
            'Danh sách đã cập nhật',
            `Có ${newData.repairs.length} đơn hàng đang chờ xử lý.`
          );
        }
        setData(newData);
        const notifs = await buildNotificationsFromTasks(
          newData.repairs || [],
          newData.bookings || []
        );
        setUnreadCount(countUnreadNotifications(notifs));
      }
    } catch (error) {
      console.log('Fetch error', error);
      if (isRefresh) {
        showToast('info', 'Lỗi kết nối', 'Không thể lấy dữ liệu mới. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUser();
    fetchData(false);

    // Socket.io Listener for Real-time Updates
    const socket = initSocket();

    const handleNewOrder = (newOrderData) => {
      fetchData(true);
      showToast(
        'assignment',
        'Đơn hàng mới',
        `Đơn ${newOrderData.receipt_code || 'mới'} vừa được hệ thống tự động tạo.`
      );
    };

    const handleDataSync = () => fetchData(true);

    socket.on('new_repair_order', handleNewOrder);
    socket.on('data_changed', handleDataSync);
    socket.on('new_booking', handleDataSync);
    socket.on('technician_update', handleDataSync);

    return () => {
      socket.off('new_repair_order', handleNewOrder);
      socket.off('data_changed', handleDataSync);
      socket.off('new_booking', handleDataSync);
      socket.off('technician_update', handleDataSync);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, []);

  const handleLogout = async () => {
    await clearAuthSession();
  };

  const activeRepairs = data.repairs.filter((r) => !isTerminalRepairStatus(r.status));
  const completedRepairs = data.repairs.filter((r) => ['completed', 'returned'].includes(r.status));
  const activeBookings = (data.bookings || []).filter((b) => isActiveBookingStatus(b.status));

  const renderRepairCard = ({ item }) => {
    const statusInfo = getRepairStatusInfo(item.status);
    const isCancelled = item.status === 'cancelled';
    const isActive = item.status === 'in_progress';

    return (
      <TouchableOpacity
        style={[styles.card, isCancelled && styles.cardCancelled]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RepairDetail', { repairId: item.id, repair: item })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardMetaLabel}>Mã đơn hàng</Text>
            <Text style={styles.cardReceiptCode}>#{item.receipt_code}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.borderColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDeviceName} numberOfLines={2}>{item.device_name}</Text>

        <View style={styles.divider} />

        <View style={styles.cardInfoContainer}>
          <View style={styles.cardInfoColumn}>
            <View style={styles.cardInfoRow}>
              <User color="#64748B" size={16} />
              <Text style={styles.cardInfoText}>{item.customer?.name || 'Khách vãng lai'}</Text>
            </View>
            <View style={[styles.cardInfoRow, { marginTop: 8 }]}>
              <CalendarDays color="#64748B" size={16} />
              <Text style={styles.cardInfoText}>{item.received_date}</Text>
            </View>
          </View>

          <View style={styles.actionCircle}>
            <ChevronRight color="#2563EB" size={24} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0) || 'K'}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName}>{user?.full_name || 'Kỹ thuật viên'}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Search Button */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('SearchRepair')}
          >
            <Search color="#1E293B" size={20} />
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell color="#1E293B" size={22} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Clean Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeRepairs.length}</Text>
          <Text style={styles.statLabel}>Đang xử lý</Text>
        </View>
        
        <View style={styles.verticalDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeBookings.length}</Text>
          <Text style={styles.statLabel}>Lịch hẹn</Text>
        </View>
        
        <View style={styles.verticalDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedRepairs.length}</Text>
          <Text style={styles.statLabel}>Hoàn thành</Text>
        </View>
      </View>

      {/* List Content */}
      <FlatList
        data={data.repairs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRepairCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} tintColor={'#2563EB'} />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Quick Search Bar */}
            <TouchableOpacity 
              style={styles.quickSearchBox} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('SearchRepair')}
            >
              <Search color="#64748B" size={18} />
              <Text style={styles.quickSearchPlaceholder}>Tìm khách hàng bằng SĐT để tra cứu bảo hành...</Text>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh Sách Đơn Hàng</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{data.repairs.length}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Wrench color="#94A3B8" size={32} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
            <Text style={styles.emptyText}>Bạn chưa được phân công đơn sửa chữa nào tại thời điểm hiện tại.</Text>
          </View>
        )}
      />

      {/* Toast Notification Banner */}
      <ToastNotification
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={hideToast}
        onPress={() => {
          setUnreadCount(0);
          navigation.navigate('Notifications');
        }}
        duration={4500}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  // Clean Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    color: '#2563EB',
    fontSize: 20,
    fontWeight: '700',
  },
  greeting: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  // Clean Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  statNumber: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  // List Content
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  quickSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  quickSearchPlaceholder: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  badgeCount: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 10,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCancelled: {
    opacity: 0.65,
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardMetaLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  cardReceiptCode: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDeviceName: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  cardInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfoColumn: {
    flex: 1,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardInfoText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  actionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty
  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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

export default DashboardScreen;
