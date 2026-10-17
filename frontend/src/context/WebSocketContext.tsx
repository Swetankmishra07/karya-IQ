import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getAccessToken } from '@/api/client';
import { WsBaseEvent } from '@/types';

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: WsBaseEvent | null;
  sendMessage: (msg: string | object) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { info } = useToast();
  const queryClient = useQueryClient();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<WsBaseEvent | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const retryCountRef = useRef<number>(0);

  const getWsUrl = useCallback(() => {
    const token = getAccessToken();
    if (!token) return null;

    const apiBase = import.meta.env.VITE_API_BASE_URL;
    let url: string;

    if (apiBase && apiBase.startsWith('http')) {
      const wsProto = apiBase.startsWith('https') ? 'wss:' : 'ws:';
      const host = apiBase.replace(/^https?:\/\//, '');
      url = `${wsProto}//${host}/ws?token=${encodeURIComponent(token)}`;
    } else {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      url = `${wsProto}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
    }

    return url;
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated) return;

    const url = getWsUrl();
    if (!url) return;

    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0;

        // Start heartbeat ping
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data: WsBaseEvent = JSON.parse(event.data);
          if (data.type === 'pong') return; // Ignore heartbeat responses

          setLastEvent(data);

          // Reactively invalidate React Query caches based on event type
          if (data.type?.startsWith('task.')) {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (data.task_id) {
              queryClient.invalidateQueries({ queryKey: ['task', data.task_id] });
              queryClient.invalidateQueries({ queryKey: ['activity', data.task_id] });
            }
            if (data.type === 'task.created') {
              info('Task Created', data.title ? `"${data.title}" was created` : undefined);
            }
          } else if (data.type?.startsWith('comment.')) {
            if (data.task_id) {
              queryClient.invalidateQueries({ queryKey: ['comments', data.task_id] });
              queryClient.invalidateQueries({ queryKey: ['activity', data.task_id] });
            }
          } else if (data.type?.startsWith('notification.')) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          } else if (data.type === 'activity') {
            if (data.task_id) {
              queryClient.invalidateQueries({ queryKey: ['activity', data.task_id] });
            }
          }
        } catch {
          // Non-JSON message (e.g. plain text)
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Schedule reconnection with exponential backoff if user is still logged in
        if (isAuthenticated) {
          const timeout = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
          retryCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, timeout);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      // Graceful fallback to HTTP polling if WebSocket fails
      setIsConnected(false);
    }
  }, [isAuthenticated, getWsUrl, queryClient, info]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    }

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isAuthenticated, connect]);

  const sendMessage = useCallback((msg: string | object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
      socketRef.current.send(payload);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
