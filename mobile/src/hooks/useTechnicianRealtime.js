import { useEffect, useRef } from 'react';
import {
  subscribeTechnicianRealtime,
  createDebouncedRefresh,
  isRepairEvent,
  isBookingEvent,
  getRepairId,
} from '../api/realtime';

/**
 * @param {Object} options
 * @param {() => void} options.onRefresh — gọi API tải lại danh sách
 * @param {(payload) => void} [options.onPayload] — patch optimistic / toast
 * @param {number} [options.debounceMs]
 * @param {boolean} [options.enabled]
 */
export function useTechnicianRealtime({
  onRefresh,
  onPayload,
  debounceMs = 300,
  enabled = true,
}) {
  const onRefreshRef = useRef(onRefresh);
  const onPayloadRef = useRef(onPayload);
  onRefreshRef.current = onRefresh;
  onPayloadRef.current = onPayload;

  useEffect(() => {
    if (!enabled) return undefined;

    const debouncedRefresh = createDebouncedRefresh(() => {
      onRefreshRef.current?.();
    }, debounceMs);

    const unsubscribe = subscribeTechnicianRealtime((payload) => {
      onPayloadRef.current?.(payload);
      if (isRepairEvent(payload) || isBookingEvent(payload)) {
        debouncedRefresh();
      }
    });

    return unsubscribe;
  }, [enabled, debounceMs]);
}

export { isRepairEvent, isBookingEvent, getRepairId };
