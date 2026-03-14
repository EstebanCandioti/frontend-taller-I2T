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

  private readonly notificationSubject = new Subject<WsNotification>();
  readonly notifications$ = this.notificationSubject.asObservable();

  private readonly connectionStatusSubject = new Subject<boolean>();
  readonly connectionStatus$ = this.connectionStatusSubject.asObservable();

  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;
  private connected = false;

  connect(token: string): void {
    if (this.client?.connected) return;

    this.disconnect();

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
          this.connectionStatusSubject.next(true);
          this.subscribeToChannels();
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        this.zone.run(() => {
          this.connected = false;
          this.connectionStatusSubject.next(false);
        });
      },
      onWebSocketClose: () => {
        this.zone.run(() => {
          if (this.connected) {
            this.connected = false;
            this.connectionStatusSubject.next(false);
            this.scheduleReconnect(token);
          }
        });
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    this.connected = false;
    this.subscriptions.forEach(s => {
      try { s.unsubscribe(); } catch {}
    });
    this.subscriptions = [];

    if (this.client) {
      try { this.client.deactivate(); } catch {}
      this.client = null;
    }

    this.connectionStatusSubject.next(false);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private subscribeToChannels(): void {
    if (!this.client?.connected) return;

    // Canal broadcast: notificaciones para todos los usuarios con permisos
    const topicSub = this.client.subscribe('/topic/notificaciones', (msg: IMessage) => {
      this.handleMessage(msg);
    });
    this.subscriptions.push(topicSub);

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

  private scheduleReconnect(token: string): void {
    setTimeout(() => {
      if (!this.connected && this.client === null) return; // ya se desconecto intencionalmente
      console.log(`WS reconnecting in ${this.reconnectDelay}ms...`);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect(token);
    }, this.reconnectDelay);
  }

  private buildSockJsUrl(token: string): string {
    const url = new URL(environment.wsUrl);

    if (url.protocol === 'ws:') {
      url.protocol = 'http:';
    } else if (url.protocol === 'wss:') {
      url.protocol = 'https:';
    }

    url.searchParams.set('token', token);
    return url.toString();
  }
}
