import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, CurrentUser, Rol } from '../models';
import { WebSocketService } from './websocket.service';
import { NotificationService } from './notification.service';

const USER_KEY = 'mesa_ayuda_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ws = inject(WebSocketService);
  private readonly notificationService = inject(NotificationService);

  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    this.loadUserFromStorage()
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(map(u => u !== null && !this.isTokenExpired()));
  readonly currentRole$ = this.currentUser$.pipe(map(u => u?.rol ?? null));

  private wsInitialized = false;

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.currentUser?.token ?? null;
  }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const loginData = response.data;
            const user: CurrentUser = {
              id: loginData.usuarioId,
              nombreCompleto: loginData.nombreCompleto,
              email: loginData.email,
              rol: this.normalizeRol(loginData.rol),
              token: loginData.token
            };
            this.setUser(user);
            this.connectWebSocket(user.token);
          }
        })
      );
  }

  logout(): void {
    this.ws.disconnect();
    this.notificationService.clearNotifications();
    this.wsInitialized = false;
    sessionStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  hasRole(...roles: Rol[]): boolean {
    const user = this.currentUser;
    return user !== null && roles.includes(user.rol);
  }

  isTokenExpired(): boolean {
    const token = this.token;
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  /** Llamar desde app init o main-layout para reconectar si ya hay sesion */
  initWebSocketIfNeeded(): void {
    if (this.wsInitialized) return;
    const user = this.currentUser;
    if (user && !this.isTokenExpired()) {
      this.connectWebSocket(user.token);
    }
  }

  private connectWebSocket(token: string): void {
    if (this.wsInitialized || !environment.wsEnabled) return;
    this.wsInitialized = true;
    this.notificationService.init();
    this.ws.connect(token);
  }

  private setUser(user: CurrentUser): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private loadUserFromStorage(): CurrentUser | null {
    try {
      const stored = sessionStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /** Normaliza el rol quitando tildes para que coincida con el tipo Rol del frontend */
  private normalizeRol(rol: string): Rol {
    const normalized = rol.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const valid: Rol[] = ['Admin', 'Operario', 'Tecnico'];
    return valid.includes(normalized as Rol) ? (normalized as Rol) : 'Tecnico';
  }
}
