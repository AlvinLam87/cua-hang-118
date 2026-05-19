import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, TextInput, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import {
  ArrowLeft, Phone, Smartphone, ClipboardList, CheckCircle2,
  Circle, CheckCircle, Pencil, X, Save, Camera
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { technicianAPI, API_URL_BASE } from '../api';

const STATUS_FLOW = ['received', 'diagnosing', 'quoted', 'in_progress', 'testing', 'completed'];
const STATUS_TO_STEP = {
  received:    1,
  diagnosing:  2,
  quoted:      3,
  in_progress: 4,
  testing:     5,
  completed:   6,
};
const STATUS_LABELS = {
  received:    'Tiếp nhận thiết bị',
  diagnosing:  'Đang chẩn đoán',
  quoted:      'Đã báo giá',
  in_progress: 'Đang sửa chữa',
  testing:     'Đang kiểm tra & bàn giao',
  completed:   'Hoàn thành',
};

const RepairDetailScreen = ({ route, navigation }) => {
  const { repairId, repair } = route.params;
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [stepping, setStepping]   = useState(false);
  const [data, setData]           = useState(repair || null);
  const [currentStep, setCurrentStep] = useState(
    STATUS_TO_STEP[repair?.status] || 1
  );

  // Edit state
  const [isEditing, setIsEditing]         = useState(false);
  const [editDiagnosis, setEditDiagnosis] = useState('');
  const [editCost, setEditCost]           = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const steps = [
    { id: 1, title: 'Tiếp nhận thiết bị' },
    { id: 2, title: 'Chẩn đoán lỗi' },
    { id: 3, title: 'Báo giá cho khách' },
    { id: 4, title: 'Đang sửa chữa',        subtitle: `Kỹ thuật viên: ${data?.technician_name || 'N/A'}` },
    { id: 5, title: 'Kiểm tra & bàn giao' },
    { id: 6, title: 'Hoàn thành',           subtitle: data?.completed_date ? `Ngày: ${data.completed_date}` : 'Chờ hoàn thành' },
  ];

  // Sync currentStep whenever data.status changes
  useEffect(() => {
    if (data?.status) {
      setCurrentStep(STATUS_TO_STEP[data.status] || 1);
    }
  }, [data?.status]);

  const handleCall = () => {
    if (data?.customer?.phone) {
      Linking.openURL(`tel:${data.customer.phone}`);
    }
  };

  const handleNextStep = () => {
    if (!data) return;
    const currentStatus = data.status || 'received';
    const currentIdx    = STATUS_FLOW.indexOf(currentStatus);

    if (currentIdx >= STATUS_FLOW.length - 1) {
      Alert.alert('Thông báo', 'Đơn này đã hoàn thành rồi!');
      return;
    }

    if (currentStatus === 'received' && !data.device_image) {
      Alert.alert('Chưa chụp ảnh thiết bị', 'Bạn bắt buộc phải chụp ảnh tình trạng thiết bị trước khi chuyển sang bước Đang chẩn đoán.');
      return;
    }

    const nextLabel = STATUS_LABELS[STATUS_FLOW[currentIdx + 1]];

    Alert.alert(
      'Xác nhận chuyển bước',
      `Chuyển sang: "${nextLabel}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'default',
          onPress: async () => {
            try {
              setStepping(true);
              const res = await technicianAPI.nextStep(data.id);
              if (res.data.success) {
                const newStatus = res.data.data.status;
                setData(prev => ({ ...prev, status: newStatus }));
                Alert.alert('✅ Thành công', res.data.message);
              }
            } catch (err) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể cập nhật.');
            } finally {
              setStepping(false);
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền camera để chụp ảnh thiết bị.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadDeviceImage(result.assets[0]);
    }
  };

  const uploadDeviceImage = async (imageAsset) => {
    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageAsset.uri,
        name: `photo-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const res = await technicianAPI.uploadImage(data.id, formData);
      if (res.data.success) {
        setData(res.data.data); // Updates device_image
        Alert.alert('Thành công', 'Đã lưu ảnh thiết bị!');
      }
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể tải ảnh lên.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open edit mode — prefill with current values
  const handleOpenEdit = () => {
    setEditDiagnosis(data?.diagnosis || '');
    setEditCost(data?.estimated_cost ? String(data.estimated_cost) : '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Save to backend
  const handleSave = async () => {
    if (!editDiagnosis.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập chẩn đoán kỹ thuật viên.');
      return;
    }
    const costNum = parseFloat(editCost.replace(/[^0-9.]/g, ''));
    if (isNaN(costNum) || costNum < 0) {
      Alert.alert('Chi phí không hợp lệ', 'Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    try {
      setSaving(true);
      const response = await technicianAPI.updateRepair(data.id, {
        diagnosis:      editDiagnosis.trim(),
        estimated_cost: costNum,
      });

      if (response.data.success) {
        // Update local state
        setData(prev => ({
          ...prev,
          diagnosis:      editDiagnosis.trim(),
          estimated_cost: costNum,
        }));
        setIsEditing(false);
        Alert.alert('✅ Thành công', 'Đã cập nhật chẩn đoán và chi phí.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#191B23" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>#{data.receipt_code}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status Card */}
        <View style={[styles.statusCard, data.status === 'completed' && styles.statusCardDone]}>
          <Text style={styles.statusTitle}>{STATUS_LABELS[data.status] || 'Tiếp nhận'}</Text>
          {data.status === 'in_progress' && <Text style={styles.statusTime}>⏱ Đang xử lý</Text>}
          {data.status === 'completed'   && <Text style={styles.statusTimeDone}>✅ Hoàn thành</Text>}
        </View>

        {/* Customer & Device Info Card */}
        <View style={styles.card}>
          <View style={styles.customerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{data.customer?.name || 'Khách hàng'}</Text>
              <Text style={styles.customerPhone}>{data.customer?.phone || 'N/A'}</Text>
              <Text style={styles.customerAddress}>{data.customer?.address || 'N/A'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Phone color="#FFF" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.deviceHeader}>
            <Smartphone color="#434655" size={20} />
            <Text style={styles.sectionTitle}>Thông tin thiết bị</Text>
          </View>

          <View style={styles.deviceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Loại máy</Text>
              <Text style={styles.value}>{data.device_name}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Số Serial/IMEI</Text>
              <Text style={styles.value}>{data.device_serial || 'N/A'}</Text>
            </View>
          </View>

          <Text style={styles.label}>Mô tả lỗi ban đầu</Text>
          <View style={styles.issueBox}>
            <Text style={styles.issueText}>{data.issue || 'Không có mô tả'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.deviceHeader}>
            <Camera color="#434655" size={20} />
            <Text style={styles.sectionTitle}>Ảnh thiết bị khi nhận</Text>
          </View>
          
          {data.device_image ? (
            <Image 
              source={{ uri: API_URL_BASE + data.device_image }} 
              style={styles.deviceImagePreview} 
              resizeMode="cover"
            />
          ) : data.status === 'received' ? (
            <TouchableOpacity 
              style={styles.uploadImageBtn} 
              onPress={handlePickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Camera color="#FFFFFF" size={20} />
                  <Text style={styles.uploadImageBtnText}>Chụp ảnh thiết bị (Bắt buộc)</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.noImageText}>Không có ảnh thiết bị.</Text>
          )}
        </View>

        {/* Diagnosis & Cost Card */}
        <View style={styles.card}>
          {/* Card header row */}
          <View style={styles.cardTitleRow}>
            <View style={styles.deviceHeader}>
              <ClipboardList color="#434655" size={20} />
              <Text style={styles.sectionTitle}>Chẩn đoán & Chi phí</Text>
            </View>

            {/* Edit / Cancel button */}
            {!isEditing ? (
              <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit}>
                <Pencil color="#004AC6" size={15} />
                <Text style={styles.editBtnText}>Chỉnh sửa</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                <X color="#64748B" size={15} />
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Diagnosis */}
          <Text style={styles.label}>Chẩn đoán kỹ thuật viên</Text>
          {isEditing ? (
            <TextInput
              style={styles.inputTextArea}
              value={editDiagnosis}
              onChangeText={setEditDiagnosis}
              placeholder="Nhập chẩn đoán..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          ) : (
            <Text style={[styles.value, { marginBottom: 16 }]}>
              {data.diagnosis || 'Chưa có chẩn đoán'}
            </Text>
          )}

          <View style={styles.divider} />

          {/* Cost row */}
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Phí dịch vụ sửa chữa</Text>
            {isEditing ? (
              <View style={styles.costInputWrap}>
                <TextInput
                  style={styles.inputCost}
                  value={editCost}
                  onChangeText={setEditCost}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  textAlign="right"
                />
                <Text style={styles.inputCostUnit}> VNĐ</Text>
              </View>
            ) : (
              <Text style={styles.costValue}>
                {Number(data.estimated_cost || 0).toLocaleString()} VNĐ
              </Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng chi phí dự kiến</Text>
            <Text style={styles.totalValue}>
              {isEditing
                ? `${Number(parseFloat(editCost.replace(/[^0-9.]/g, '')) || 0).toLocaleString()} VNĐ`
                : `${Number(data.estimated_cost || 0).toLocaleString()} VNĐ`
              }
            </Text>
          </View>

          {/* Save button — only in edit mode */}
          {isEditing && (
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Save color="#FFF" size={16} />
                  <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Warranty Info Card (If Completed & has warranty) */}
        {['completed', 'returned'].includes(data.status) && (
          <View style={[styles.card, styles.warrantyCard]}>
            <View style={styles.deviceHeader}>
              <CheckCircle2 color="#10B981" size={20} />
              <Text style={[styles.sectionTitle, { color: '#059669' }]}>Thông tin bảo hành điện tử</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.deviceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Thời hạn bảo hành</Text>
                <Text style={[styles.value, { fontWeight: '700', color: data.warranty_period > 0 ? '#10B981' : '#64748B' }]}>
                  {data.warranty_period > 0 ? `${data.warranty_period} tháng` : 'Không bảo hành'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Ngày hết hạn</Text>
                <Text style={[styles.value, { fontWeight: '700', color: data.warranty_expiry ? '#2563EB' : '#64748B' }]}>
                  {data.warranty_expiry ? new Date(data.warranty_expiry).toLocaleDateString('vi-VN') : '—'}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Điều khoản bảo hành</Text>
            <View style={[styles.issueBox, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7', borderWidth: 1 }]}>
              <Text style={[styles.issueText, { color: '#065F46', fontSize: 13, fontStyle: 'italic' }]}>
                {data.warranty_terms || 'Không có điều khoản riêng (áp dụng điều khoản chung của cửa hàng).'}
              </Text>
            </View>
          </View>
        )}

        {/* Progress Card */}
        <View style={styles.card}>
          <View style={styles.deviceHeader}>
            <CheckCircle2 color="#434655" size={20} />
            <Text style={styles.sectionTitle}>Tiến độ sửa chữa</Text>
          </View>

          <View style={styles.stepperContainer}>
            {steps.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isActive    = step.id === currentStep;
              const isLast      = index === steps.length - 1;

              return (
                <View key={step.id} style={styles.stepItem}>
                  <View style={styles.stepIndicator}>
                    {isCompleted ? (
                      <CheckCircle color="#2563EB" size={20} fill="#2563EB" />
                    ) : isActive ? (
                      <View style={styles.activeStepIcon}>
                        <View style={styles.activeStepInner} />
                      </View>
                    ) : (
                      <Circle color="#C3C6D7" size={20} />
                    )}
                    {!isLast && (
                      <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>
                      {step.title}
                    </Text>
                    {(step.time || step.subtitle) && (
                      <Text style={styles.stepSubtitle}>{step.time || step.subtitle}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {!isEditing && data.status !== 'completed' && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.actionBtn, stepping && styles.actionBtnDisabled]}
            onPress={handleNextStep}
            disabled={stepping}
          >
            {stepping ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.actionBtnText}>Hoàn thành bước tiếp theo</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      {data.status === 'completed' && (
        <View style={styles.bottomAction}>
          <View style={styles.completedBar}>
            <Text style={styles.completedBarText}>🎉 Đơn đã hoàn thành</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#191B23',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F3FE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E2ED',
  },
  statusTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#191B23',
  },
  statusTime: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#434655',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C3C6D7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#191B23',
    marginBottom: 4,
  },
  customerPhone: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#434655',
    marginBottom: 4,
  },
  customerAddress: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#434655',
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#004AC6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#191B23',
  },
  deviceRow: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 12,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#434655',
    marginBottom: 4,
  },
  value: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#191B23',
  },
  issueBox: {
    backgroundColor: '#EDEDF9',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  issueText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#191B23',
    lineHeight: 20,
  },
  // Edit controls
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  editBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#004AC6',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cancelBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  // Inputs
  inputTextArea: {
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#191B23',
    backgroundColor: '#F8FBFF',
    minHeight: 90,
    marginBottom: 4,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#434655',
    flex: 1,
  },
  costValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#191B23',
  },
  costInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inputCost: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#004AC6',
    minWidth: 80,
    maxWidth: 140,
  },
  inputCostUnit: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#191B23',
  },
  totalValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#004AC6',
  },
  // Save button
  saveBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#004AC6',
    paddingVertical: 13,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  // Stepper
  stepperContainer: {
    marginTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepIndicator: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    minHeight: 24,
    marginVertical: 4,
  },
  stepLineCompleted: {
    backgroundColor: '#2563EB',
  },
  activeStepIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 24,
  },
  stepTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#434655',
    fontWeight: '500',
  },
  stepTitleActive: {
    color: '#004AC6',
    fontWeight: '600',
  },
  stepSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#737686',
    marginTop: 2,
  },
  // Bottom bar
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionBtn: {
    backgroundColor: '#004AC6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  actionBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  statusCardDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusTimeDone: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  completedBar: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  completedBarText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  deviceImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadImageBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  uploadImageBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
  },
  noImageText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 10,
  },
  warrantyCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FAFDFB',
  },
});

export default RepairDetailScreen;
