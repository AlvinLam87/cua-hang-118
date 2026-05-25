import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, SafeAreaView,
} from 'react-native';
import {
  ArrowLeft, Camera, User, Phone, MapPin, Calendar, Clock,
  MessageSquare, CheckCircle2, Navigation,
} from 'lucide-react-native';
import { technicianAPI } from '../api';
import { getBookingStatusInfo } from '../constants/statusMaps';
import { isCameraJob } from '../utils/bookingTypes';

const BookingDetailScreen = ({ route, navigation }) => {
  const { booking: initial } = route.params || {};
  const [booking, setBooking] = useState(initial);
  const [saving, setSaving] = useState(false);

  const isCamera = isCameraJob(booking?.service);
  const statusInfo = getBookingStatusInfo(booking?.status);

  const handleCall = () => {
    if (booking?.phone) Linking.openURL(`tel:${booking.phone}`);
  };

  const handleMaps = () => {
    if (booking?.address) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`);
    }
  };

  const markCompleted = () => {
    Alert.alert(
      isCamera ? 'Hoàn thành khảo sát' : 'Hoàn thành lịch hẹn',
      isCamera
        ? 'Xác nhận đã khảo sát / tư vấn camera tại chỗ?'
        : 'Xác nhận đã gặp khách và xử lý xong lịch hẹn?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setSaving(true);
            try {
              const res = await technicianAPI.updateBooking(booking.id, { status: 'completed' });
              if (res.data?.success) {
                setBooking((prev) => ({ ...prev, status: 'completed', ...res.data.data }));
                Alert.alert('Thành công', res.data.message || 'Đã cập nhật.');
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không cập nhật được.');
              }
            } catch {
              Alert.alert('Lỗi', 'Không kết nối được máy chủ.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text>Không có dữ liệu lịch hẹn.</Text>
      </View>
    );
  }

  const accent = isCamera ? '#7C3AED' : '#2563EB';
  const accentBg = isCamera ? '#F5F3FF' : '#EFF6FF';

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, { backgroundColor: accentBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1E293B" size={22} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <View style={[styles.kindPill, { backgroundColor: accent }]}>
            {isCamera ? <Camera color="#FFF" size={14} /> : <Calendar color="#FFF" size={14} />}
            <Text style={styles.kindPillText}>
              {isCamera ? 'Khảo sát Camera' : 'Lịch hẹn dịch vụ'}
            </Text>
          </View>
          <Text style={styles.topTitle}>#{booking.id}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: statusInfo.bg, borderColor: statusInfo.borderColor }]}>
          <Text style={[styles.statusChipText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { borderColor: isCamera ? '#DDD6FE' : '#BFDBFE' }]}>
          <Text style={styles.serviceLabel}>{isCamera ? 'Dịch vụ camera' : 'Dịch vụ'}</Text>
          <Text style={styles.serviceName}>{booking.service}</Text>
          {isCamera && (
            <Text style={styles.heroHint}>
              Không phải đơn sửa chữa — khảo sát địa điểm, tư vấn số mắt và báo giá lắp đặt.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khách hàng</Text>
          <View style={styles.row}>
            <User color="#64748B" size={18} />
            <Text style={styles.rowText}>{booking.name}</Text>
          </View>
          <View style={styles.row}>
            <Phone color="#64748B" size={18} />
            <Text style={styles.rowText}>{booking.phone}</Text>
          </View>
          {booking.address ? (
            <View style={styles.row}>
              <MapPin color="#64748B" size={18} />
              <Text style={styles.rowText}>{booking.address}</Text>
            </View>
          ) : null}
        </View>

        {(booking.booking_date || booking.booking_time) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian hẹn</Text>
            {booking.booking_date ? (
              <View style={styles.row}>
                <Calendar color="#64748B" size={18} />
                <Text style={styles.rowText}>{booking.booking_date}</Text>
              </View>
            ) : null}
            {booking.booking_time ? (
              <View style={styles.row}>
                <Clock color="#64748B" size={18} />
                <Text style={styles.rowText}>{booking.booking_time}</Text>
              </View>
            ) : null}
          </View>
        )}

        {booking.message ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú khách</Text>
            <View style={styles.noteBox}>
              <MessageSquare color="#94A3B8" size={16} />
              <Text style={styles.noteText}>{booking.message}</Text>
            </View>
          </View>
        ) : null}

        {isCamera && (
          <View style={styles.checklist}>
            <Text style={styles.sectionTitle}>Việc cần làm</Text>
            {['Gọi khách xác nhận thời gian khảo sát', 'Khảo sát vị trí lắp camera', 'Báo giá / số mắt cho khách', 'Báo admin khi hoàn tất'].map((step, i) => (
              <View key={i} style={styles.checkItem}>
                <View style={[styles.checkDot, { backgroundColor: accent }]} />
                <Text style={styles.checkText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={handleCall}>
            <Phone color="#FFF" size={18} />
            <Text style={styles.primaryBtnText}>Gọi khách</Text>
          </TouchableOpacity>
          {booking.address ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleMaps}>
              <Navigation color="#334155" size={18} />
              <Text style={styles.secondaryBtnText}>Chỉ đường</Text>
            </TouchableOpacity>
          ) : null}
          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.completeBtn, saving && styles.disabled]}
              onPress={markCompleted}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <CheckCircle2 color="#FFF" size={20} />
                  <Text style={styles.completeBtnText}>
                    {isCamera ? 'Hoàn thành khảo sát' : 'Hoàn thành lịch hẹn'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 8, marginRight: 8 },
  topBarCenter: { flex: 1 },
  kindPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  kindPillText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  serviceLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  serviceName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  heroHint: { fontSize: 13, color: '#6D28D9', marginTop: 8, lineHeight: 18 },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  rowText: { flex: 1, fontSize: 15, color: '#334155', fontWeight: '600' },
  noteBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  noteText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },
  checklist: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  checkDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  checkText: { flex: 1, fontSize: 14, color: '#334155' },
  actions: { gap: 10 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: { color: '#334155', fontWeight: '700', fontSize: 15 },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#059669',
    marginTop: 8,
  },
  completeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.6 },
});

export default BookingDetailScreen;
