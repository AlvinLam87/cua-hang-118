const express = require('express');
const router = express.Router();
const { RepairOrder, RepairStep, Customer } = require('../models');
const { Op } = require('sequelize');
const { isWarrantyActive } = require('../utils/warranty');

// GET /api/v1/tracking?q=RCV-118001 hoặc ?q=0704818118
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã biên nhận hoặc số điện thoại.' });
    }

    const trimmed = q.trim();

    // Tìm theo mã biên nhận
    let order = await RepairOrder.findOne({
      where: { receipt_code: trimmed.toUpperCase() },
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { model: RepairStep, as: 'steps', order: [['step_order', 'ASC']] },
      ],
    });

    // Nếu không tìm thấy, thử tìm theo SĐT
    if (!order) {
      const customer = await Customer.findOne({ where: { phone: trimmed } });
      if (customer) {
        order = await RepairOrder.findOne({
          where: { customer_id: customer.id },
          include: [
            { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
            { model: RepairStep, as: 'steps', order: [['step_order', 'ASC']] },
          ],
          order: [['received_date', 'DESC']],
        });
      }
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn sửa chữa phù hợp.' });
    }

    const statusLabels = {
      received: 'Đã tiếp nhận',
      diagnosing: 'Đang chẩn đoán',
      quoted: 'Đã báo giá',
      in_progress: 'Đang sửa chữa',
      testing: 'Đang kiểm tra',
      completed: 'Hoàn thành',
      returned: 'Đã bàn giao',
      cancelled: 'Đã hủy',
    };

    // Nếu không có bước nào trong DB, tạo các bước mặc định dựa trên status
    let steps = [];
    if (order.steps && order.steps.length > 0) {
      steps = order.steps.map((s) => ({
        label: s.label,
        done: s.is_done,
        date: s.completed_date || null,
      }));
    } else {
      const defaultSteps = [
        { label: 'Tiếp nhận thiết bị', key: 'received' },
        { label: 'Kiểm tra & Báo giá', key: 'quoted' },
        { label: 'Tiến hành sửa chữa', key: 'in_progress' },
        { label: 'Kiểm tra chất lượng', key: 'testing' },
        { label: 'Sẵn sàng bàn giao', key: 'completed' }
      ];

      const statusWeight = {
        received: 1,
        diagnosing: 1,
        quoted: 2,
        in_progress: 3,
        testing: 4,
        completed: 5,
        returned: 5,
        cancelled: 0
      };

      const currentWeight = statusWeight[order.status] || 0;

      steps = defaultSteps.map((s, idx) => ({
        label: s.label,
        done: currentWeight >= (idx + 1),
        date: currentWeight >= (idx + 1) ? order.received_date : null
      }));
    }

    // Check if warranty is active and no open warranty child exists
    const warrantyActive = isWarrantyActive(order);
    const isWarrantyOrder = order.device_name?.startsWith('[Bảo Hành]');
    let openWarrantyOrder = null;
    if (warrantyActive && !isWarrantyOrder && ['completed', 'returned'].includes(order.status)) {
      openWarrantyOrder = await RepairOrder.findOne({
        where: {
          notes: { [Op.like]: `%đơn gốc #${order.receipt_code}%` },
          status: { [Op.in]: ['received', 'diagnosing', 'quoted', 'in_progress', 'testing'] },
        },
        attributes: ['id', 'receipt_code', 'status'],
      });
    }
    const canReceiveWarranty = warrantyActive && !isWarrantyOrder && !openWarrantyOrder && ['completed', 'returned'].includes(order.status);

    res.json({
      success: true,
      data: {
        repairId: order.id,
        receiptCode: order.receipt_code,
        device: order.device_name,
        customer: order.customer?.name,
        phone: order.customer?.phone,
        receivedDate: order.received_date,
        status: order.status,
        statusLabel: statusLabels[order.status] || order.status,
        technician: order.technician_name,
        issue: order.issue,
        diagnosis: order.diagnosis,
        estimatedCost: order.estimated_cost,
        finalCost: order.final_cost,
        completedDate: order.completed_date,
        warrantyPeriod: order.warranty_period,
        warrantyExpiry: order.warranty_expiry,
        warrantyTerms: order.warranty_terms,
        canReceiveWarranty,
        openWarrantyOrder: openWarrantyOrder ? { id: openWarrantyOrder.id, receipt_code: openWarrantyOrder.receipt_code, status: openWarrantyOrder.status } : null,
        steps: steps,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
