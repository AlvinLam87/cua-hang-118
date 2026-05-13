import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Bell, CalendarClock, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const NotificationSettingsScreen = ({ navigation }) => {
  const [newOrder, setNewOrder] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [system, setSystem] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await AsyncStorage.getItem('notificationSettings');
        if (settings) {
          const parsed = JSON.parse(settings);
          setNewOrder(parsed.newOrder ?? true);
          setReminder(parsed.reminder ?? true);
          setSystem(parsed.system ?? false);
        }
      } catch (error) {
        console.log('Load settings error', error);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (key, value) => {
    try {
      const newSettings = { newOrder, reminder, system, [key]: value };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.log('Save settings error', error);
    }
  };

  const toggleSwitch = (key, setter, value) => {
    setter(value);
    saveSettings(key, value);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E3A8A', '#2563EB', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cài Đặt Thông Báo</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Bell color="#2563EB" size={20} />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingTitle}>Đơn hàng mới</Text>
              <Text style={styles.settingDesc}>Nhận thông báo khi có đơn sửa chữa hoặc lịch hẹn mới được phân công.</Text>
            </View>
            <Switch
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={newOrder ? '#2563EB' : '#F8FAFC'}
              onValueChange={(val) => toggleSwitch('newOrder', setNewOrder, val)}
              value={newOrder}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <CalendarClock color="#EA580C" size={20} />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingTitle}>Nhắc nhở lịch hẹn</Text>
              <Text style={styles.settingDesc}>Thông báo trước 30 phút khi sắp tới giờ thực hiện lịch hẹn với khách.</Text>
            </View>
            <Switch
              trackColor={{ false: '#CBD5E1', true: '#FDBA74' }}
              thumbColor={reminder ? '#EA580C' : '#F8FAFC'}
              onValueChange={(val) => toggleSwitch('reminder', setReminder, val)}
              value={reminder}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <MessageSquare color="#059669" size={20} />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={styles.settingTitle}>Tin nhắn hệ thống</Text>
              <Text style={styles.settingDesc}>Các thông báo cập nhật tính năng mới từ ban quản trị cửa hàng.</Text>
            </View>
            <Switch
              trackColor={{ false: '#CBD5E1', true: '#6EE7B7' }}
              thumbColor={system ? '#059669' : '#F8FAFC'}
              onValueChange={(val) => toggleSwitch('system', setSystem, val)}
              value={system}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginTop: -40,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingTextContent: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  settingDesc: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 54,
  },
});

export default NotificationSettingsScreen;
