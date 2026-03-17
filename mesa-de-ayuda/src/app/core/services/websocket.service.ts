import { Injectable, inject, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { WsNotification } from '../models';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly zone = inject(NgZone);

  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private currentToken: string | null = null;
  private manualDisconnect = false;

  private readonly notificationSubject = new Subject<WsNotification>();
  readonly notifications$ = this.notificationSubject.asObservable();

  private readonly connectionStatusSubject = new Subject<boolean>();
  readonly connectionStatus$ = this.connectionStatusSubject.asObservable();

  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;
  private readonly maxReconnectAttempts = 12;
  private reconnectAttempts = 0;
  private connected = false;

  connect(token: string): void {
    this.currentToken = token;
    this.manualDisconnect = false;

    if (this.client?.active || this.client?.connected) return;

    this.cleanupClient();
    this.connectionStatusSubject.next(false);

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.buildSockJsUrl(token)),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 0, // manejamos reconexion manual con backoff
      onConnect: () => {
        this.zone.run(() => {
          this.connected = true;
          this.reconnectDelay = 1000;
          this.reconnectAttempts = 0;
          this.connectionStatusSubject.next(true);
          this.clearReconnectTimer();
          this.subscribeToChannels();
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        this.zone.run(() => {
          this.connected = false;
          this.connectionStatusSubject.next(false);
          this.scheduleReconnect();
        });
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      },
      onWebSocketClose: () => {
        this.zone.run(() => {
          this.connected = false;
          this.connectionStatusSubject.next(false);
          this.cleanupSubscriptions();
          this.scheduleReconnect();
        });
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    this.manualDisconnect = true;
    this.currentToken = null;
    this.clearReconnectTimer();
    this.connected = false;
    this.cleanupClient();

    this.connectionStatusSubject.next(false);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private subscribeToChannels(): void {
    if (!this.client?.connected) return;

    // Canal privado: notificaciones dirigidas al usuario autenticado
    const queueSub = this.client.subscribe('/user/queue/notificaciones', (msg: IMessage) => {
      this.handleMessage(msg);
    });
    this.subscriptions.push(queueSub);
  }

  private handleMessage(msg: IMessage): void {
    try {
      const notification: WsNotification = JSON.parse(msg.body);
      this.zone.run(() => {
        this.notificationSubject.next(notification);
      });
    } catch (e) {
      console.error('Error parsing WS notification:', e);
    }
  }

  private scheduleReconnect(): void {
    if (this.manualDisconnect || !this.currentToken || this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('WS max reconnect attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.manualDisconnect || !this.currentToken) return;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect(this.currentToken);
    }, this.reconnectDelay);
  }

  private buildSockJsUrl(token: string): string {
    const url = new URL(environment.wsUrl, window.location.origin);

    if (url.protocol === 'ws:') {
      url.protocol = 'http:';
    } else if (url.protocol === 'wss:') {
      url.protocol = 'https:';
    }

    url.searchParams.set('token', token);
    return url.toString();
  }

  private cleanupClient(): void {
    this.cleanupSubscriptions();

    if (this.client) {
      try { this.client.deactivate(); } catch {}
      this.client = null;
    }
  }

  private cleanupSubscriptions(): void {
    this.subscriptions.forEach(s => {
      try { s.unsubscribe(); } catch {}
    });
    this.subscriptions = [];
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
