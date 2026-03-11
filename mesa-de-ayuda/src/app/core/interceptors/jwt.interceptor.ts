import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  // No agregar token al login
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  const token = auth.token;
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        toast.error('Su sesión ha expirado. Inicie sesión nuevamente.');
      } else if (error.status === 403) {
        toast.error('No tiene permisos para realizar esta acción.');
      } else if (error.status === 0) {
        toast.error('No se puede conectar con el servidor.');
      }
      return throwError(() => error);
    })
  );
};
