import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity
} from 'react-native';
import { Wrench, Calendar, CheckCircle, Info } from 'lucide-react-native';

// Mock data for notifications
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'assignment',
    title: 'Bạn được phân công đơn mới #RCV-118003',
    description: 'Đơn bảo trì máy lạnh tại 123 Lê Lợi, Q1.',
    time: '5 phút trước',
    unread: true,
  },
  {
    id: '2',
    type: 'booking',
    title: 'Lịch hẹn mới từ Nguyễn Văn D',
    description: 'Khách hàng yêu cầu kiểm tra hệ thống điện vào 14:00 hôm nay.',
    time: '1 giờ trước',
    unread: true,
  },
  {
    id: '3',
    type: 'completed',
    title: 'Đơn #RCV-118002 đã hoàn thành',
    description: 'Khách hàng đã xác nhận thanh toán thành công.',
    time: 'Hôm qua, 15:30',
    unread: false,
  },
  {
    id: '4',
    type: 'info',
    title: 'Cập nhật chính sách dịch vụ',
    description: 'Vui lòng đọc các thay đổi mới trong quy trình tiếp nhận đơn hàng.',
    time: '2 ngày trước',
    unread: false,
  },
];

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const getIconConfig = (type) => {
    switch (type) {
      case 'assignment': return { Icon: Wrench, bg: '#2563EB', color: '#FFF' };
      case 'booking': return { Icon: Calendar, bg: '#BC4800', color: '#FFF' };
      case 'completed': return { Icon: CheckCircle, bg: '#E1E2ED', color: '#434655' };
      case 'info': return { Icon: Info, bg: '#E1E2ED', color: '#434655' };
      default: return { Icon: Info, bg: '#E1E2ED', color: '#434655' };
    }
  };

  const renderNotificationCard = ({ item }) => {
    const { Icon, bg, color } = getIconConfig(item.type);

    return (
      <View style={styles.card}>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông Báo</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markReadText}>Đánh dấu tất cả đã đọc</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
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
});

export default NotificationsScreen;
