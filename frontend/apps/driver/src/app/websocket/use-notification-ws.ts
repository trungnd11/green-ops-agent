import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';

export function useNotificationWs() {
  const clientRef = useRef<Client | null>(null);
  const qc = useQueryClient();

  const onMessage = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['driver-notifications'] });
    qc.invalidateQueries({ queryKey: ['driver-notifications-unread'] });
  }, [qc]);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('xanhsm-driver-auth') || '{}');
    if (!session.token) return;

    const client = new Client({
      brokerURL: `ws://${window.location.host}/api/v1/ws`,
      connectHeaders: { Authorization: `Bearer ${session.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        const topic = `/user/${session.driverId}/queue/notifications`;
        client.subscribe(topic, () => onMessage());
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [onMessage]);

  return null;
}
