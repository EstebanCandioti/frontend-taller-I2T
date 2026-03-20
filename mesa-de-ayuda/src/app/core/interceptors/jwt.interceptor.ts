import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ApiResponse } from '../models';

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
      if (error.status === 400) {
        const apiError = error.error as ApiResponse<void>;
        if (apiError?.errors && Object.keys(apiError.errors).length > 0) {
          // Propagar con errores por campo intactos para que el formulario los mapee
          return throwError(() => ({
            status: 400,
            message: apiError.message,
            errors: apiError.errors
          }));
        }
        // 400 sin errores de campo → toast generico
        toast.error(apiError?.message || 'Error de validacion.');
      } else if (error.status === 409) {
        const apiError = error.error as ApiResponse<void>;
        toast.error(apiError?.message || 'Conflicto con datos existentes.');
      } else if (error.status === 401) {
        auth.logout();
        toast.error('Su sesion ha expirado. Inicie sesion nuevamente.');
      } else if (error.status === 403) {
        // Silencioso: el roleGuard ya redirige, no revelar rutas restringidas
      } else if (error.status === 404) {
        const apiError = error.error as ApiResponse<void>;
        toast.error(apiError?.message || 'Recurso no encontrado.');
      } else if (error.status >= 500) {
        toast.error('Error interno del servidor. Intente nuevamente.');
      } else if (error.status === 0) {
        toast.error('No se puede conectar con el servidor.');
      }
      return throwError(() => error);
    })
  );
};
