import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Linking
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, Wrench } from 'lucide-react-native';
import { authAPI } from '../api';
import { saveAuthSession } from '../api/authSession';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const data = response.data;

      if (data.success) {
        if (data.data.user.role !== 'technician') {
          Alert.alert('Từ chối truy cập', 'Ứng dụng này chỉ dành cho kỹ thuật viên.');
        } else {
          await saveAuthSession(data.data.token, data.data.user);
          navigation.replace('MainTabs');
        }
      } else {
        Alert.alert('Lỗi', data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc địa chỉ IP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Decorative backgrounds */}
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      <View style={styles.content}>
        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Wrench color="#FFFFFF" size={32} />
          </View>
          <Text style={styles.title}>Cửa Hàng 118</Text>
          <Text style={styles.subtitle}>Cổng dành riêng cho Kỹ thuật viên</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email hoặc Tên đăng nhập</Text>
            <View style={styles.inputWrapper}>
              <Mail color="#737686" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="kythuatvien@cuahang118.com"
                placeholderTextColor="rgba(115,118,134,0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TouchableOpacity>
                <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Lock color="#737686" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(115,118,134,0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff color="#737686" size={20} />
                ) : (
                  <Eye color="#737686" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng Nhập</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Support Info */}
        <View style={styles.supportRow}>
          <Text style={styles.supportText}>Gặp sự cố đăng nhập? </Text>
          <TouchableOpacity>
            <Text style={styles.supportLink}>Liên hệ IT Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  bgDecor1: {
    position: 'absolute',
    top: -120,
    left: 0,
    width: '100%',
    height: 250,
    backgroundColor: 'rgba(37,99,235,0.05)',
    borderRadius: 999,
  },
  bgDecor2: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(220,226,243,0.2)',
    borderRadius: 999,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    color: '#191B23',
    letterSpacing: -0.48,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: '#434655',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.3)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#434655',
    lineHeight: 16,
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    borderWidth: 1,
    borderColor: '#C3C6D7',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: '#191B23',
    lineHeight: 24,
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  supportRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  supportText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#737686',
  },
  supportLink: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});

export default LoginScreen;
