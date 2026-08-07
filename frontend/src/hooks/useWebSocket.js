import { useEffect, useRef } from 'react';

/**
 * Custom React hook for connecting to backend WebSockets and handling real-time events
 * @param {Object} eventHandlers - Mapping of event types to handler callbacks (e.g. { ORDER_UPDATED: () => reload() })
 */
export function useWebSocket(eventHandlers = {}) {
  const wsRef = useRef(null);
  const handlersRef = useRef(eventHandlers);

  // Keep handlers ref updated to avoid stale closures
  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    let timeoutId;
    let isDisposed = false;

    function connect() {
      // Determine WebSocket protocol and host automatically
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('⚡ Connected to VFabrica WebSocket server');
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            const { type, data } = parsed;

            if (type && handlersRef.current[type]) {
              handlersRef.current[type](data);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          if (!isDisposed) {
            console.warn('⚠️ WebSocket disconnected. Reconnecting in 3s...');
            timeoutId = setTimeout(connect, 3000);
          }
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          ws.close();
        };
      } catch (err) {
        console.error('Failed to create WebSocket instance:', err);
        if (!isDisposed) {
          timeoutId = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      isDisposed = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
}
