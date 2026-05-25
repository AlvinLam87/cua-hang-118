import { useEffect, useRef } from 'react';
import { createAppSocket } from '../utils/socket.js';

const POLL_MS = 8000;

/**
 * Socket (tức thì) + polling dự phòng (tối đa ~8s) — admin không cần F5.
 */
export function useAdminOrderRealtime(onOrderEvent) {
  const handlerRef = useRef(onOrderEvent);
  handlerRef.current = onOrderEvent;

  useEffect(() => {
    const socket = createAppSocket();

    const emit = (data) => {
      if (!data) return;
      if (data.type && data.type !== 'order') return;
      handlerRef.current?.(data);
    };

    socket.on('connect', () => {
      console.log('✅ [Socket] Admin orders connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket] Admin orders connect_error:', err.message);
    });

    socket.on('new_product_order', emit);
    socket.on('data_changed', emit);

    const onWindowEvent = (event) => emit(event?.detail);
    window.addEventListener('admin-data-update', onWindowEvent);

    const pollTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      handlerRef.current?.({ type: 'order', action: 'poll' });
    }, POLL_MS);

    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener('admin-data-update', onWindowEvent);
      socket.disconnect();
    };
  }, []);
}
