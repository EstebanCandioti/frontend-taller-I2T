import { Injectable, inject, signal, computed } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { ToastService } from './toast.service';
import { WsNotification } from '../models';

export interface AppNotification extends WsNotification {
  leida: boolean;
}

const MAX_NOTIFICATIONS = 15;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly ws = inject(WebSocketService);
  private readonly toast = inject(ToastService);

  private readonly notificationsSignal = signal<AppNotification[]>([]);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = computed(() => this.notificationsSignal().filter(n => !n.leida).length);
  readonly connectionStatus = signal(false);

  init(): void {
    this.ws.notifications$.subscribe(notification => {
      this.addNotification(notification);
      this.showToast(notification);
    });

    this.ws.connectionStatus$.subscribe(status => {
      this.connectionStatus.set(status);
    });
  }

  markAsRead(index: number): void {
    this.notificationsSignal.update(list => {
      const copy = [...list];
      if (copy[index]) {
        copy[index] = { ...copy[index], leida: true };
      }
      return copy;
    });
  }

  markAllAsRead(): void {
    this.notificationsSignal.update(list =>
      list.map(n => ({ ...n, leida: true }))
    );
  }

  clear(): void {
    this.notificationsSignal.set([]);
  }

  getRouteForNotification(n: AppNotification): string | null {
    const entity = n.entidad?.toLowerCase();
    const id = n.registroId;
    if (!entity || !id) return null;

    switch (entity) {
      case 'ticket': return `/tickets/${id}/detalle`;
      case 'hardware': return `/hardware/${id}/detalle`;
      case 'software': return `/software/${id}/editar`;
      case 'contrato': return `/contratos/${id}/detalle`;
      default: return null;
    }
  }

  private addNotification(notification: WsNotification): void {
    const appNotif: AppNotification = { ...notification, leida: false };
    this.notificationsSignal.update(list => {
      const updated = [appNotif, ...list];
      return updated.slice(0, MAX_NOTIFICATIONS);
    });
  }

  private showToast(notification: WsNotification): void {
    this.toast.info(notification.mensaje);
  }
}
