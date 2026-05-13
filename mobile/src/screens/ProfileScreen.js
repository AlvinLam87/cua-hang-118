import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Bell, Mail, Phone, CheckCircle2, Star, Award,
  KeyRound, BellRing, Info, LogOut, ChevronRight, Wrench, ShieldCheck
} from 'lucide-react-native';
import { technicianAPI } from '../api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Fetch real stats
      const response = await technicianAPI.getTasks();
      if (response.data.success) {
        const completedRepairs = response.data.data.repairs.filter(r => r.status === 'completed');
        setCompletedCount(completedRepairs.length);
      }
    } catch (error) {
      console.log('Lỗi tải dữ liệu cá nhân', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            navigation.getParent()?.replace('Login') || navigation.replace('Login');
          }
        }
      ]
    );
  };

  const getInitial = (name) => {
    if (!name) return 'K';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
          <Bell color="#1E293B" size={24} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Info - Clean & Centered */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{getInitial(user?.full_name)}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <CheckCircle2 color="#2563EB" size={20} fill="#FFFFFF" />
            </View>
          </View>
          
          <Text style={styles.nameText}>{user?.full_name || 'Người dùng'}</Text>
          <View style={styles.roleBadge}>
            {user?.role === 'admin' ? (
              <ShieldCheck color="#2563EB" size={12} style={{ marginRight: 4 }} />
            ) : user?.role === 'technician' ? (
              <Wrench color="#2563EB" size={12} style={{ marginRight: 4 }} />
            ) : (
              <Award color="#2563EB" size={12} style={{ marginRight: 4 }} />
            )}
            <Text style={styles.roleText}>
              {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'technician' ? 'Kỹ thuật viên' : 'Khách hàng thân thiết'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user?.role === 'customer' ? (user?.points || 0) : (loadingStats ? '-' : completedCount)}
            </Text>
            <Text style={styles.statLabel}>{user?.role === 'customer' ? 'Điểm thưởng' : 'Đã sửa'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.statValue}>{user?.rating || '5.0'}</Text>
              <Star color="#F59E0B" size={14} fill="#F59E0B" style={{ marginLeft: 2, marginTop: -2 }} />
            </View>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
          {user?.role === 'technician' && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.experience_years || 0}</Text>
                <Text style={styles.statLabel}>Năm KN</Text>
              </View>
            </>
          )}
          {user?.role === 'customer' && (
            <>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} onPress={() => Alert.alert('Đổi quà', 'Tính năng đang được phát triển')}>
                <Award color="#2563EB" size={20} />
                <Text style={styles.statLabel}>Đổi quà</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Info Group */}
        <Text style={styles.groupTitle}>THÔNG TIN LIÊN HỆ</Text>
        <View style={styles.groupCard}>
          <View style={styles.rowItem}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Mail color="#2563EB" size={18} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{user?.email || 'email@example.com'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowItem}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Phone color="#16A34A" size={18} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Số điện thoại</Text>
              <Text style={styles.rowValue}>{user?.phone || 'Chưa cập nhật'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Group */}
        <Text style={styles.groupTitle}>CÀI ĐẶT</Text>
        <View style={styles.groupCard}>
          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('ChangePassword')}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <KeyRound color="#475569" size={18} />
            </View>
            <Text style={styles.rowActionText}>Đổi mật khẩu</Text>
            <ChevronRight color="#CBD5E1" size={20} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('NotificationSettings')}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <BellRing color="#475569" size={18} />
            </View>
            <Text style={styles.rowActionText}>Cài đặt thông báo</Text>
            <ChevronRight color="#CBD5E1" size={20} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('AppInfo')}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <Info color="#475569" size={18} />
            </View>
            <Text style={styles.rowActionText}>Giới thiệu ứng dụng</Text>
            <ChevronRight color="#CBD5E1" size={20} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut color="#DC2626" size={20} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  bellBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140, // Avoid bottom tab overlap
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    fontFamily: 'Inter',
    fontSize: 40,
    fontWeight: '700',
    color: '#2563EB',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  nameText: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 32,
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
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  groupTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 1,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2,
  },
  rowValue: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowActionText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
    marginBottom: 20,
  },
  logoutText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
});

export default ProfileScreen;
