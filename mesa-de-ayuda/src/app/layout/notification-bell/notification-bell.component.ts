import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="notification-bell">
      <button class="bell-btn" (click)="toggleDropdown()" [class.has-unread]="notificationService.unreadCount() > 0"
        title="Notificaciones">
        <span class="material-icon">notifications</span>
        @if (notificationService.unreadCount() > 0) {
          <span class="badge">{{ notificationService.unreadCount() > 9 ? '9+' : notificationService.unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="dropdown">
          <div class="dropdown-header">
            <span class="dropdown-title">Notificaciones</span>
            @if (notificationService.unreadCount() > 0) {
              <button class="btn-mark-read" (click)="notificationService.markAllAsRead()">
                Marcar todas como leidas
              </button>
            }
          </div>

          <div class="dropdown-body">
            @if (notificationService.notifications().length === 0) {
              <div class="empty-notif">
                <span class="material-icon empty-icon">notifications_none</span>
                <span>Sin notificaciones</span>
              </div>
            } @else {
              @for (n of notificationService.notifications(); track n.id ?? $index) {
                <div class="notif-item" [class.unread]="!n.leida"
                  (click)="onNotificationClick(n)">
                  <div class="notif-icon-wrapper">
                    <span class="material-icon notif-type-icon">{{ getIcon(n) }}</span>
                  </div>
                  <div class="notif-content">
                    <span class="notif-message">{{ formatMessage(n.mensaje) }}</span>
                    <span class="notif-time">{{ n.fecha | date:'dd/MM HH:mm' }}</span>
                  </div>
                  @if (!n.leida) {
                    <span class="unread-dot"></span>
                  }
                </div>
              }
            }
          </div>

          @if (!notificationService.connectionStatus()) {
            <div class="connection-warning">
              <span class="material-icon">wifi_off</span>
              Reconectando...
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent {
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly elRef = inject(ElementRef);

  readonly open = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  toggleDropdown(): void {
    this.open.update(v => !v);
  }

  onNotificationClick(n: AppNotification): void {
    this.notificationService.markAsRead(n.id);
    const route = this.notificationService.getRouteForNotification(n);
    if (route) {
      // Si ya estamos en la misma ruta base (ej. /tickets/X), forzar navegacion
      if (this.router.url.split('?')[0] === route) {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigateByUrl(route);
        });
      } else {
        this.router.navigateByUrl(route);
      }
      this.open.set(false);
    }
  }

  formatMessage(msg: string): string {
    return msg
      .replace(/\bEN_CURSO\b/g, 'En Curso')
      .replace(/\bSOLICITADO\b/g, 'Solicitado')
      .replace(/\bASIGNADO\b/g, 'Asignado')
      .replace(/\bCERRADO\b/g, 'Cerrado')
      .replace(/\bCRITICA\b/g, 'Critica')
      .replace(/\bALTA\b/g, 'Alta')
      .replace(/\bMEDIA\b/g, 'Media')
      .replace(/\bBAJA\b/g, 'Baja');
  }

  getIcon(n: AppNotification): string {
    switch (n.entidad?.toLowerCase()) {
      case 'ticket': return 'confirmation_number';
      case 'hardware': return 'computer';
      case 'software': return 'apps';
      case 'contrato': return 'description';
      default: return 'info';
    }
  }
}
