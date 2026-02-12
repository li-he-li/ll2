import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEMessage {
  type: 'message' | 'status' | 'error' | 'complete';
  data: {
    id?: string;
    senderId?: string;
    senderRole?: 'publisher' | 'bargainer';
    content?: string;
    timestamp?: string;
    status?: string;
    finalPrice?: number;
    error?: string;
  };
}

export function useSSE(url: string) {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'message':
            setMessages(prev => [...prev, message]);
            break;
          case 'status':
            setStatus(message.data.status || null);
            break;
          case 'complete':
            setIsComplete(true);
            setStatus(message.data.status || 'completed');
            setFinalPrice(message.data.finalPrice || null);
            eventSource.close();
            break;
          case 'error':
            setError(message.data.error || 'Unknown error');
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setError('Connection error');
      setIsConnected(false);
    };
  }, [url]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    messages,
    status,
    isConnected,
    isComplete,
    finalPrice,
    error,
    reconnect: connect,
    disconnect,
  };
}
