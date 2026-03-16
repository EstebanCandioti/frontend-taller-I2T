import { Injectable, inject, signal, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { ToastService } from './toast.service';
import { WsNotification } from '../models';

export interface AppNotification extends WsNotification {
  id: string;
  leida: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly ws = inject(WebSocketService);
  private readonly toast = inject(ToastService);
  private readonly STORAGE_KEY = 'mesa_notificaciones';
  private readonly MAX_NOTIFICATIONS = 50;

  private readonly notificationsSignal = signal<AppNotification[]>([]);
  private initialized = false;
  private subscriptions: Subscription[] = [];

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = computed(() => this.notificationsSignal().filter(n => !n.leida).length);
  readonly connectionStatus = signal(false);

  constructor() {
    this.loadFromStorage();
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.subscriptions.push(
      this.ws.notifications$.subscribe(rawNotification => {
        const notification: AppNotification = {
          ...rawNotification,
          id: rawNotification.id || crypto.randomUUID(),
          leida: rawNotification.leida ?? false
        };
        this.addNotification(notification);
        this.showToast(notification);
      }),
      this.ws.connectionStatus$.subscribe(status => {
        this.connectionStatus.set(status);
      })
    );
  }

  markAsRead(id: string): void {
    const updated = this.notificationsSignal().map(n =>
      n.id === id ? { ...n, leida: true } : n
    );
    this.notificationsSignal.set(updated);
    this.saveToStorage(updated);
  }

  markAllAsRead(): void {
    const updated = this.notificationsSignal().map(n => ({ ...n, leida: true }));
    this.notificationsSignal.set(updated);
    this.saveToStorage(updated);
  }

  clear(): void {
    this.clearNotifications();
  }

  clearNotifications(): void {
    this.notificationsSignal.set([]);
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  getRouteForNotification(n: AppNotification): string | null {
    const entity = n.entidad?.toLowerCase();
    const id = n.registroId;
    if (!entity || !id) return null;

    switch (entity) {
      case 'ticket': return `/tickets/${id}`;
      case 'hardware': return `/hardware/${id}`;
      case 'software': return `/software/${id}/editar`;
      case 'contrato': return `/contratos/${id}`;
      default: return null;
    }
  }

  private addNotification(notification: AppNotification): void {
    const updated = [notification, ...this.notificationsSignal()];
    const trimmed = updated.slice(0, this.MAX_NOTIFICATIONS);
    this.notificationsSignal.set(trimmed);
    this.saveToStorage(trimmed);
  }

  private showToast(notification: WsNotification): void {
    this.toast.info(notification.mensaje);
  }

  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const notificaciones = JSON.parse(stored) as WsNotification[];
      const normalized = (notificaciones ?? []).map(n => ({
        ...n,
        id: n.id || crypto.randomUUID(),
        leida: n.leida ?? false
      }));

      this.notificationsSignal.set(normalized.slice(0, this.MAX_NOTIFICATIONS));
    } catch {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private saveToStorage(notificaciones: AppNotification[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(notificaciones));
    } catch {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
