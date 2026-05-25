import { useEffect, useRef } from 'react';
import { API_V1_URL } from '../utils/api.js';

const POLL_MS = 3000;

/**
 * Poll trạng thái thanh toán CK (bắt khi SePay webhook đã cập nhật DB).
 */
export function useOrderPaymentPoll({ orderId, guestPhone, enabled, onPaid }) {
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    if (!enabled || !orderId || !guestPhone) return;

    let stopped = false;

    const check = async () => {
      try {
        const params = new URLSearchParams({ phone: guestPhone });
        const res = await fetch(
          `${API_V1_URL}/orders/${orderId}/payment-status?${params}`
        );
        const data = await res.json();
        if (stopped || !data.success) return;
        if (data.data?.payment_status === 'paid') {
          onPaidRef.current?.(data.data);
        }
      } catch {
        /* ignore */
      }
    };

    check();
    const timer = window.setInterval(check, POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [orderId, guestPhone, enabled]);
}
