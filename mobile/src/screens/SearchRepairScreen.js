import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Linking, SafeAreaView,
  Platform, KeyboardAvoidingView, Keyboard
} from 'react-native';
import {
  ArrowLeft, Search, Phone, Smartphone, CalendarDays,
  ShieldCheck, Clock, ChevronRight, User, X
} from 'lucide-react-native';
import { technicianAPI } from '../api';

const STATUS_MAP = {
  received:    { label: 'Tiếp nhận',    bg: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' },
  diagnosing:  { label: 'Chẩn đoán',    bg: '#FFF7ED', color: '#EA580C', borderColor: '#FED7AA' },
  quoted:      { label: 'Đã báo giá',   bg: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' },
  in_progress: { label: 'Đang sửa',     bg: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' },
  testing:     { label: 'Kiểm tra',     bg: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' },
  completed:   { label: 'Hoàn thành',   bg: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' },
  cancelled:   { label: 'Đã hủy',       bg: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' },
};

const SearchRepairScreen = ({ navigation }) => {
  const [phone, setPhone]         = useState('');
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const inputRef = useRef(null);

  const handleSearch = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 6) {
      setErrorMsg('Vui lòng nhập ít nhất 6 số điện thoại.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setErrorMsg('');
    setSearched(false);

    try {
      const res = await technicianAPI.searchByPhone(trimmed);
      if (res.data.success) {
        setResults(res.data.data);
      } else {
        setResults([]);
        setErrorMsg(res.data.message || 'Không tìm thấy kết quả.');
      }
    } catch (err) {
      setResults([]);
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleClear = () => {
    setPhone('');
    setResults([]);
    setSearched(false);
    setErrorMsg('');
    inputRef.current?.focus();
  };

  const handleCall = (phoneNum) => {
    if (phoneNum) Linking.openURL(`tel:${phoneNum}`);
  };

  const handleCreateWarranty = async (parentOrder) => {
    Alert.alert(
      'Tạo đơn bảo hành',
      `Bạn có chắc chắn muốn tạo đơn tiếp nhận bảo hành mới liên kết với đơn gốc #${parentOrder.receipt_code}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await technicianAPI.createWarrantyOrder(parentOrder.id);
              if (res.data.success) {
                Alert.alert('Thành công', res.data.message || 'Đã tạo đơn bảo hành thành công.');
                handleSearch(); // Reload search results
              } else {
                Alert.alert('Thất bại', res.data.message || 'Không thể tạo đơn bảo hành.');
              }
            } catch (err) {
              console.log(err);
              Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tạo đơn bảo hành.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusInfo = (status) => STATUS_MAP[status] || STATUS_MAP.received;

  const isWarrantyActive = (item) => {
    if (item.status !== 'completed' && item.status !== 'returned') return false;
    if (!item.warranty_expiry) return false;
    return new Date(item.warranty_expiry) > new Date();
  };

  const renderCard = ({ item }) => {
    const statusInfo  = getStatusInfo(item.status);
    const underWarranty = isWarrantyActive(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RepairDetail', { repairId: item.id, repair: item })}
      >
        {/* Header: Mã đơn + Badge trạng thái */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardMeta}>Mã đơn hàng</Text>
            <Text style={styles.cardCode}>#{item.receipt_code}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.borderColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* Tên thiết bị */}
        <View style={styles.deviceRow}>
          <Smartphone color="#64748B" size={16} />
          <Text style={styles.deviceName} numberOfLines={1}>{item.device_name}</Text>
        </View>

        {/* Khách hàng */}
        <View style={styles.infoRow}>
          <User color="#64748B" size={15} />
          <Text style={styles.infoText}>{item.customer?.name || 'Khách vãng lai'}</Text>
          {item.customer?.phone && (
            <TouchableOpacity
              style={styles.callMiniBtn}
              onPress={() => handleCall(item.customer.phone)}
            >
              <Phone color="#2563EB" size={14} />
              <Text style={styles.callMiniText}>{item.customer.phone}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Ngày nhận */}
        <View style={styles.infoRow}>
          <CalendarDays color="#64748B" size={15} />
          <Text style={styles.infoText}>Nhận: {item.received_date || '—'}</Text>
          {item.completed_date && (
            <Text style={styles.completedDate}>  Xong: {new Date(item.completed_date).toLocaleDateString('vi-VN')}</Text>
          )}
        </View>

        {/* Badge bảo hành */}
        {underWarranty && (
          <View style={styles.warrantyBanner}>
            <ShieldCheck color="#059669" size={16} />
            <Text style={styles.warrantyText}>
              Còn bảo hành đến {new Date(item.warranty_expiry).toLocaleDateString('vi-VN')}
            </Text>
            <TouchableOpacity
              style={styles.warrantyActionBtn}
              onPress={() => handleCreateWarranty(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.warrantyActionText}>Tiếp nhận BH</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'completed' && !underWarranty && item.warranty_expiry && (
          <View style={[styles.warrantyBanner, styles.warrantyExpired]}>
            <Clock color="#DC2626" size={16} />
            <Text style={[styles.warrantyText, { color: '#DC2626' }]}>
              Bảo hành đã hết hạn ({new Date(item.warranty_expiry).toLocaleDateString('vi-VN')})
            </Text>
          </View>
        )}

        {/* Arrow */}
        <View style={styles.arrowRow}>
          <Text style={styles.viewDetail}>Xem chi tiết</Text>
          <ChevronRight color="#2563EB" size={18} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#0F172A" size={24} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Tra cứu đơn sửa chữa</Text>
            <Text style={styles.headerSub}>Nhập SĐT khách để tìm đơn & bảo hành</Text>
          </View>
        </View>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <View style={[styles.inputWrap, errorMsg ? styles.inputError : null]}>
            <Phone color="#64748B" size={20} style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Nhập số điện thoại khách hàng..."
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={(t) => { setPhone(t); setErrorMsg(''); }}
              keyboardType="phone-pad"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {phone.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <X color="#94A3B8" size={18} />
              </TouchableOpacity>
            )}
          </View>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
            onPress={handleSearch}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Search color="#FFF" size={20} />
                <Text style={styles.searchBtnText}>Tìm kiếm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {!searched && !loading && (
          <View style={styles.emptyHint}>
            <View style={styles.hintIconCircle}>
              <Phone color="#2563EB" size={36} />
            </View>
            <Text style={styles.hintTitle}>Tra cứu đơn bảo hành</Text>
            <Text style={styles.hintText}>
              Nhập số điện thoại của khách hàng để tìm tất cả đơn sửa chữa, kiểm tra tình trạng bảo hành nhanh chóng.
            </Text>
          </View>
        )}

        {searched && results.length === 0 && !loading && (
          <View style={styles.emptyResult}>
            <View style={styles.hintIconCircle}>
              <Search color="#94A3B8" size={32} />
            </View>
            <Text style={styles.emptyTitle}>Không tìm thấy đơn nào</Text>
            <Text style={styles.emptyText}>
              Không có đơn sửa chữa nào khớp với số điện thoại "{phone}".
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Kết quả tìm kiếm</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{results.length} đơn</Text>
                </View>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSub: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  // Search
  searchBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 4,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#DC2626',
    marginTop: -4,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 50,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBtnDisabled: {
    backgroundColor: '#93C5FD',
    elevation: 0,
  },
  searchBtnText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  // Empty / Hint
  emptyHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  hintIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hintTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  hintText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Results
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  resultsTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardMeta: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 3,
  },
  cardCode: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  infoText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  completedDate: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  callMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  callMiniText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  // Warranty
  warrantyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  warrantyExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  warrantyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    flex: 1,
  },
  warrantyActionBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 6,
  },
  warrantyActionText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Arrow
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  viewDetail: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});

export default SearchRepairScreen;
