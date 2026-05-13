import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Linking, SafeAreaView, Platform
} from 'react-native';
import { User, Wrench, MapPin, Phone, Navigation, Clock, Calendar, RefreshCw } from 'lucide-react-native';
import { technicianAPI } from '../api';

const BookingsScreen = () => {
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
  }, []);

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
    const isConfirmed = item.status === 'confirmed';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.timeBox}>
              <Clock color="#2563EB" size={16} />
              <Text style={styles.timeText}>{item.booking_time}</Text>
            </View>
            <Text style={styles.dateText}>{item.booking_date}</Text>
          </View>
          <View style={[styles.badge, isConfirmed ? styles.badgeConfirmed : styles.badgePending]}>
            <Text style={[styles.badgeText, isConfirmed ? styles.badgeTextConfirmed : styles.badgeTextPending]}>
              {isConfirmed ? 'Đã xác nhận' : 'Chờ xác nhận'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <User color="#4F46E5" size={18} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{item.name}</Text>
            <Text style={styles.infoSubtitle}>{item.phone}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Wrench color="#EA580C" size={18} />
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
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(item.phone)}>
            <Phone color="#FFFFFF" size={18} />
            <Text style={styles.actionBtnText}>Gọi khách</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
            <Navigation color="#334155" size={18} />
            <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Chỉ đường</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          <Text style={styles.headerSubtitle}>Quản lý các công việc đã lên lịch.</Text>
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
  badgeConfirmed: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgePending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  badgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextConfirmed: {
    color: '#059669',
  },
  badgeTextPending: {
    color: '#475569',
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
