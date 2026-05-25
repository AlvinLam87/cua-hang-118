import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Linking, SafeAreaView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { User, Wrench, MapPin, Phone, Navigation, Clock, Calendar, Camera, ChevronRight } from 'lucide-react-native';
import { technicianAPI } from '../api';
import { initSocket } from '../api/socket';
import { getBookingStatusInfo, isActiveBookingStatus } from '../constants/statusMaps';
import { isCameraJob } from '../utils/bookingTypes';

const BookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    try {
      const response = await technicianAPI.getTasks();
      if (response.data.success) {
        setBookings(response.data.data.bookings || []);
      }
    } catch (error) {
      console.log('Fetch error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = initSocket();
    const onDataChanged = (payload) => {
      if (!payload?.type || payload.type === 'booking' || payload.type === 'repair_order') {
        fetchData();
      }
    };
    const onBookingUpdate = () => fetchData();
    socket.on('data_changed', onDataChanged);
    socket.on('new_booking', onBookingUpdate);
    return () => {
      socket.off('data_changed', onDataChanged);
      socket.off('new_booking', onBookingUpdate);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // ----- Tab filter logic -----
  const getFilteredBookings = () => {
    if (activeTab === 'all') return bookings;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (activeTab === 'today') {
      return bookings.filter(b => b.booking_date === todayStr);
    }

    if (activeTab === 'week') {
      const weekLater = new Date(today);
      weekLater.setDate(today.getDate() + 7);
      return bookings.filter(b => {
        if (!b.booking_date) return false;
        return b.booking_date >= todayStr && b.booking_date <= weekLater.toISOString().slice(0, 10);
      });
    }

    return bookings;
  };

  const filteredBookings = getFilteredBookings();

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const renderBookingCard = ({ item }) => {
    const statusInfo = getBookingStatusInfo(item.status);
    const isInactive = !isActiveBookingStatus(item.status);
    const isCamera = item.job_kind === 'camera' || isCameraJob(item.service);
    const accent = isCamera ? '#7C3AED' : '#2563EB';
    const accentSoft = isCamera ? '#F5F3FF' : '#EFF6FF';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BookingDetail', { booking: { ...item, job_kind: isCamera ? 'camera' : 'repair' } })}
        style={[
          styles.card,
          isInactive && styles.cardInactive,
          isCamera && styles.cardCamera,
        ]}
      >
        {isCamera && (
          <View style={styles.cameraBanner}>
            <Camera color="#7C3AED" size={14} />
            <Text style={styles.cameraBannerText}>Khảo sát / lắp Camera — không phải sửa chữa</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.dateTimeContainer}>
            {item.booking_time ? (
              <View style={[styles.timeBox, { backgroundColor: accentSoft }]}>
                <Clock color={accent} size={16} />
                <Text style={[styles.timeText, { color: accent }]}>{item.booking_time}</Text>
              </View>
            ) : (
              <Text style={styles.noScheduleText}>
                {isCamera ? 'Liên hệ đặt lịch khảo sát' : 'Chưa có giờ hẹn'}
              </Text>
            )}
            {item.booking_date ? (
              <Text style={styles.dateText}>{item.booking_date}</Text>
            ) : null}
          </View>
          <View style={[styles.badge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.borderColor }]}>
            <Text style={[styles.badgeText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, isCamera && styles.iconContainerCamera]}>
            <User color={isCamera ? '#7C3AED' : '#4F46E5'} size={18} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{item.name}</Text>
            <Text style={styles.infoSubtitle}>{item.phone}</Text>
          </View>
          <ChevronRight color="#94A3B8" size={20} />
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, isCamera && styles.iconContainerCamera]}>
            {isCamera ? (
              <Camera color="#7C3AED" size={18} />
            ) : (
              <Wrench color="#EA580C" size={18} />
            )}
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>{item.service || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MapPin color="#059669" size={18} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>{item.address || 'N/A'}</Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{item.message}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, isCamera && { backgroundColor: '#7C3AED' }]}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleCall(item.phone);
            }}
          >
            <Phone color="#FFFFFF" size={18} />
            <Text style={styles.actionBtnText}>Gọi khách</Text>
          </TouchableOpacity>
          {item.address ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={(e) => {
                e?.stopPropagation?.();
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`);
              }}
            >
              <Navigation color="#334155" size={18} />
              <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Chỉ đường</Text>
            </TouchableOpacity>
          ) : null}
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
        <View>
          <Text style={styles.headerTitle}>Lịch Hẹn</Text>
          <Text style={styles.headerSubtitle}>Lịch sửa chữa và khảo sát Camera — giao diện khác nhau.</Text>
        </View>
        
        {/* Tabs inside header */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.tabActive]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>Hôm nay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'week' && styles.tabActive]}
            onPress={() => setActiveTab('week')}
          >
            <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>Tuần này</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : `booking-${index}`)}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} tintColor="#2563EB" />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Calendar color="#94A3B8" size={32} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'today' ? 'Hôm nay không có lịch hẹn' :
               activeTab === 'week'  ? 'Tuần này chưa có lịch hẹn' :
               'Chưa có lịch hẹn'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? 'Hiện không có lịch hẹn nào đang chờ xử lý.'
                : 'Kéo xuống để làm mới dữ liệu.'}
            </Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateTimeContainer: {
    gap: 4,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  dateText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  cardInactive: {
    opacity: 0.72,
  },
  cardCamera: {
    borderColor: '#DDD6FE',
    backgroundColor: '#FEFCFF',
  },
  cameraBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  cameraBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
    flex: 1,
  },
  noScheduleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  iconContainerCamera: {
    backgroundColor: '#F5F3FF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  infoText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  noteBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  noteText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    gap: 8,
  },
  actionBtnSecondary: {
    backgroundColor: '#F1F5F9',
  },
  actionBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionBtnTextSecondary: {
    color: '#334155',
  },
  // Empty State
  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
    marginTop: 20,
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

export default BookingsScreen;
