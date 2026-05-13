import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions
} from 'react-native';
import { Wrench, Calendar, CheckCircle, Info, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const getIconConfig = (type) => {
  switch (type) {
    case 'assignment': return { Icon: Wrench, bg: '#2563EB', color: '#FFF', accent: '#DBEAFE' };
    case 'booking':    return { Icon: Calendar, bg: '#EA580C', color: '#FFF', accent: '#FED7AA' };
    case 'completed':  return { Icon: CheckCircle, bg: '#059669', color: '#FFF', accent: '#D1FAE5' };
    case 'info':       return { Icon: Info, bg: '#7C3AED', color: '#FFF', accent: '#EDE9FE' };
    default:           return { Icon: Info, bg: '#64748B', color: '#FFF', accent: '#F1F5F9' };
  }
};

/**
 * ToastNotification
 * Props:
 *   visible   {boolean}
 *   type      {string}  'assignment' | 'booking' | 'completed' | 'info'
 *   title     {string}
 *   message   {string}
 *   onClose   {function}
 *   onPress   {function}
 *   duration  {number}  ms, default 4000
 */
const ToastNotification = ({
  visible,
  type = 'info',
  title = '',
  message = '',
  onClose,
  onPress,
  duration = 4000,
}) => {
  const translateY = useRef(new Animated.Value(-160)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef(null);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          handleClose();
        }, duration);
      }
    } else {
      handleClose(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const handleClose = (animate = true) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animate) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -160,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onClose && onClose());
    } else {
      translateY.setValue(-160);
      opacity.setValue(0);
    }
  };

  const { Icon, bg, accent } = getIconConfig(type);

  if (!visible && opacity._value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        style={[styles.toast, { borderLeftColor: bg }]}
        onPress={() => {
          handleClose();
          onPress && onPress();
        }}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <Icon color="#FFF" size={18} />
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={styles.toastTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.toastMsg} numberOfLines={2}>{message}</Text>
        </View>

        {/* Close */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => handleClose()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X color="#94A3B8" size={16} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingTop: 56,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
  },
  toastTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  toastMsg: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
    flexShrink: 0,
  },
});

export default ToastNotification;
